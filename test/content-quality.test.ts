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
