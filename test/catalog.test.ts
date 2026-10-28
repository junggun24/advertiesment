import assert from 'node:assert/strict';
import test from 'node:test';
import { cases, getCase } from '../lib/catalog.ts';

void test('does not expose the retired culture video wall dummy case', () => {
  assert.equal(getCase('culture-video-wall'), undefined);
  assert.equal(
    cases.some(
      (item) =>
        item.slug === 'culture-video-wall' ||
        item.title === '문화시설 안내 멀티비전',
    ),
    false,
  );
});
