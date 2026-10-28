const origin =
  process.env.PRODUCTION_ORIGIN || 'https://dsko.co.kr';

async function check(path, validate) {
  const response = await fetch(`${origin}${path}`, {
    headers: { 'user-agent': 'OIC-Production-Monitor/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  if (validate) await validate(response);
  return response.status;
}

function assertMetadata(html, path, title) {
  const canonical = `${origin}${path}`;
  if (
    !html.includes(`<title>${title} | 오아이씨코리아</title>`) ||
    !html.includes(`<meta property="og:title" content="${title}">`) ||
    !html.includes(`<link rel="canonical" href="${canonical}">`) ||
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
  if (!headers.get('content-security-policy')?.includes("frame-ancestors 'none'"))
    throw new Error('프레임 삽입 방지 정책이 없습니다.');
  if (headers.get('referrer-policy') !== 'strict-origin-when-cross-origin')
    throw new Error('Referrer 정책이 올바르지 않습니다.');
  if (!headers.get('strict-transport-security')?.includes('max-age='))
    throw new Error('HSTS 헤더가 없습니다.');
  const html = await response.text();
  if (!html.includes('오아이씨코리아'))
    throw new Error('메인 페이지 내용이 올바르지 않습니다.');
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
});
results.adminLogin = await check('/admin/login');
for (const [key, path, title] of [
  [
    'products',
    '/products',
    '안내전광판·멀티비전·옥외 키오스크 제품',
  ],
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
