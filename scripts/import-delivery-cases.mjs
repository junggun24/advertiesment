import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  DEFAULT_IMPORT_BATCH,
  aggregateWarningCounts,
  buildDeliveryCaseInsertSql,
  planDeliveryCaseImport,
  readDeliveryCaseWorkbook,
} from './delivery-case-import-lib.mjs';

const DEFAULT_DATABASE = 'oic-korea-db';
const DEFAULT_CONFIG = 'wrangler.jsonc';
const DEFAULT_EXPECTED_COUNT = 134;

const HELP = `납품사례 Excel 일회성 import

기본 실행은 파일만 검사하는 dry-run이며 DB를 변경하지 않습니다.

사용법:
  npm run import:cases -- --file <xlsx>
  npm run import:cases -- --file <xlsx> --local
  npm run import:cases -- --file <xlsx> --local --apply
  npm run import:cases -- --file <xlsx> --remote
  npm run import:cases -- --file <xlsx> --remote --apply --confirm-remote oic-korea-db

옵션:
  --file <path>             원본 .xlsx 파일 (필수)
  --local                   로컬 D1을 조회/적용
  --remote                  원격 D1을 조회/적용
  --apply                   실제 INSERT 실행 (없으면 dry-run)
  --confirm-remote <name>   원격 적용 시 DB 이름을 다시 입력
  --database <name>         D1 이름 (기본: oic-korea-db)
  --config <path>           Wrangler 설정 (기본: wrangler.jsonc)
  --batch-id <value>        재실행 식별자 (기본: ${DEFAULT_IMPORT_BATCH})
  --expected-count <number> 입력 행 수 안전장치 (기본: 134)
  --help                    도움말
`;

function nextValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--'))
    throw new Error(`${option} 값이 필요합니다.`);
  return value;
}

export function parseCliArgs(argv) {
  const options = {
    file: '',
    target: null,
    apply: false,
    confirmRemote: '',
    database: DEFAULT_DATABASE,
    config: DEFAULT_CONFIG,
    batchId: DEFAULT_IMPORT_BATCH,
    expectedCount: DEFAULT_EXPECTED_COUNT,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--apply') {
      options.apply = true;
      continue;
    }
    if (argument === '--local' || argument === '--remote') {
      const target = argument.slice(2);
      if (options.target && options.target !== target)
        throw new Error('--local과 --remote는 함께 사용할 수 없습니다.');
      options.target = target;
      continue;
    }
    if (
      [
        '--file',
        '--confirm-remote',
        '--database',
        '--config',
        '--batch-id',
        '--expected-count',
      ].includes(argument)
    ) {
      const value = nextValue(argv, index, argument);
      index += 1;
      if (argument === '--file') options.file = value;
      if (argument === '--confirm-remote') options.confirmRemote = value;
      if (argument === '--database') options.database = value;
      if (argument === '--config') options.config = value;
      if (argument === '--batch-id') options.batchId = value;
      if (argument === '--expected-count') {
        const count = Number(value);
        if (!Number.isSafeInteger(count) || count <= 0)
          throw new Error('--expected-count는 양의 정수여야 합니다.');
        options.expectedCount = count;
      }
      continue;
    }
    throw new Error(`알 수 없는 옵션입니다: ${argument}`);
  }

  if (options.help) return options;
  if (!options.file) throw new Error('--file 옵션이 필요합니다.');
  if (!options.file.toLowerCase().endsWith('.xlsx'))
    throw new Error('--file은 .xlsx 파일이어야 합니다.');
  if (options.apply && !options.target)
    throw new Error('--apply에는 --local 또는 --remote가 필요합니다.');
  if (
    options.target === 'remote' &&
    options.apply &&
    options.confirmRemote !== options.database
  )
    throw new Error(
      `원격 적용에는 --confirm-remote ${options.database}가 필요합니다.`,
    );
  if (options.confirmRemote && options.target !== 'remote')
    throw new Error('--confirm-remote는 --remote와 함께 사용해야 합니다.');
  return options;
}

function targetArguments(options) {
  if (options.target === 'remote') return ['--remote'];
  return ['--local', '--persist-to', '.wrangler/state'];
}

function runWrangler(arguments_) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', ...arguments_],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      result.stderr ||
        result.stdout ||
        `Wrangler 실행 실패: ${arguments_.join(' ')}`,
    );
  return result.stdout;
}

function parseWranglerRows(output) {
  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed))
    throw new Error('Wrangler JSON 응답이 배열이 아닙니다.');
  return parsed[0]?.results ?? [];
}

function executeQuery(options, sql) {
  return parseWranglerRows(
    runWrangler([
      'd1',
      'execute',
      options.database,
      ...targetArguments(options),
      '--config',
      options.config,
      '--json',
      '--command',
      sql,
    ]),
  );
}

function queryExistingCases(options) {
  return executeQuery(
    options,
    [
      'SELECT id, slug, title, data, sort_order, published',
      'FROM content_items',
      "WHERE type = 'case'",
      'ORDER BY id',
    ].join(' '),
  );
}

function executeInsertFile(options, sql) {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), 'oic-delivery-case-import-'),
  );
  const sqlFile = join(temporaryDirectory, 'delivery-cases.sql');
  try {
    writeFileSync(sqlFile, `${sql}\n`, { mode: 0o600 });
    runWrangler([
      'd1',
      'execute',
      options.database,
      ...targetArguments(options),
      '--config',
      options.config,
      '--file',
      sqlFile,
      '--yes',
    ]);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function verifyAppliedRecords(batchRows, plan) {
  const byImportKey = new Map();
  for (const row of batchRows) {
    let data;
    try {
      data = JSON.parse(row.data);
    } catch {
      continue;
    }
    const importKey = data.importKey;
    if (typeof importKey !== 'string') continue;
    if (byImportKey.has(importKey))
      throw new Error(`적용 후 importKey 중복: ${importKey}`);
    byImportKey.set(importKey, { ...row, data });
  }

  for (const expected of plan.records) {
    const importKey = expected.data.importKey;
    const actual = byImportKey.get(importKey);
    if (!actual)
      throw new Error(`적용 후 레코드를 찾지 못했습니다: ${importKey}`);
    if (
      actual.slug !== expected.slug ||
      actual.title !== expected.title ||
      Number(actual.sort_order) !== expected.sort_order ||
      Number(actual.published) !== 0
    )
      throw new Error(`적용 후 레코드 값이 다릅니다: ${importKey}`);
  }
  for (const skipped of plan.skipped) {
    if (!byImportKey.has(skipped.importKey))
      throw new Error(
        `기존 import 레코드를 찾지 못했습니다: ${skipped.importKey}`,
      );
  }
}

function reportFor(options, workbook, existingCases, plan, applied) {
  return {
    mode: options.apply ? 'apply' : 'dry-run',
    target: options.target ?? 'file-only',
    databaseChecked: Boolean(options.target),
    sourceFile: resolve(options.file),
    sheet: workbook.sheetName,
    workbookSha256: workbook.workbookSha256,
    batchId: plan.batchId,
    sourceRows: workbook.rows.length,
    existingCases: options.target ? existingCases.length : null,
    alreadyImported: plan.skipped.length,
    ready: plan.records.length,
    applied,
    published: false,
    slugRenames: plan.slugRenames.length,
    slugRenameDetails: plan.slugRenames,
    titleRenames: plan.titleRenames.length,
    titleRenamePreview: plan.titleRenames.slice(0, 10),
    malformedExistingData: plan.malformedExistingData,
    warnings: aggregateWarningCounts(workbook.rows),
  };
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseCliArgs(argv);
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  const workbook = await readDeliveryCaseWorkbook(resolve(options.file), {
    expectedCount: options.expectedCount,
  });
  const existingCases = options.target ? queryExistingCases(options) : [];
  const plan = planDeliveryCaseImport(workbook.rows, existingCases, {
    batchId: options.batchId,
  });

  let applied = 0;
  if (options.apply && plan.records.length) {
    executeInsertFile(options, buildDeliveryCaseInsertSql(plan.records));
    const batchRows = queryExistingCases(options);
    verifyAppliedRecords(batchRows, plan);
    applied = plan.records.length;
  }

  process.stdout.write(
    `${JSON.stringify(
      reportFor(options, workbook, existingCases, plan, applied),
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  });
}
