import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  ANALYTICS_TODAY_SQL,
  analyticsDetailSql,
  analyticsPeriods,
  isAnalyticsInterval,
  mergeAnalyticsRows,
  type AnalyticsBaselineRow,
  type AnalyticsCountRow,
} from '@/lib/analytics-detail';
import { cloudflareEnv } from '@/lib/cloudflare-env';

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );

  const requestedInterval = new URL(request.url).searchParams.get('interval');
  if (!isAnalyticsInterval(requestedInterval))
    return Response.json(
      { message: '조회 단위는 day, week, month 중 하나여야 합니다.' },
      { status: 400 },
    );

  try {
    const db = cloudflareEnv().DB;
    const todayRow = await db
      .prepare(ANALYTICS_TODAY_SQL)
      .first<{ today: string }>();
    if (!todayRow?.today)
      throw new Error('한국시간 기준일을 확인할 수 없습니다.');

    const periods = analyticsPeriods(todayRow.today, requestedInterval);
    const rangeStart = periods[0].periodStart;
    const sql = analyticsDetailSql(requestedInterval);
    const [visitorsResult, newVisitorsResult, inquiriesResult, baselineResult] =
      await db.batch([
        db.prepare(sql.visitors).bind(rangeStart),
        db.prepare(sql.newVisitors).bind(rangeStart),
        db.prepare(sql.inquiries).bind(rangeStart),
        db.prepare(sql.baseline).bind(rangeStart, rangeStart),
      ]);

    const rows = mergeAnalyticsRows(
      periods,
      visitorsResult.results as AnalyticsCountRow[],
      newVisitorsResult.results as AnalyticsCountRow[],
      inquiriesResult.results as AnalyticsCountRow[],
      (baselineResult.results[0] as AnalyticsBaselineRow | undefined) ?? {
        visitors_before: 0,
        inquiries_before: 0,
      },
    );

    return Response.json(
      {
        interval: requestedInterval,
        asOfDate: todayRow.today,
        rangeStart,
        rows,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '집계 상세 내역을 불러오지 못했습니다.',
      },
      { status: 503 },
    );
  }
}
