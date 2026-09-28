import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contentQualityIssues,
  displayModelWarnings,
  missingImageAltCount,
} from '../lib/content-quality.ts';
import { emptyDisplayModel } from '../lib/display-models.ts';

void test('counts only images without useful alt text', () => {
  assert.equal(
    missingImageAltCount('<img src="a.jpg"><img src="b.jpg" alt="설치 현장">'),
    1,
  );
});

void test('warns about incomplete public product content', () => {
  const issues = contentQualityIssues('product', {
    body: '<p>설명</p><img src="/a.jpg">',
  });
  assert.ok(issues.some((value) => value.includes('조달 모델')));
  assert.ok(issues.some((value) => value.includes('대체 설명')));
});

void test('warns about duplicate procurement identifiers', () => {
  const first = {
    ...emptyDisplayModel(),
    id: 1,
    model_name: 'A',
    procurement_id: '123',
  };
  const second = {
    ...emptyDisplayModel(),
    id: 2,
    model_name: 'B',
    procurement_id: '123',
  };
  assert.ok(
    displayModelWarnings(first, [first, second]).some((value) =>
      value.includes('중복'),
    ),
  );
});

void test('warns when case thumbnail metadata is incomplete', () => {
  const issues = contentQualityIssues('case', {
    body: '<p>설치 상세</p>',
    installedAt: '2026-09-28',
    challenge: '문제',
    solution: '해결',
    result: '결과',
    author: '작성자',
    reviewer: '검수자',
    sourceUrls: ['https://example.com'],
  });
  assert.ok(issues.some((value) => value.includes('모델명')));
  assert.ok(issues.some((value) => value.includes('단·열')));
  assert.ok(issues.some((value) => value.includes('도로명')));
});
