import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCaseDisplaySize,
  matchesCasePurpose,
} from '../lib/case-categories.ts';

void test('keeps the multiplication marker fixed between row and column counts', () => {
  assert.equal(formatCaseDisplaySize('3', '4'), '3단 × 4열');
  assert.equal(formatCaseDisplaySize('3', ''), '');
});

void test('maps legacy purpose text into the four new categories', () => {
  assert.equal(matchesCasePurpose('시정 홍보', '행정홍보안내'), true);
  assert.equal(matchesCasePurpose('학교 문화시설', '교육환경개선'), true);
  assert.equal(matchesCasePurpose('재난 관제', '안전재난관제'), true);
  assert.equal(matchesCasePurpose('실내 리모델링', '시설환경개선'), true);
  assert.equal(matchesCasePurpose('시정 홍보', '안전재난관제'), false);
});
