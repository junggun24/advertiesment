import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { displayModelFields, displayModelValues, normalizeDisplayModel } from '@/lib/display-models';
import { notifyIndexNow } from '@/lib/indexnow';

export async function GET(request: Request) {
  try {
    const includeAll = new URL(request.url).searchParams.get('all') === '1';
    if (includeAll && !await isAdminAuthenticated(request)) {
      return Response.json({ message: '관리자 로그인이 필요합니다.' }, { status: 401 });
    }
    const where = includeAll ? '' : 'WHERE published=1';
    const result = await cloudflareEnv().DB
      .prepare(`SELECT * FROM display_models ${where} ORDER BY sort_order, id`)
      .all<Record<string, unknown>>();
    return Response.json({ models: result.results.map(normalizeDisplayModel) }, {
      headers: { 'cache-control': includeAll ? 'no-store' : 'public, max-age=60' },
    });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : '제품 사양을 불러오지 못했습니다.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message: '관리자 로그인이 필요합니다.' }, { status: 401 });
  try {
    const values = displayModelValues(await request.json() as Record<string, unknown>);
    const result = await cloudflareEnv().DB
      .prepare(`INSERT INTO display_models (${displayModelFields.join(',')}) VALUES (${displayModelFields.map(() => '?').join(',')})`)
      .bind(...values)
      .run();
    const row = await cloudflareEnv().DB.prepare('SELECT * FROM display_models WHERE id=?')
      .bind(result.meta.last_row_id).first<Record<string, unknown>>();
    await notifyIndexNow(['/simulator']);
    return Response.json(normalizeDisplayModel(row ?? {}), { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('UNIQUE') ? '이미 등록된 모델명입니다.' : error instanceof Error ? error.message : '제품 사양을 저장하지 못했습니다.';
    return Response.json({ message }, { status: 400 });
  }
}
