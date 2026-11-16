import assert from 'node:assert/strict';
import test from 'node:test';
import { HOME_SEARCH_IMAGE } from '../lib/search-assets.ts';

void test('uses a stable public homepage image that meets Naver guidance', () => {
  assert.equal(HOME_SEARCH_IMAGE.path.startsWith('/api/'), false);
  assert.equal(HOME_SEARCH_IMAGE.type, 'image/jpeg');
  assert.ok(HOME_SEARCH_IMAGE.width > 150);
  assert.ok(HOME_SEARCH_IMAGE.height > 150);
  assert.ok(HOME_SEARCH_IMAGE.width / HOME_SEARCH_IMAGE.height <= 3);
  assert.match(HOME_SEARCH_IMAGE.objectKey, /\.jpg$/);
});
