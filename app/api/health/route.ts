import { cloudflareEnv } from '@/lib/cloudflare-env';
import { logError } from '@/lib/monitoring';

export async function GET() {
  const checks = { database: false, storage: false };
  try {
    await cloudflareEnv().DB.prepare('SELECT 1 AS ok').first();
    checks.database = true;
    await cloudflareEnv().FILES.list({ limit: 1 });
    checks.storage = true;
  } catch (error) {
    logError('health.check_failed', error, checks);
  }
  const healthy = checks.database && checks.storage;
  return Response.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
