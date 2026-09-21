const origin = process.env.PRODUCTION_ORIGIN || 'https://oic-korea.oic-korea.workers.dev';

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

console.log(JSON.stringify({ ok: true, origin, results }));
