const origin = 'https://display.dsko.co.kr';
const sitemapUrl = `${origin}/sitemap.xml`;

async function get(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'dsko-site-link-audit/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

const sitemap = await get(sitemapUrl);
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  match[1].replaceAll('&amp;', '&'),
);
if (!pages.length) throw new Error('사이트맵에 페이지가 없습니다.');

const links = new Set(pages);
const failures = [];
for (const page of pages) {
  try {
    const html = await get(page);
    for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      const href = match[1].replaceAll('&amp;', '&');
      const url = new URL(href, page);
      if (url.origin !== origin) continue;
      url.hash = '';
      links.add(url.href);
    }
  } catch (error) {
    failures.push(`${page}: ${error.message}`);
  }
}

for (const url of links) {
  try {
    await get(url);
  } catch (error) {
    failures.push(error.message);
  }
}

console.log(`사이트맵 ${pages.length}개 · 내부 링크 ${links.size}개 검사`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
