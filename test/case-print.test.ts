import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCasePrintDocument } from '../lib/case-print.ts';
import type { ContentItem } from '../lib/content-types.ts';
import type { CaseStudy } from '../lib/catalog.ts';

const item: ContentItem<CaseStudy> = {
  id: 1,
  type: 'case',
  slug: 'sample-case',
  title: '교육 사례',
  published: true,
  sort_order: 0,
  data: {
    slug: 'sample-case',
    title: '교육 사례',
    place: '대강당',
    purpose: '교육환경개선',
    productSlug: 'video-wall',
    summary: '설치 요약',
    status: '',
    image: '/hero.jpg',
    body: '<h2>상세 본문</h2><p>마지막 문단까지 포함</p><img src="/first.jpg" alt="첫 사진"><img src="https://dsko.co.kr/second.webp" alt="두 번째 사진"><table><tr><td>규격</td></tr></table>',
    displayRows: '2',
    displayColumns: '3',
  },
};

void test('keeps complete body, all photos and tables in the printable document', () => {
  const html = renderCasePrintDocument([item], '교육환경개선');
  assert.ok(html.includes('마지막 문단까지 포함'));
  assert.ok(html.includes('src="https://dsko.co.kr/first.jpg"'));
  assert.ok(html.includes('src="https://dsko.co.kr/second.webp"'));
  assert.equal((html.match(/<img\b/g) ?? []).length, 2);
  assert.equal((html.match(/loading="eager"/g) ?? []).length, 2);
  assert.ok(html.includes('<td>규격</td>'));
  assert.ok(html.includes('2단 × 3열'));
  assert.ok(html.includes('data-case-slug="sample-case"'));
  assert.ok(html.includes('사진 준비 실패'));
  assert.ok(html.includes('window.print()'));
});

void test('escapes plain text and sanitizes stored body before rendering', () => {
  const html = renderCasePrintDocument(
    [
      {
        ...item,
        published: false,
        data: {
          ...item.data,
          title: '<script>hostile()</script>',
          body: '<script>hostile()</script><img src="/safe.jpg" onerror="hostile()"><p>안전한 본문</p>',
        },
      },
    ],
    '교육환경개선',
  );
  assert.ok(html.includes('&lt;script&gt;hostile()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>hostile()'));
  assert.ok(!html.includes('onerror='));
  assert.ok(html.includes('비공개 사례 포함'));
});
