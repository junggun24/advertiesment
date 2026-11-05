import type { CaseStudy } from './catalog';
import type { ContentItem } from './content-types';
import { PUBLIC_SITE_URL } from './content-types.ts';
import { formatCaseDisplaySize, type CasePurpose } from './case-categories.ts';
import { resolveContentImage } from './editor-content.ts';
import { sanitizeEditorHtml } from './editor-sanitize.ts';

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export function renderCasePrintDocument(
  items: ContentItem<CaseStudy>[],
  purpose: CasePurpose,
) {
  const articles = items
    .map((record, index) => {
      const item = record.data;
      const body = sanitizeEditorHtml(item.body ?? '').replace(
        /(<img\b[^>]*\bsrc=")([^"<>]+)(")/gi,
        (_tag, before, src, after) => {
          // Export uses full images and eager loading so off-screen photos also print.
          const absolute = src.startsWith('/')
            ? `${PUBLIC_SITE_URL}${src}`
            : src;
          return `${before}${absolute}${after} loading="eager" decoding="sync"`;
        },
      );
      const photo = resolveContentImage(item);
      const hero =
        photo && !/<img\b/i.test(body)
          ? `<img class="case-hero" src="${escapeHtml(photo.startsWith('/') ? `${PUBLIC_SITE_URL}${photo}` : photo)}" alt="${escapeHtml(item.title || record.title)} 설치 현장">`
          : '';
      const fields = [
        ['설치 목적', purpose],
        ['설치 장소', item.place],
        ['설치 일자', item.installedAt],
        ['설치 지역', item.region],
        ['수요기관 주소', item.clientAddress],
        ['적용 모델', item.modelName],
        [
          '화면 구성',
          formatCaseDisplaySize(item.displayRows, item.displayColumns),
        ],
        ['공사·설치 기간', item.projectDuration],
      ].filter(([, value]) => value);
      const sections = [
        ['설치 전 문제', item.challenge],
        ['적용한 해결 방법', item.solution],
        ['설치 결과', item.result],
      ]
        .filter(([, value]) => value)
        .map(
          ([title, value]) =>
            `<section><h3>${title}</h3><p>${escapeHtml(value)}</p></section>`,
        )
        .join('');
      const listFields: [string, string[] | undefined][] = [
        ['적용 규격', item.specifications],
        ['현장 제약과 대응', item.constraints],
      ];
      const lists = listFields
        .filter(([, values]) => Array.isArray(values) && values.length)
        .map(
          ([title, values]) =>
            `<section><h3>${title}</h3><ul>${(values ?? []).map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul></section>`,
        )
        .join('');
      return `<article class="case-document" data-case-slug="${escapeHtml(record.slug)}">
      <div class="case-number">${index + 1} / ${items.length} · ${escapeHtml(purpose)}${record.published ? '' : ' · 비공개'}</div>
      <h2>${escapeHtml(item.title || record.title)}</h2>
      <dl>${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
      ${item.summary ? `<p class="summary">${escapeHtml(item.summary)}</p>` : ''}
      ${hero}${body ? `<section class="case-body">${body}</section>` : ''}${sections}${lists}
      <p class="case-source">${escapeHtml(`${PUBLIC_SITE_URL}/cases/${record.slug}`)}</p>
    </article>`;
    })
    .join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(purpose)} 설치사례 - 오아이씨코리아</title>
<style>
*{box-sizing:border-box}body{margin:0;color:#202c3d;background:#eef1f5;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:14px;line-height:1.75;overflow-wrap:anywhere}
.toolbar{position:sticky;top:0;z-index:1;background:#fff;border-bottom:1px solid #dce1e8;padding:18px 24px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}.toolbar a{color:#3157a4}.toolbar button{padding:12px 20px;background:#244e90;color:#fff;border:0;border-radius:6px;font-size:15px;cursor:pointer}.toolbar button:disabled{background:#88919d;cursor:wait}#status{font-size:13px}
main{max-width:900px;margin:24px auto;padding:36px;background:white}.document-header{border-bottom:3px solid #244e90;padding-bottom:20px;margin-bottom:32px}.document-header h1{font-size:28px;margin:0 0 8px}.document-header p{margin:0;color:#687486}.case-document{margin-top:48px;padding-top:24px;border-top:1px solid #dce1e8}.case-number{color:#3157a4;font-size:12px;font-weight:bold}h2{font-size:24px;line-height:1.45;margin:10px 0 20px}h3{font-size:17px}dl{border-top:1px solid #dce1e8;border-bottom:1px solid #dce1e8;margin:0 0 24px}dl>div{display:grid;grid-template-columns:120px 1fr;gap:12px;padding:8px 12px}dl>div+div{border-top:1px solid #edf0f4}dt{font-weight:bold;color:#657185}dd{margin:0}p{white-space:pre-line}.summary{padding:16px;background:#f5f8fc}.case-body{margin-top:24px}.case-body:empty{display:none}img{display:block;max-width:100%;width:auto;height:auto;max-height:240mm;object-fit:contain;margin:20px auto}figure{margin:20px 0}figcaption{color:#657185;text-align:center}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:8px;border:1px solid #dce1e8;overflow-wrap:anywhere}.case-source{font-size:11px;color:#687486;margin-top:32px}
@page{size:A4;margin:16mm 14mm}@media print{body{background:#fff;font-size:10pt}.toolbar{display:none}main{max-width:none;margin:0;padding:0}.document-header h1{font-size:22pt}.case-document{break-before:page;border:0;padding:0;margin:0}.case-document:first-of-type{break-before:auto}h2{font-size:18pt}h2,h3,dt{break-after:avoid}img,figure,dl>div{break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid}a{color:inherit;text-decoration:none}.summary{background:none;border-left:3px solid #244e90}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body><div class="toolbar"><a href="/admin/content">← 콘텐츠 관리</a><button id="save-pdf" disabled>사진 준비 중...</button><button id="retry" hidden>다시 불러오기</button><span id="status" role="status">사진을 모두 불러온 후 PDF를 저장할 수 있습니다.</span></div><main><header class="document-header"><h1>${escapeHtml(purpose)} 설치사례</h1><p>오아이씨코리아 · ${items.length}건 · 상세 본문 및 사진 포함${items.some((item) => !item.published) ? ' · 비공개 사례 포함' : ''}</p></header>${articles}</main>
<script>
const save = document.getElementById('save-pdf');
const status = document.getElementById('status');
save.addEventListener('click', () => window.print());
document.getElementById('retry').addEventListener('click', () => location.reload());
Promise.all([...document.images].map(image => new Promise(resolve => {
 if (image.complete) return resolve(image.naturalWidth > 0);
 const timer = setTimeout(() => resolve(false), 60000);
 const done = success => { clearTimeout(timer); resolve(success); };
 image.addEventListener('load', () => done(true), {once:true});
 image.addEventListener('error', () => done(false), {once:true});
}))).then(async results => {
 await document.fonts.ready;
 const failed = results.filter(ok => !ok).length;
 if (failed) {
  status.textContent = failed + '개 사진을 불러오지 못했습니다. 다시 불러온 후 저장해 주세요.';
  save.textContent = '사진 준비 실패';
  document.getElementById('retry').hidden = false;
 } else {
  save.disabled = false;
  save.textContent = 'PDF 저장';
  status.textContent = '본문과 사진 준비 완료 · 인쇄 대상에서 PDF로 저장을 선택하세요.';
 }
});
</script></body></html>`;
}
