import { cloudflareEnv } from '@/lib/cloudflare-env';

export async function GET() {
  const key = cloudflareEnv().INDEXNOW_KEY;
  if (!key) return new Response('Not configured', { status: 404 });
  return new Response(key, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
    },
  });
}
