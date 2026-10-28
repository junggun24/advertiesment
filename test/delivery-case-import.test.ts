import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  DELIVERY_CASE_HEADERS,
  aggregateWarningCounts,
  buildDeliveryCaseInsertSql,
  normalizeDeliveryCaseRow,
  normalizeDeliveryCaseRows,
  normalizeExcelDate,
  planDeliveryCaseImport,
  sqlLiteral,
  validateDeliveryCaseHeaders,
} from '../scripts/delivery-case-import-lib.mjs';
import { parseCliArgs } from '../scripts/import-delivery-cases.mjs';

function sourceValues(overrides: Record<string, unknown> = {}) {
  return {
    'URL 식별자': 'sample-case',
    목록순서: 10,
    사례명: '샘플 사례',
    '도입 수요기관 도로명(U열)': '서울시 중구 세종대로 1',
    설치장소: '본관 1층',
    요청건명: '영상장비 설치',
    '설치 목적': '행정홍보안내',
    '연결 제품 slug': 'video-wall',
    '검색·목록 요약': '검색용 요약',
    '공개 상태 설명': '관리자 검토 필요',
    '썸네일 (선택)': '',
    '상세 본문': '',
    '설치 일자': 20261020,
    '고객·시설 유형': '공공청사',
    '설치 지역': '서울',
    '설치 전 문제': '화면이 작음',
    '적용한 해결 방법': '멀티비전 설치',
    '설치 결과': '가독성 개선',
    '적용 모델명': 'MODEL-1',
    '화면 구성단': 2,
    '화면 구성열': 3,
    '적용 규격': '3.0m × 2.0m',
    '공사·설치 기간': '1일',
    '현장 제약과 대응': '운영 중 설치',
    작성자: '작성자',
    '현장 확인·검수자': '검수자',
    '근거·참고 링크': '나라장터쇼핑몰',
    품명: '영상정보디스플레이장치',
    ...overrides,
  };
}

function normalizedRow(overrides: Record<string, unknown> = {}, rowNumber = 2) {
  return normalizeDeliveryCaseRow(sourceValues(overrides), rowNumber);
}

void test('normalizes mapped fields while preserving arrays and source labels', () => {
  const row = normalizedRow({
    '도입 수요기관 도로명(U열)': ' 서울시 중구 1 \r\n서울시 중구 2 ',
    설치장소: ' 본관 \n 별관 ',
    '적용 규격': '3.0m × 2.0m\n3.0m × 2.0m',
    '현장 제약과 대응': '운영 중 설치\n야간 작업',
    '근거·참고 링크': '나라장터쇼핑몰\nhttps://example.com/source',
    '상세 본문': '<p>본문</p><script>alert(1)</script>',
  });

  assert.equal(row.data.clientAddress, '서울시 중구 1 · 서울시 중구 2');
  assert.deepEqual(row.data.clientAddresses, [
    '서울시 중구 1',
    '서울시 중구 2',
  ]);
  assert.deepEqual(row.data.places, ['본관', '별관']);
  assert.deepEqual(row.data.specifications, ['3.0m × 2.0m']);
  assert.deepEqual(row.data.constraints, ['운영 중 설치', '야간 작업']);
  assert.deepEqual(row.data.sourceUrls, ['https://example.com/source']);
  assert.deepEqual(row.data.sourceLabels, ['나라장터쇼핑몰']);
  assert.equal(row.data.installedAt, '2026-10-20');
  assert.equal(row.data.body, '<p>본문</p>');
});

void test('allocates deterministic slug and title suffixes against DB and batch rows', () => {
  const rows = normalizeDeliveryCaseRows([
    {
      rowNumber: 2,
      values: sourceValues({
        'URL 식별자': 'same',
        사례명: '동일 사례',
        목록순서: 10,
      }),
    },
    {
      rowNumber: 3,
      values: sourceValues({
        'URL 식별자': 'same',
        사례명: '동일 사례',
        목록순서: 11,
      }),
    },
  ]);
  const plan = planDeliveryCaseImport(
    rows,
    [
      { slug: 'same', title: '동일 사례', data: '{}' },
      { slug: 'same-2', title: '동일 사례 2', data: '{}' },
    ],
    { batchId: 'test-batch' },
  );

  assert.deepEqual(
    plan.records.map((record) => record.slug),
    ['same-3', 'same-4'],
  );
  assert.deepEqual(
    plan.records.map((record) => record.title),
    ['동일 사례 3', '동일 사례 4'],
  );
  assert.ok(plan.records.every((record) => record.published === false));
});

void test('reserves a later source slug while suffixes are allocated', () => {
  const rows = [
    normalizedRow({ 'URL 식별자': 'foo', 목록순서: 10 }, 2),
    normalizedRow({ 'URL 식별자': 'foo', 목록순서: 11 }, 3),
    normalizedRow({ 'URL 식별자': 'foo-2', 목록순서: 12 }, 4),
  ];
  const plan = planDeliveryCaseImport(rows, [], { batchId: 'protected' });
  assert.deepEqual(
    plan.records.map((record) => record.slug),
    ['foo', 'foo-3', 'foo-2'],
  );
});

void test('skips a stable import key on rerun without changing its publication state', () => {
  const row = normalizedRow({ 목록순서: 77 });
  const firstPlan = planDeliveryCaseImport([row], [], { batchId: 'rerun' });
  const imported = firstPlan.records[0];
  const plan = planDeliveryCaseImport(
    [row],
    [
      {
        id: 9,
        slug: imported.slug,
        title: imported.title,
        published: 1,
        data: JSON.stringify(imported.data),
      },
    ],
    { batchId: 'rerun' },
  );

  assert.equal(plan.records.length, 0);
  assert.equal(plan.skipped.length, 1);
  assert.equal(plan.skipped[0].slug, imported.slug);
});

void test('rejects changed source content under the same import key', () => {
  const original = normalizedRow({ 목록순서: 77 });
  const firstPlan = planDeliveryCaseImport([original], [], {
    batchId: 'changed-source',
  });
  const imported = firstPlan.records[0];
  const changed = normalizedRow({ 목록순서: 77, 사례명: '변경된 사례명' });

  assert.throws(
    () =>
      planDeliveryCaseImport(
        [changed],
        [
          {
            slug: imported.slug,
            title: imported.title,
            data: JSON.stringify(imported.data),
          },
        ],
        { batchId: 'changed-source' },
      ),
    /원본 내용이 달라졌습니다.*새 --batch-id/,
  );
});

void test('normalizes real dates and rejects invalid calendar dates', () => {
  assert.equal(normalizeExcelDate(20210316), '2021-03-16');
  assert.equal(normalizeExcelDate('20210316'), '2021-03-16');
  assert.equal(normalizeExcelDate(null), '');
  assert.equal(
    normalizeExcelDate(new Date('2021-03-16T00:00:00.000Z')),
    '2021-03-16',
  );
  assert.throws(() => normalizeExcelDate(20210230), /실제 달력 날짜/);
  assert.throws(() => normalizeExcelDate('20211301'), /실제 달력 날짜/);
  assert.throws(() => normalizeExcelDate('2021316'), /YYYYMMDD 8자리/);
});

void test('maps headers by normalized name and rejects missing or duplicate headers', () => {
  const reordered = [...DELIVERY_CASE_HEADERS].reverse();
  reordered[reordered.length - 1] = `\uFEFF ${reordered.at(-1)} `;
  const columns = validateDeliveryCaseHeaders(reordered);
  assert.equal(columns.get('URL 식별자'), DELIVERY_CASE_HEADERS.length);
  assert.throws(
    () => validateDeliveryCaseHeaders(DELIVERY_CASE_HEADERS.slice(1)),
    /URL 식별자/,
  );
  assert.throws(
    () => validateDeliveryCaseHeaders([...DELIVERY_CASE_HEADERS, '사례명']),
    /중복된 Excel 헤더.*사례명/,
  );
});

void test('guards expected row count and duplicate sort order', () => {
  assert.throws(
    () =>
      normalizeDeliveryCaseRows([{ rowNumber: 2, values: sourceValues() }], {
        expectedCount: 2,
      }),
    /expected=2, actual=1/,
  );
  assert.throws(
    () =>
      normalizeDeliveryCaseRows([
        { rowNumber: 2, values: sourceValues({ 목록순서: 10 }) },
        { rowNumber: 3, values: sourceValues({ 목록순서: 10 }) },
      ]),
    /목록순서가 중복/,
  );
});

void test('stores hostile text as data, keeps arrays, and leaves existing rows untouched', () => {
  const hostileTitle = "O'Brien'); DROP TABLE content_items;--";
  const row = normalizedRow({ 사례명: hostileTitle, 목록순서: 20 });
  const plan = planDeliveryCaseImport(
    [row],
    [{ slug: 'sample-case', title: '기존 사례', data: '{}' }],
    { batchId: 'sqlite-test' },
  );
  const sql = buildDeliveryCaseInsertSql(plan.records);
  const database = new DatabaseSync(':memory:');
  database.exec(`
    CREATE TABLE content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      UNIQUE(type, slug)
    );
    INSERT INTO content_items(type, slug, title, data, sort_order, published)
    VALUES ('case', 'sample-case', '기존 사례', '{}', 1, 1);
  `);
  database.exec(sql);

  const inserted = database
    .prepare(
      "SELECT title, data, published FROM content_items WHERE slug = 'sample-case-2'",
    )
    .get() as { title: string; data: string; published: number };
  const existing = database
    .prepare(
      "SELECT title, published FROM content_items WHERE slug = 'sample-case'",
    )
    .get() as { title: string; published: number };
  const data = JSON.parse(inserted.data);
  assert.equal(inserted.title, hostileTitle);
  assert.equal(inserted.published, 0);
  assert.deepEqual(data.specifications, ['3.0m × 2.0m']);
  assert.deepEqual(data.constraints, ['운영 중 설치']);
  assert.deepEqual(data.sourceUrls, []);
  assert.equal(existing.title, '기존 사례');
  assert.equal(existing.published, 1);
  const count = database
    .prepare('SELECT COUNT(*) AS count FROM content_items')
    .get() as { count: number };
  assert.equal(count.count, 2);
  database.close();
});

void test('rejects NUL values before SQL generation', () => {
  assert.throws(() => sqlLiteral('bad\0value'), /NUL/);
});

void test('counts non-blocking workbook warnings', () => {
  const row = normalizedRow({
    요청건명: '',
    '설치 일자': '',
    '적용 모델명': '',
    '화면 구성단': '',
    '화면 구성열': '',
    '적용 규격': '',
    품명: '',
  });
  assert.deepEqual(aggregateWarningCounts([row]), {
    blankBody: 1,
    blankThumbnail: 1,
    missingDisplayConfiguration: 1,
    missingInstalledAt: 1,
    missingModelName: 1,
    missingProductName: 1,
    missingRequestName: 1,
    missingSourceUrl: 1,
    missingSpecifications: 1,
  });
});

void test('requires explicit target and exact remote confirmation before writes', () => {
  assert.throws(
    () => parseCliArgs(['--file', 'cases.xlsx', '--apply']),
    /--local 또는 --remote/,
  );
  assert.throws(
    () => parseCliArgs(['--file', 'cases.xlsx', '--remote', '--apply']),
    /--confirm-remote oic-korea-db/,
  );
  const remote = parseCliArgs([
    '--file',
    'cases.xlsx',
    '--remote',
    '--apply',
    '--confirm-remote',
    'oic-korea-db',
  ]);
  assert.equal(remote.apply, true);
  assert.equal(remote.target, 'remote');
});
