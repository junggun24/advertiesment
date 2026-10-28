import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { DASHBOARD_STATS_SQL } from '@/lib/visitor-analytics';

type DashboardStatsRow = {
  as_of_date: string;
  visitors_today: number;
  visitors_total: number;
  inquiries_today: number;
  inquiries_total: number;
};

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );

  try {
    const row = await cloudflareEnv()
      .DB.prepare(DASHBOARD_STATS_SQL)
      .first<DashboardStatsRow>();
    return Response.json(
      {
        asOfDate: row?.as_of_date ?? '',
        visitors: {
          today: Number(row?.visitors_today ?? 0),
          total: Number(row?.visitors_total ?? 0),
        },
        inquiries: {
          today: Number(row?.inquiries_today ?? 0),
          total: Number(row?.inquiries_total ?? 0),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '대시보드 통계를 불러오지 못했습니다.',
      },
      { status: 503 },
    );
  }
}
