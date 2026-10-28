import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import sanitizeHtml from 'sanitize-html';

export const DELIVERY_CASE_SHEET_NAME = '납품요구현황(카테고리분류)';
export const DEFAULT_IMPORT_BATCH = 'delivery-cases-20261020-v7';

export const DELIVERY_CASE_HEADERS = [
  'URL 식별자',
  '목록순서',
  '사례명',
  '도입 수요기관 도로명(U열)',
  '설치장소',
  '요청건명',
  '설치 목적',
  '연결 제품 slug',
  '검색·목록 요약',
  '공개 상태 설명',
  '썸네일 (선택)',
  '상세 본문',
  '설치 일자',
  '고객·시설 유형',
  '설치 지역',
  '설치 전 문제',
  '적용한 해결 방법',
  '설치 결과',
  '적용 모델명',
  '화면 구성단',
  '화면 구성열',
  '적용 규격',
  '공사·설치 기간',
  '현장 제약과 대응',
  '작성자',
  '현장 확인·검수자',
  '근거·참고 링크',
  '품명',
];

const ALLOWED_PURPOSES = new Set([
  '행정홍보안내',
  '교육환경개선',
  '안전재난관제',
  '시설환경개선',
]);
const ALLOWED_PRODUCT_SLUGS = new Set([
  'information-led-board',
  'video-wall',
  'outdoor-kiosk',
]);

function rowError(rowNumber, message) {
  return new Error(`Excel ${rowNumber}행: ${message}`);
}

function assertNoNul(value, context) {
  if (typeof value === 'string' && value.includes('\0'))
    throw new Error(`${context}에 NUL 문자를 사용할 수 없습니다.`);
}

function stringifyCellObject(value, context) {
  if (value.formula != null || value.sharedFormula != null)
    throw new Error(`${context}에는 수식 셀을 사용할 수 없습니다.`);
  if (Array.isArray(value.richText))
    return value.richText.map((part) => part.text ?? '').join('');
  if (value.text != null) return String(value.text);
  if (value.result != null) return value.result;
  throw new Error(`${context}의 셀 형식을 읽을 수 없습니다.`);
}

function readCellValue(cell, context) {
  const value = cell.value;
  if (value == null || value instanceof Date) return value;
  if (typeof value === 'object') return stringifyCellObject(value, context);
  return value;
}

export function normalizePlainText(value, context = '값') {
  if (value == null) return '';
  const scalar =
    typeof value === 'object'
      ? stringifyCellObject(value, context)
      : String(value);
  assertNoNul(scalar, context);
  return scalar.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

function normalizeHeader(value) {
  return normalizePlainText(value, '헤더').replace(/^\uFEFF/u, '');
}

export function validateDeliveryCaseHeaders(headers) {
  const columns = new Map();
  headers.forEach((rawHeader, index) => {
    const header = normalizeHeader(rawHeader);
    if (!header) return;
    if (columns.has(header))
      throw new Error(`중복된 Excel 헤더입니다: ${header}`);
    columns.set(header, index + 1);
  });
  const missing = DELIVERY_CASE_HEADERS.filter(
    (header) => !columns.has(header),
  );
  if (missing.length)
    throw new Error(`필수 Excel 헤더가 없습니다: ${missing.join(', ')}`);
  return columns;
}

function splitLines(value, context, { deduplicate = false } = {}) {
  if (value == null) return [];
  const scalar =
    typeof value === 'object'
      ? stringifyCellObject(value, context)
      : String(value);
  assertNoNul(scalar, context);
  const items = scalar
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((item) => normalizePlainText(item, context))
    .filter(Boolean);
  return deduplicate ? [...new Set(items)] : items;
}

function normalizeInteger(value, context, { optional = false } = {}) {
  const text = normalizePlainText(value, context);
  if (!text && optional) return '';
  if (!/^\d+$/u.test(text))
    throw new Error(`${context}은(는) 양의 정수여야 합니다.`);
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number <= 0)
    throw new Error(`${context}은(는) 양의 정수여야 합니다.`);
  return number;
}

export function normalizeExcelDate(value, context = '설치 일자') {
  if (value == null || value === '') return '';
  let compact;
  if (value instanceof Date) {
    compact = [
      value.getUTCFullYear().toString().padStart(4, '0'),
      (value.getUTCMonth() + 1).toString().padStart(2, '0'),
      value.getUTCDate().toString().padStart(2, '0'),
    ].join('');
  } else {
    compact = normalizePlainText(value, context);
  }
  if (!/^\d{8}$/u.test(compact))
    throw new Error(`${context}은(는) YYYYMMDD 8자리여야 합니다.`);
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  )
    throw new Error(`${context}이(가) 실제 달력 날짜가 아닙니다.`);
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeThumbnail(value, context) {
  const thumbnail = normalizePlainText(value, context);
  if (thumbnail && !thumbnail.startsWith('/') && !isHttpUrl(thumbnail))
    throw new Error(`${context}은(는) / 경로 또는 http(s) URL이어야 합니다.`);
  return thumbnail;
}

function sanitizeEditorBody(value, context) {
  const body = value == null ? '' : String(value).trim();
  assertNoNul(body, context);
  return sanitizeHtml(body, {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'img',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'div',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attributes) => ({
        tagName: 'a',
        attribs: {
          ...attributes,
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      }),
    },
  });
}

export function normalizeDeliveryCaseRow(values, rowNumber = 2) {
  const get = (header) => values[header];
  let sortOrder;
  let installedAt;
  let displayRows;
  let displayColumns;
  try {
    sortOrder = normalizeInteger(get('목록순서'), '목록순서');
    installedAt = normalizeExcelDate(get('설치 일자'));
    displayRows = normalizeInteger(get('화면 구성단'), '화면 구성단', {
      optional: true,
    });
    displayColumns = normalizeInteger(get('화면 구성열'), '화면 구성열', {
      optional: true,
    });
  } catch (error) {
    throw rowError(rowNumber, error.message);
  }

  const sourceSlug = normalizePlainText(get('URL 식별자'), 'URL 식별자');
  const sourceTitle = normalizePlainText(get('사례명'), '사례명');
  const clientAddresses = splitLines(
    get('도입 수요기관 도로명(U열)'),
    '도입 수요기관 도로명(U열)',
  );
  const places = splitLines(get('설치장소'), '설치장소');
  const purpose = normalizePlainText(get('설치 목적'), '설치 목적');
  const productSlug = normalizePlainText(
    get('연결 제품 slug'),
    '연결 제품 slug',
  );
  const summary = normalizePlainText(get('검색·목록 요약'), '검색·목록 요약');
  const status = normalizePlainText(get('공개 상태 설명'), '공개 상태 설명');
  const thumbnail = normalizeThumbnail(get('썸네일 (선택)'), '썸네일 (선택)');
  const body = sanitizeEditorBody(get('상세 본문'), '상세 본문');
  const modelName = normalizePlainText(get('적용 모델명'), '적용 모델명');
  const specifications = splitLines(get('적용 규격'), '적용 규격', {
    deduplicate: true,
  });
  const constraints = splitLines(get('현장 제약과 대응'), '현장 제약과 대응', {
    deduplicate: true,
  });
  const sources = splitLines(get('근거·참고 링크'), '근거·참고 링크', {
    deduplicate: true,
  });
  const sourceUrls = sources.filter(isHttpUrl);
  const sourceLabels = sources.filter((value) => !isHttpUrl(value));

  const required = {
    'URL 식별자': sourceSlug,
    사례명: sourceTitle,
    '도입 수요기관 도로명(U열)': clientAddresses.join(' · '),
    설치장소: places.join(' · '),
    '설치 목적': purpose,
    '연결 제품 slug': productSlug,
    '검색·목록 요약': summary,
    '공개 상태 설명': status,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([header]) => header);
  if (missing.length)
    throw rowError(rowNumber, `필수값이 없습니다: ${missing.join(', ')}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(sourceSlug))
    throw rowError(
      rowNumber,
      `URL 식별자 형식이 올바르지 않습니다: ${sourceSlug}`,
    );
  if (!ALLOWED_PURPOSES.has(purpose))
    throw rowError(rowNumber, `알 수 없는 설치 목적입니다: ${purpose}`);
  if (!ALLOWED_PRODUCT_SLUGS.has(productSlug))
    throw rowError(rowNumber, `알 수 없는 제품 slug입니다: ${productSlug}`);

  const requestName = normalizePlainText(get('요청건명'), '요청건명');
  const productName = normalizePlainText(get('품명'), '품명');
  const warnings = [];
  if (!thumbnail) warnings.push('blankThumbnail');
  if (!body) warnings.push('blankBody');
  if (!installedAt) warnings.push('missingInstalledAt');
  if (!requestName) warnings.push('missingRequestName');
  if (!productName) warnings.push('missingProductName');
  if (!modelName) warnings.push('missingModelName');
  if (!displayRows || !displayColumns)
    warnings.push('missingDisplayConfiguration');
  if (!specifications.length) warnings.push('missingSpecifications');
  if (!sourceUrls.length) warnings.push('missingSourceUrl');
  if (clientAddresses.length > 1) warnings.push('multipleClientAddresses');
  if (places.length > 1) warnings.push('multiplePlaces');
  if (
    (clientAddresses.length > 1 || places.length > 1) &&
    clientAddresses.length !== places.length
  )
    warnings.push('addressPlaceLineCountMismatch');

  return {
    rowNumber,
    sourceSlug,
    sourceTitle,
    sortOrder,
    warnings,
    data: {
      title: sourceTitle,
      place: places.join(' · '),
      places,
      requestName,
      purpose,
      productSlug,
      summary,
      status,
      image: '',
      thumbnail,
      body,
      installedAt,
      clientType: normalizePlainText(get('고객·시설 유형'), '고객·시설 유형'),
      region: normalizePlainText(get('설치 지역'), '설치 지역'),
      challenge: normalizePlainText(get('설치 전 문제'), '설치 전 문제'),
      solution: normalizePlainText(get('적용한 해결 방법'), '적용한 해결 방법'),
      result: normalizePlainText(get('설치 결과'), '설치 결과'),
      modelName,
      displayRows,
      displayColumns,
      clientAddress: clientAddresses.join(' · '),
      clientAddresses,
      specifications,
      projectDuration: normalizePlainText(
        get('공사·설치 기간'),
        '공사·설치 기간',
      ),
      constraints,
      author: normalizePlainText(get('작성자'), '작성자'),
      reviewer: normalizePlainText(get('현장 확인·검수자'), '현장 확인·검수자'),
      sourceUrls,
      sourceLabels,
      productName,
    },
  };
}

export function normalizeDeliveryCaseRows(sourceRows, { expectedCount } = {}) {
  const rows = sourceRows.map(({ rowNumber, values }) =>
    normalizeDeliveryCaseRow(values, rowNumber),
  );
  if (expectedCount != null && rows.length !== expectedCount)
    throw new Error(
      `Excel 데이터 행 수가 예상과 다릅니다: expected=${expectedCount}, actual=${rows.length}`,
    );
  const seenOrders = new Map();
  for (const row of rows) {
    if (seenOrders.has(row.sortOrder))
      throw new Error(
        `목록순서가 중복되었습니다: ${row.sortOrder} (Excel ${seenOrders.get(row.sortOrder)}행, ${row.rowNumber}행)`,
      );
    seenOrders.set(row.sortOrder, row.rowNumber);
  }
  return rows.sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.rowNumber - right.rowNumber,
  );
}

export async function readDeliveryCaseWorkbook(
  filePath,
  { sheetName = DELIVERY_CASE_SHEET_NAME, expectedCount } = {},
) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet)
    throw new Error(`Excel 시트를 찾을 수 없습니다: ${sheetName}`);

  const headerValues = [];
  for (let column = 1; column <= worksheet.columnCount; column += 1) {
    headerValues.push(
      readCellValue(worksheet.getCell(1, column), `Excel 1행 ${column}열`),
    );
  }
  const columns = validateDeliveryCaseHeaders(headerValues);
  const sourceRows = [];
  for (
    let rowNumber = 2;
    rowNumber <= worksheet.actualRowCount;
    rowNumber += 1
  ) {
    const values = {};
    let hasValue = false;
    for (const header of DELIVERY_CASE_HEADERS) {
      const column = columns.get(header);
      const value = readCellValue(
        worksheet.getCell(rowNumber, column),
        `Excel ${rowNumber}행 ${header}`,
      );
      values[header] = value;
      if (value != null && String(value).trim()) hasValue = true;
    }
    if (hasValue) sourceRows.push({ rowNumber, values });
  }

  return {
    sheetName,
    workbookSha256: createHash('sha256')
      .update(readFileSync(filePath))
      .digest('hex'),
    rows: normalizeDeliveryCaseRows(sourceRows, { expectedCount }),
  };
}

function parseExistingData(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value) return {};
  return JSON.parse(value);
}

function allocateUnique(base, used, protectedBases, suffix) {
  if (!used.has(base)) return base;
  for (let number = 2; number < 1_000_000; number += 1) {
    const candidate = suffix(base, number);
    if (!used.has(candidate) && !protectedBases.has(candidate))
      return candidate;
  }
  throw new Error(`중복 번호를 할당할 수 없습니다: ${base}`);
}

function sourceRowHash(row) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        sourceSlug: row.sourceSlug,
        sourceTitle: row.sourceTitle,
        sortOrder: row.sortOrder,
        data: row.data,
      }),
    )
    .digest('hex');
}

export function planDeliveryCaseImport(
  rows,
  existingCases = [],
  { batchId = DEFAULT_IMPORT_BATCH } = {},
) {
  const normalizedBatchId = normalizePlainText(batchId, 'batch ID');
  if (!normalizedBatchId || normalizedBatchId.length > 100)
    throw new Error('batch ID는 1~100자여야 합니다.');

  const usedSlugs = new Set();
  const usedTitles = new Set();
  const existingByImportKey = new Map();
  let malformedExistingData = 0;
  for (const item of existingCases) {
    const slug = normalizePlainText(item.slug, '기존 slug');
    const title = normalizePlainText(item.title, '기존 title');
    if (slug) usedSlugs.add(slug);
    if (title) usedTitles.add(title);
    let data;
    try {
      data = parseExistingData(item.data);
    } catch {
      malformedExistingData += 1;
      continue;
    }
    const importKey =
      typeof data.importKey === 'string' ? data.importKey.trim() : '';
    if (!importKey) continue;
    if (existingByImportKey.has(importKey))
      throw new Error(`DB에 importKey가 중복되어 있습니다: ${importKey}`);
    existingByImportKey.set(importKey, { item, data });
  }

  const protectedSlugs = new Set(rows.map((row) => row.sourceSlug));
  const protectedTitles = new Set(rows.map((row) => row.sourceTitle));
  const records = [];
  const skipped = [];
  const slugRenames = [];
  const titleRenames = [];

  for (const row of rows) {
    const importKey = `${normalizedBatchId}:${row.sortOrder}`;
    const alreadyImported = existingByImportKey.get(importKey);
    const sourceHash = sourceRowHash(row);
    if (alreadyImported) {
      if (alreadyImported.data.sourceHash !== sourceHash)
        throw new Error(
          `같은 importKey의 원본 내용이 달라졌습니다: ${importKey}. 새 --batch-id를 사용하세요.`,
        );
      skipped.push({
        importKey,
        rowNumber: row.rowNumber,
        slug: alreadyImported.item.slug,
        title: alreadyImported.item.title,
      });
      continue;
    }

    const slug = allocateUnique(
      row.sourceSlug,
      usedSlugs,
      protectedSlugs,
      (base, number) => `${base}-${number}`,
    );
    usedSlugs.add(slug);
    const title = allocateUnique(
      row.sourceTitle,
      usedTitles,
      protectedTitles,
      (base, number) => `${base} ${number}`,
    );
    usedTitles.add(title);
    if (slug !== row.sourceSlug)
      slugRenames.push({
        rowNumber: row.rowNumber,
        from: row.sourceSlug,
        to: slug,
      });
    if (title !== row.sourceTitle)
      titleRenames.push({
        rowNumber: row.rowNumber,
        from: row.sourceTitle,
        to: title,
      });

    records.push({
      type: 'case',
      slug,
      title,
      data: {
        ...row.data,
        slug,
        title,
        sourceSlug: row.sourceSlug,
        sourceTitle: row.sourceTitle,
        sourceHash,
        importBatch: normalizedBatchId,
        importKey,
        importRow: row.rowNumber,
      },
      sort_order: row.sortOrder,
      published: false,
      warnings: row.warnings,
    });
  }

  return {
    batchId: normalizedBatchId,
    records,
    skipped,
    slugRenames,
    titleRenames,
    malformedExistingData,
  };
}

export function aggregateWarningCounts(rows) {
  const counts = {};
  for (const row of rows) {
    for (const warning of row.warnings)
      counts[warning] = (counts[warning] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function sqlLiteral(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new Error('유한한 숫자만 저장할 수 있습니다.');
    return String(value);
  }
  const text = String(value);
  assertNoNul(text, 'SQL 값');
  return `'${text.replaceAll("'", "''")}'`;
}

export function buildDeliveryCaseInsertSql(records) {
  return records
    .map((record) => {
      if (record.type !== 'case' || record.published !== false)
        throw new Error(
          '납품사례 import 레코드는 case/published=false여야 합니다.',
        );
      const statement = [
        'INSERT INTO content_items',
        '  (type, slug, title, data, sort_order, published)',
        `VALUES (${[
          record.type,
          record.slug,
          record.title,
          JSON.stringify(record.data),
          record.sort_order,
          0,
        ]
          .map(sqlLiteral)
          .join(', ')});`,
      ].join('\n');
      if (Buffer.byteLength(statement, 'utf8') > 95_000)
        throw new Error(
          `D1 문장 크기 제한에 가까운 레코드입니다: ${record.data.importKey}`,
        );
      return statement;
    })
    .join('\n');
}
