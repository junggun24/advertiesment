import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeEditorHtml } from '../lib/editor-sanitize.ts';

void test('removes executable markup and editor-specific attributes', () => {
  const value = sanitizeEditorHtml(
    '<script>alert(1)</script><p class="legacy" onclick="alert(2)">안내</p><img src="/safe.jpg" onerror="alert(3)" alt="현장">',
  );
  assert.equal(value, '<p>안내</p><img src="/safe.jpg" alt="현장" />');
});

void test('moves legacy uploaded images to the current relative endpoint', () => {
  const value = sanitizeEditorHtml(
    '<img src="http://domob.ddns.net:8080/api/uploads/uploads/a.png" alt="현장">',
  );
  assert.match(value, /src="\/api\/uploads\/uploads\/a\.png"/);
});
