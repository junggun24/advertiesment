import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { displayModelFields, displayModelValues, normalizeDisplayModel } from '@/lib/display-models';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message: '관리자 로그인이 필요합니다.' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ message: '제품 번호가 올바르지 않습니다.' }, { status: 400 });
  try {
    const values = displayModelValues(await request.json() as Record<string, unknown>);
    const assignments = displayModelFields.map((field) => `${field}=?`).join(',');
    const result = await cloudflareEnv().DB
      .prepare(`UPDATE display_models SET ${assignments},updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(...values, id).run();
    if (!result.meta.changes) return Response.json({ message: '제품 사양을 찾지 못했습니다.' }, { status: 404 });
    const row = await cloudflareEnv().DB.prepare('SELECT * FROM display_models WHERE id=?')
      .bind(id).first<Record<string, unknown>>();
    return Response.json(normalizeDisplayModel(row ?? {}));
  } catch (error) {
    const message = error instanceof Error && error.message.includes('UNIQUE') ? '이미 등록된 모델명입니다.' : error instanceof Error ? error.message : '제품 사양을 수정하지 못했습니다.';
    return Response.json({ message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message: '관리자 로그인이 필요합니다.' }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ message: '제품 번호가 올바르지 않습니다.' }, { status: 400 });
  const result = await cloudflareEnv().DB.prepare('DELETE FROM display_models WHERE id=?').bind(id).run();
  if (!result.meta.changes) return Response.json({ message: '제품 사양을 찾지 못했습니다.' }, { status: 404 });
  return Response.json({ ok: true });
}
