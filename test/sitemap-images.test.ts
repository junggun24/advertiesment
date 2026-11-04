import test from 'node:test';
import assert from 'node:assert/strict';
import { sitemapImages } from '../lib/sitemap-images.ts';

void test('includes the visible thumbnail and body photos as distinct absolute URLs', () => {
  assert.deepEqual(
    sitemapImages({
      thumbnail: '/api/uploads/uploads/thumb.jpg',
      image: '/oic/unused-fallback.jpg',
      body: '<img src="/api/uploads/uploads/thumb.jpg"><img src="/api/uploads/uploads/detail.webp?a=1&amp;b=2">',
    }),
    [
      'https://dsko.co.kr/api/uploads/uploads/thumb.jpg',
      'https://dsko.co.kr/api/uploads/uploads/detail.webp?a=1&b=2',
    ],
  );
});

void test('excludes private API resources and images on unverified external hosts', () => {
  assert.deepEqual(
    sitemapImages({
      thumbnail: '/api/uploads/private/file.jpg',
      body: '<img src="https://example.com/photo.jpg"><img src="/api/uploads/%70rivate/hidden.jpg"><img src="data:image/png;base64,AAAA"><img src="/api/admin/assets/file.jpg"><img src="/oic/case-1.jpg">',
    }),
    ['https://dsko.co.kr/oic/case-1.jpg'],
  );
});

void test('uses the first body image when no thumbnail exists and omits malformed sources', () => {
  assert.deepEqual(
    sitemapImages({
      body: "<img src='/oic/case-2.jpg'><img src='http://['><img src='/bad%ZZ.jpg'>",
    }),
    ['https://dsko.co.kr/oic/case-2.jpg'],
  );
});
