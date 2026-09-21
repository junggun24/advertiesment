import {
  adminCookie,
  clearAdminCookie,
  createAdminSession,
  credentialsAreValid,
  isAdminAuthenticated,
} from '@/lib/admin-auth';

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminAuthenticated(request) });
}

export async function POST(request: Request) {
  const body = await request.json() as { id?: unknown; password?: unknown };
  const id = String(body.id ?? '');
  const password = String(body.password ?? '');

  if (!credentialsAreValid(id, password)) {
    return Response.json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const token = await createAdminSession();
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
