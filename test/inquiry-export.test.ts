import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { buildInquiryWorkbook } from '../scripts/inquiry-export.mjs';

const baseInquiry = {
  created_at: '2026-10-28T00:00:00.000Z',
  inquiry_channel: '상담신청 폼',
  name: '테스트',
  contact: '010-0000-0000',
  organization: '테스트 기관',
  source_type: 'Direct',
  source_name: '직접 유입',
  last_source_type: 'Direct',
  last_source_name: '직접 유입',
  status: 'new',
  page_view_count: 1,
  session_count: 1,
  session_page_view_count: 1,
  elapsed_seconds: 0,
  quality_flags: [],
  journey: { pages: [], events: [] },
  attribution_raw: {},
};

void test('exports inquiry category in data and lead summary sheets', async () => {
  const bytes = await buildInquiryWorkbook([
    { ...baseInquiry, inquiry_category: '교육환경개선' },
    { ...baseInquiry, inquiry_category: '', contact: '010-1111-1111' },
  ]);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  const raw = workbook.getWorksheet('문의 RAW');
  const data = workbook.getWorksheet('문의데이터');
  const monthly = workbook.getWorksheet('통계(월)');
  assert.ok(raw && data && monthly);
  assert.equal(raw.getRow(1).getCell(7).value, '문의 카테고리');
  assert.equal(raw.getRow(2).getCell(7).value, '교육환경개선');
  assert.equal(raw.getRow(3).getCell(7).value, '미분류');
  assert.equal(data.getRow(1).getCell(9).value, '문의 카테고리');
  assert.equal(monthly.getRow(1).getCell(4).value, '교육환경개선');
  assert.equal(monthly.getRow(2).getCell(4).value, 1);
  assert.equal(monthly.getRow(2).getCell(6).value, 1);
});
