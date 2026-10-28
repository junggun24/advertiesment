import assert from 'node:assert/strict';
import test from 'node:test';
import {
  inquiryCategories,
  isInquiryCategory,
} from '../lib/inquiry-categories.ts';

void test('accepts only the configured inquiry lead categories', () => {
  assert.deepEqual(inquiryCategories, [
    '행정홍보안내',
    '교육환경개선',
    '안전재난관제',
  ]);
  assert.equal(isInquiryCategory('행정홍보안내'), true);
  assert.equal(isInquiryCategory('시설환경개선'), false);
  assert.equal(isInquiryCategory(''), false);
});
