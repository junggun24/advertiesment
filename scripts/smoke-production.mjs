const origin = process.env.PRODUCTION_ORIGIN || 'https://dsko.co.kr';

async function check(path, validate) {
  const response = await fetch(`${origin}${path}`, {
    headers: { 'user-agent': 'OIC-Production-Monitor/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  if (validate) await validate(response);
  return response.status;
}

function assertCanonicalInHead(html, path) {
  const head = html.split(/<\/head>/i)[0];
  const tags = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)];
  const href = tags[0]?.[0].match(/href="([^"]+)"/i)?.[1];
  if (
    tags.length !== 1 ||
    !head.includes(tags[0][0]) ||
    !href ||
    new URL(href).href !== new URL(path, origin).href
  )
    throw new Error(`${path}: canonical이 head에 없거나 주소가 잘못됐습니다.`);
}

function assertMetadata(html, path, title) {
  assertCanonicalInHead(html, path);
  const ogTitle = html
    .match(/<meta\b[^>]*property="og:title"[^>]*>/i)?.[0]
    .match(/content="([^"]*)"/i)?.[1];
  if (
    !html.includes(`<title>${title} | 오아이씨코리아</title>`) ||
    ogTitle !== title ||
    !html.includes('href="/favicon.svg"')
  ) {
    throw new Error(`${path}: 메타데이터 또는 favicon이 올바르지 않습니다.`);
  }
}

const results = {};
results.home = await check('/', async (response) => {
  const headers = response.headers;
  if (headers.get('x-content-type-options') !== 'nosniff')
    throw new Error('MIME 스니핑 방지 헤더가 없습니다.');
  if (headers.get('x-frame-options') !== 'DENY')
    throw new Error('클릭재킹 방지 헤더가 없습니다.');
  if (
    !headers.get('content-security-policy')?.includes("frame-ancestors 'none'")
  )
    throw new Error('프레임 삽입 방지 정책이 없습니다.');
  if (headers.get('referrer-policy') !== 'strict-origin-when-cross-origin')
    throw new Error('Referrer 정책이 올바르지 않습니다.');
  if (!headers.get('strict-transport-security')?.includes('max-age='))
    throw new Error('HSTS 헤더가 없습니다.');
  const html = await response.text();
  if (!html.includes('오아이씨코리아'))
    throw new Error('메인 페이지 내용이 올바르지 않습니다.');
  assertCanonicalInHead(html, '/');
  const head = html.split(/<\/head>/i)[0];
  if (
    !/<meta\b[^>]*name="google-site-verification"[^>]*content="[^"]+"/i.test(
      head,
    )
  )
    throw new Error('Google 소유권 인증 태그가 홈페이지 head에 없습니다.');
});
results.health = await check('/api/health', async (response) => {
  const data = await response.json();
  if (data.status !== 'ok' || !data.checks?.database || !data.checks?.storage) {
    throw new Error('Cloudflare 리소스 상태가 정상이 아닙니다.');
  }
});
results.robots = await check('/robots.txt');
results.sitemap = await check('/sitemap.xml', async (response) => {
  const xml = await response.text();
  if (!xml.includes('https://dsko.co.kr/') || xml.includes('workers.dev')) {
    throw new Error('사이트맵 주소가 운영 도메인과 일치하지 않습니다.');
  }
  const images = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)];
  if (
    !xml.includes(
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    ) ||
    !images.length
  )
    throw new Error('사이트맵에 검색용 이미지 주소가 없습니다.');
  for (const [, image] of images) {
    const url = new URL(image.replaceAll('&amp;', '&'));
    const pathname = decodeURIComponent(url.pathname);
    if (
      url.origin !== 'https://dsko.co.kr' ||
      (pathname.startsWith('/api/') &&
        !pathname.startsWith('/api/uploads/uploads/'))
    )
      throw new Error(
        '이미지 사이트맵에 비공개 또는 외부 주소가 포함되어 있습니다.',
      );
  }
});
results.adminLogin = await check('/admin/login');
for (const [key, path, title] of [
  ['products', '/products', '안내전광판·멀티비전·옥외 키오스크 제품'],
  ['cases', '/cases', '안내전광판·멀티비전 설치 사례'],
  ['info', '/info', '안내전광판 가격·설치·나라장터 정보'],
]) {
  results[key] = await check(path, async (response) => {
    assertMetadata(await response.text(), path, title);
  });
}
results.simulator = await check('/simulator', async (response) => {
  const html = await response.text();
  if (
    !html.includes('<h1') ||
    !html.includes('설치 공간에 맞는') ||
    !html.includes('조달등록가격')
  ) {
    throw new Error('사양 계산기의 서버 렌더링 본문이 올바르지 않습니다.');
  }
});
results.productDetail = await check(
  '/products/information-led-board',
  async (response) => {
    assertCanonicalInHead(
      await response.text(),
      '/products/information-led-board',
    );
  },
);
results.caseDetail = await check(
  '/cases/public-office-board',
  async (response) => {
    const html = await response.text();
    assertCanonicalInHead(html, '/cases/public-office-board');
    const graph = [
      ...html.matchAll(
        /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
      ),
    ].flatMap((match) => {
      const schema = JSON.parse(match[1]);
      return schema['@graph'] ?? [schema];
    });
    const article = graph.find((node) => node['@type'] === 'Article');
    if (!article || !article.about?.url || article.about['@type'] === 'Product')
      throw new Error(
        '설치사례의 Article 또는 관련 제품 주제 정보가 올바르지 않습니다.',
      );
  },
);
results.models = await check('/api/models', async (response) => {
  const data = await response.json();
  if (!Array.isArray(data.models) || data.models.length < 1) {
    throw new Error('공개 제품 사양 데이터가 없습니다.');
  }
});
results.llms = await check('/llms.txt', async (response) => {
  const text = await response.text();
  if (!text.includes('오아이씨코리아') || !text.includes('/products')) {
    throw new Error('llms.txt 내용이 올바르지 않습니다.');
  }
});
results.indexNowKey = await check('/indexnow-key.txt', async (response) => {
  const key = (await response.text()).trim();
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error('IndexNow 키 파일이 올바르지 않습니다.');
  }
});

console.log(JSON.stringify({ ok: true, origin, results }));
