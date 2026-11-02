import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const origin = new URL(process.env.PRODUCTION_ORIGIN || 'https://dsko.co.kr')
  .origin;
const paths = [
  '/',
  '/about',
  '/products',
  '/products/information-led-board',
  '/products/video-wall',
  '/products/outdoor-kiosk',
  '/cases',
  '/info',
  '/simulator',
  ...process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('/') && !arg.startsWith('//')),
];
const outputPath = process.argv
  .find((arg) => arg.startsWith('--output='))
  ?.slice(9);
const report = {
  checkedAt: new Date().toISOString(),
  origin,
  scope:
    '공개 페이지의 기술적 색인 준비 점검. 검색엔진의 실제 색인 여부는 확인하지 않습니다.',
  actualIndexing: '검색엔진 관리도구에서 별도 확인 필요',
  sitemap: {},
  verificationTags: {},
  pages: [],
  errors: [],
  warnings: [],
};

async function get(path) {
  const response = await fetch(new URL(path, origin), {
    headers: { 'user-agent': 'DSKO-Indexing-Audit/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200)
    throw new Error(`${path}: HTTP ${response.status}`);
  return response;
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [
      match[1].toLowerCase(),
      match[2].replaceAll('&amp;', '&'),
    ]),
  );
}

const normalized = (url) => new URL(url).href.replace(/\/$/, '');

try {
  const [robots, sitemap] = await Promise.all([
    get('/robots.txt').then((response) => response.text()),
    get('/sitemap.xml').then((response) => response.text()),
  ]);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replaceAll('&amp;', '&'),
  );
  if (!urls.length) report.errors.push('사이트맵에 페이지가 없습니다.');
  report.sitemap = { url: `${origin}/sitemap.xml`, urlCount: urls.length };
  if (urls.some((url) => new URL(url).origin !== origin))
    report.errors.push('사이트맵에 운영 도메인 외 주소가 있습니다.');
  if (new Set(urls).size !== urls.length)
    report.errors.push('사이트맵에 중복 URL이 있습니다.');
  if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`))
    report.errors.push('robots.txt의 사이트맵 주소가 일치하지 않습니다.');

  // Check every generated group, including the specific AI crawler groups.
  const groups = robots
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .filter((group) => /^User-agent:/im.test(group));
  if (!groups.length)
    report.errors.push('robots.txt에 크롤러 규칙이 없습니다.');
  for (const group of groups) {
    const agent = group.match(/^User-agent:\s*(.+)/im)?.[1].trim();
    if (!/^Allow:\s*\/api\/uploads\/\s*$/im.test(group))
      report.errors.push(`${agent}: 공개 이미지 허용 규칙이 없습니다.`);
    if (
      !/^Disallow:\s*\/api\/uploads\/private\/\s*$/im.test(group) &&
      !/^Disallow:\s*\/api\/\s*$/im.test(group)
    )
      report.errors.push(`${agent}: 비공개 첨부파일 제외 규칙이 없습니다.`);
  }

  const sitemapUrls = new Set(urls.map(normalized));
  for (const path of new Set(paths)) {
    try {
      const response = await get(path);
      const html = await response.text();
      const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map((match) =>
        attributes(match[0]),
      );
      const canonical = tags.find((tag) => tag.rel === 'canonical')?.href;
      const robotsDirectives = tags
        .filter((tag) => /^(robots|googlebot)$/i.test(tag.name || ''))
        .map((tag) => tag.content)
        .join(',');
      const issues = [];
      if (
        !canonical ||
        normalized(canonical) !== normalized(new URL(path, origin).href)
      )
        issues.push('canonical 불일치 또는 누락');
      if (
        /\b(noindex|none)\b/i.test(
          `${robotsDirectives},${response.headers.get('x-robots-tag') || ''}`,
        )
      )
        issues.push('noindex 설정');
      if (!sitemapUrls.has(normalized(new URL(path, origin).href)))
        issues.push('사이트맵 누락');
      if (!/<title>[^<]+<\/title>/i.test(html) || !/<h1\b/i.test(html))
        issues.push('제목 또는 H1 누락');
      report.pages.push({ path, status: response.status, canonical, issues });
      for (const issue of issues) report.errors.push(`${path}: ${issue}`);

      if (path === '/') {
        const headTags = [
          ...html.split(/<\/head>/i)[0].matchAll(/<meta\b[^>]*>/gi),
        ].map((match) => attributes(match[0]));
        for (const name of [
          'google-site-verification',
          'naver-site-verification',
          'msvalidate.01',
        ]) {
          const present = headTags.some(
            (tag) => tag.name === name && tag.content?.trim(),
          );
          report.verificationTags[name] = present;
          if (!present)
            report.warnings.push(
              `${name}: 홈페이지 head에 인증코드가 없습니다. DNS 등 다른 인증 방식 사용 여부는 별도 확인이 필요합니다.`,
            );
        }
      }
    } catch (error) {
      report.errors.push(error.message);
    }
  }
} catch (error) {
  report.errors.push(error.message);
}

const json = JSON.stringify(report, null, 2);
if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${json}\n`);
}
console.log(json);
if (report.errors.length) process.exitCode = 1;
