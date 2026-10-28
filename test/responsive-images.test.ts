import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEditorHtml } from '../lib/editor-content.ts';
import {
  imageVariantKey,
  imageVariantWidthsFor,
  parseImageVariantWidth,
  responsiveImageSrcSet,
} from '../lib/responsive-images.ts';

void test('creates deterministic sibling keys for responsive WebP variants', () => {
  assert.equal(
    imageVariantKey('uploads/2026-10-23/example.photo.jpg', 960),
    'uploads/2026-10-23/example.photo@960.webp',
  );
  assert.equal(
    imageVariantKey('uploads/2026-10-23/no-extension', 480),
    'uploads/2026-10-23/no-extension@480.webp',
  );
});

void test('accepts only configured widths and never upscales variants', () => {
  assert.equal(parseImageVariantWidth('960'), 960);
  assert.equal(parseImageVariantWidth('800'), null);
  assert.deepEqual(imageVariantWidthsFor(1000), [480, 960]);
  assert.deepEqual(imageVariantWidthsFor(400), []);
});

void test('builds responsive URLs only for managed public uploads', () => {
  assert.equal(
    responsiveImageSrcSet('/api/uploads/2026-10-23/example.webp'),
    '/api/uploads/2026-10-23/example.webp?w=480 480w, /api/uploads/2026-10-23/example.webp?w=960 960w, /api/uploads/2026-10-23/example.webp?w=1440 1440w',
  );
  assert.equal(responsiveImageSrcSet('/oic/example.jpg'), '');
  assert.equal(responsiveImageSrcSet('https://example.com/image.jpg'), '');
});

void test('adds lazy responsive attributes to managed editor images', () => {
  const html = prepareEditorHtml(
    '<p>현장</p><img src="/api/uploads/2026-10-23/example.webp" alt="설치 현장">',
  );
  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.match(html, /srcset="[^"]+w=480 480w/);
  assert.match(html, /sizes="\(max-width: 800px\) 100vw, 800px"/);
});
