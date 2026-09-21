const origin = process.env.PRODUCTION_ORIGIN || 'https://display.dsko.workers.dev';

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
  const html = await response.text();
  if (!html.includes('오아이씨코리아')) throw new Error('메인 페이지 내용이 올바르지 않습니다.');
});
results.health = await check('/api/health', async (response) => {
  const data = await response.json();
  if (data.status !== 'ok' || !data.checks?.database || !data.checks?.storage) {
    throw new Error('Cloudflare 리소스 상태가 정상이 아닙니다.');
  }
});
results.robots = await check('/robots.txt');
results.sitemap = await check('/sitemap.xml');
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

console.log(JSON.stringify({ ok: true, origin, results }));
