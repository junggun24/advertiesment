import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { normalizeDisplayModel } from '@/lib/display-models';
import { buildModelWorkbook } from '@/scripts/model-export.mjs';

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  try {
    const result = await cloudflareEnv()
      .DB.prepare(
        'SELECT * FROM display_models ORDER BY category, sort_order, id',
      )
      .all<Record<string, unknown>>();
    const bytes = await buildModelWorkbook(
      result.results.map(normalizeDisplayModel),
    );
    return new Response(bytes, {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="oic-display-models-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : '엑셀을 만들지 못했습니다.',
      },
      { status: 503 },
    );
  }
}
