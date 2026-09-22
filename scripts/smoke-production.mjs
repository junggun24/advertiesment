const origin =
  process.env.PRODUCTION_ORIGIN || 'https://display.dsko.co.kr';

async function check(path, validate) {
  const response = await fetch(`${origin}${path}`, {
    headers: { 'user-agent': 'OIC-Production-Monitor/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  if (validate) await validate(response);
  return response.status;
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
  if (!xml.includes('https://display.dsko.co.kr/') || xml.includes('workers.dev')) {
    throw new Error('사이트맵 주소가 운영 도메인과 일치하지 않습니다.');
  }
});
results.adminLogin = await check('/admin/login');
results.simulator = await check('/simulator', async (response) => {
  const html = await response.text();
  if (!html.includes('조달 디스플레이 사양·가격 계산기')) {
    throw new Error('사양 계산기 페이지 내용이 올바르지 않습니다.');
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
