import {
  adminCookie,
  clearAdminCookie,
  createAdminSession,
  credentialsAreValid,
  isAdminAuthenticated,
} from '@/lib/admin-auth';
import { logInfo, logWarning } from '@/lib/monitoring';
import {
  enforceRateLimit,
  rateLimitHeaders,
  verifyTurnstile,
} from '@/lib/security';

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminAuthenticated(request) });
}

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, 'admin_login', 5, 15 * 60);
  if (!rateLimit.allowed) {
    return Response.json(
      { message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }
  const body = (await request.json()) as {
    id?: unknown;
    password?: unknown;
    turnstileToken?: unknown;
  };
  const id = typeof body.id === 'string' ? body.id : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const turnstileToken =
    typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
  const challenge = await verifyTurnstile(
    request,
    turnstileToken,
    'admin_login',
  );
  if (!challenge.success) {
    return Response.json(
      { message: challenge.reason },
      { status: 403, headers: rateLimitHeaders(rateLimit) },
    );
  }

  if (!credentialsAreValid(id, password)) {
    logWarning('admin.login_failed');
    return Response.json(
      { message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    );
  }

  const token = await createAdminSession();
  logInfo('admin.login_succeeded');
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': adminCookie(token, request) } },
  );
}

export async function DELETE(request: Request) {
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearAdminCookie(request) } },
  );
}
