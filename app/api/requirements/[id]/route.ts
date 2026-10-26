import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { normalizeRequirement, requirementPayload } from '@/lib/requirements';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  try {
    const { id } = await params;
    const value = requirementPayload(await request.json());
    const db = cloudflareEnv().DB;
    const result = await db
      .prepare(
        `UPDATE requirements
         SET title=?,creator=?,category=?,due_date=?,status=?,content=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
      )
      .bind(
        value.title,
        value.creator,
        value.category,
        value.dueDate,
        value.status,
        JSON.stringify(value.content),
        Number(id),
      )
      .run();
    if (!result.meta.changes) throw new Error('요구사항이 없습니다.');
    const row = await db
      .prepare('SELECT * FROM requirements WHERE id=?')
      .bind(Number(id))
      .first<Record<string, unknown>>();
    return Response.json(normalizeRequirement(row ?? {}));
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '요구사항을 수정하지 못했습니다.',
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  const { id } = await params;
  const result = await cloudflareEnv()
    .DB.prepare('DELETE FROM requirements WHERE id=?')
    .bind(Number(id))
    .run();
  return result.meta.changes
    ? Response.json({ ok: true })
    : Response.json({ message: '요구사항이 없습니다.' }, { status: 404 });
}
