import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { normalizeRequirement, requirementPayload } from '@/lib/requirements';

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  try {
    const result = await cloudflareEnv()
      .DB.prepare('SELECT * FROM requirements ORDER BY sort_order, id')
      .all<Record<string, unknown>>();
    return Response.json(
      { requirements: result.results.map(normalizeRequirement) },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '요구사항을 불러오지 못했습니다.',
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  try {
    const value = requirementPayload(await request.json());
    const db = cloudflareEnv().DB;
    const order = await db
      .prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM requirements',
      )
      .first<{ next: number }>();
    const result = await db
      .prepare(
        `INSERT INTO requirements
         (source_id,title,creator,category,due_date,status,content,sort_order)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .bind(
        `admin:${crypto.randomUUID()}`,
        value.title,
        value.creator,
        value.category,
        value.dueDate,
        value.status,
        JSON.stringify(value.content),
        Number(order?.next) || 0,
      )
      .run();
    const row = await db
      .prepare('SELECT * FROM requirements WHERE id=?')
      .bind(result.meta.last_row_id)
      .first<Record<string, unknown>>();
    return Response.json(normalizeRequirement(row ?? {}), { status: 201 });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '요구사항을 저장하지 못했습니다.',
      },
      { status: 400 },
    );
  }
}
