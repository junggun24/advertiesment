import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalRedirectUrl } from '../lib/canonical-host.ts';

void test('redirects legacy hosts to the root domain and preserves the request', () => {
  assert.equal(
    canonicalRedirectUrl(
      'https://display.dsko.co.kr/products/video-wall?source=legacy#spec',
    )?.toString(),
    'https://dsko.co.kr/products/video-wall?source=legacy#spec',
  );
  assert.equal(
    canonicalRedirectUrl('https://www.dsko.co.kr/cases')?.toString(),
    'https://dsko.co.kr/cases',
  );
});

void test('does not redirect the canonical host or unrelated hosts', () => {
  assert.equal(canonicalRedirectUrl('https://dsko.co.kr/products'), null);
  assert.equal(canonicalRedirectUrl('https://example.com/products'), null);
});
