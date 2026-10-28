import { cloudflareEnv } from '@/lib/cloudflare-env';
import { enforceRateLimit, rateLimitHeaders } from '@/lib/security';
import {
  hashVisitorToken,
  isVisitorToken,
  UPSERT_VISITOR_DAY_SQL,
  UPSERT_VISITOR_SQL,
  visitorCookie,
  visitorTokenFromCookie,
} from '@/lib/visitor-analytics';

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(
    request,
    'visitor_analytics',
    120,
    60,
  );
  if (!rateLimit.allowed)
    return new Response(null, {
      status: 204,
      headers: rateLimitHeaders(rateLimit),
    });

  let suppliedToken = '';
  try {
    const body = (await request.json()) as { visitorId?: unknown };
    if (isVisitorToken(body.visitorId)) suppliedToken = body.visitorId;
  } catch {
    // An empty or invalid body still receives a server-generated identifier.
  }

  const cookieToken = visitorTokenFromCookie(request.headers.get('cookie'));
  const visitorToken = cookieToken || suppliedToken || crypto.randomUUID();
  const visitorHash = await hashVisitorToken(visitorToken);
  const db = cloudflareEnv().DB;
  await db.batch([
    db.prepare(UPSERT_VISITOR_SQL).bind(visitorHash),
    db.prepare(UPSERT_VISITOR_DAY_SQL).bind(visitorHash),
  ]);

  const headers = rateLimitHeaders(rateLimit);
  headers.set('Cache-Control', 'no-store');
  if (!cookieToken)
    headers.set('Set-Cookie', visitorCookie(visitorToken, request));
  return new Response(null, { status: 204, headers });
}
