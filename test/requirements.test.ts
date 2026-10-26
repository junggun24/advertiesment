import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeRequirement,
  requirementPayload,
} from '../lib/requirements.ts';

void test('normalizes stored requirement content and numeric fields', () => {
  const requirement = normalizeRequirement({
    id: '7',
    sort_order: '3',
    title: '화면 개선',
    content: JSON.stringify([
      {
        id: 'block-1',
        type: 'text',
        richText: [{ text: '참고', href: 'https://example.com', bold: true }],
      },
    ]),
  });

  assert.equal(requirement.id, 7);
  assert.equal(requirement.sort_order, 3);
  assert.deepEqual(requirement.content[0].richText[0], {
    text: '참고',
    href: 'https://example.com',
    bold: true,
    italic: undefined,
    strike: undefined,
    code: undefined,
    color: undefined,
  });
});

void test('keeps private requirement assets and drops unsafe links', () => {
  const payload = requirementPayload({
    title: '첨부 확인',
    content: [
      {
        id: 'image-1',
        type: 'image',
        richText: [{ text: '위험', href: 'javascript:alert(1)' }],
        asset: {
          name: '화면.png',
          url: '/api/admin/requirement-assets/example.png',
        },
      },
    ],
  });

  assert.equal(payload.content[0].richText[0].href, undefined);
  assert.equal(
    payload.content[0].asset?.url,
    '/api/admin/requirement-assets/example.png',
  );
});

void test('requires a title', () => {
  assert.throws(() => requirementPayload({ title: '   ' }), /이름/);
});
