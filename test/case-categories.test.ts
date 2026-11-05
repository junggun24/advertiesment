import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCaseDisplaySize,
  matchesCasePurpose,
  CASE_PURPOSES,
  isCasePurpose,
  selectCaseExportItems,
} from '../lib/case-categories.ts';

void test('keeps the multiplication marker fixed between row and column counts', () => {
  assert.equal(formatCaseDisplaySize('3', '4'), '3단 × 4열');
  assert.equal(formatCaseDisplaySize('3', ''), '');
});

void test('only matches the assigned purpose instead of shared words', () => {
  assert.equal(matchesCasePurpose('교육환경개선', '교육환경개선'), true);
  assert.equal(matchesCasePurpose('교육환경개선', '산업안전교육'), false);
  assert.equal(matchesCasePurpose('시설환경개선', '교육환경개선'), false);
  assert.equal(matchesCasePurpose('시정 홍보', '행정홍보안내'), false);
  assert.equal(matchesCasePurpose('학교 문화시설', '교육환경개선'), false);
  assert.equal(matchesCasePurpose('안전재난관제', '안전재난관제'), true);
  assert.equal(matchesCasePurpose(' 행정홍보안내 ', '행정홍보안내'), true);
  for (const saved of CASE_PURPOSES) {
    for (const filter of CASE_PURPOSES)
      assert.equal(matchesCasePurpose(saved, filter), saved === filter);
  }
});

void test('exports only cases assigned to the selected purpose, with drafts opt-in', () => {
  const items = [
    { id: 1, type: 'case', published: true, data: { purpose: '교육환경개선' } },
    {
      id: 2,
      type: 'case',
      published: false,
      data: { purpose: '교육환경개선' },
    },
    { id: 3, type: 'case', published: true, data: { purpose: '산업안전교육' } },
    {
      id: 4,
      type: 'product',
      published: true,
      data: { purpose: '교육환경개선' },
    },
    { id: 5, type: 'case', published: true, data: {} },
  ];
  assert.deepEqual(
    selectCaseExportItems(items, '교육환경개선').map((i) => i.id),
    [1],
  );
  assert.deepEqual(
    selectCaseExportItems(items, '교육환경개선', true).map((i) => i.id),
    [1, 2],
  );
  assert.deepEqual(
    selectCaseExportItems(items, '산업안전교육').map((i) => i.id),
    [3],
  );
  assert.deepEqual(selectCaseExportItems(items, '행정홍보안내'), []);
  assert.equal(isCasePurpose('시설환경개선'), false);
  assert.equal(isCasePurpose('산업안전교육'), true);
});
