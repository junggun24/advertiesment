export type AnalyticsInterval = 'day' | 'week' | 'month';

export type AnalyticsPeriod = {
  periodStart: string;
  periodEnd: string;
};

export type AnalyticsCountRow = {
  period_start: string;
  value: number;
};

export type AnalyticsBaselineRow = {
  visitors_before: number;
  inquiries_before: number;
};

export type AnalyticsDetailRow = AnalyticsPeriod & {
  visitors: number;
  visitorsCumulative: number;
  inquiries: number;
  inquiriesCumulative: number;
};

export const ANALYTICS_TODAY_SQL = `
SELECT date('now', '+9 hours') AS today
`;

const bucketCounts: Record<AnalyticsInterval, number> = {
  day: 30,
  week: 12,
  month: 12,
};

export function isAnalyticsInterval(
  value: unknown,
): value is AnalyticsInterval {
  return value === 'day' || value === 'week' || value === 'month';
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new Error('올바른 기준일이 아닙니다.');
  return date;
}

function dateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfPeriod(value: Date, interval: AnalyticsInterval) {
  if (interval === 'day') return new Date(value);
  if (interval === 'week') {
    const mondayOffset = (value.getUTCDay() + 6) % 7;
    return addDays(value, -mondayOffset);
  }
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function shiftPeriod(value: Date, interval: AnalyticsInterval, amount: number) {
  if (interval === 'day') return addDays(value, amount);
  if (interval === 'week') return addDays(value, amount * 7);
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1),
  );
}

function endOfPeriod(value: Date, interval: AnalyticsInterval) {
  if (interval === 'day') return new Date(value);
  if (interval === 'week') return addDays(value, 6);
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
}

export function analyticsPeriods(today: string, interval: AnalyticsInterval) {
  const current = startOfPeriod(parseDate(today), interval);
  const count = bucketCounts[interval];
  return Array.from({ length: count }, (_, index) => {
    const start = shiftPeriod(current, interval, index - count + 1);
    return {
      periodStart: dateString(start),
      periodEnd: dateString(endOfPeriod(start, interval)),
    };
  });
}

function periodExpression(dateExpression: string, interval: AnalyticsInterval) {
  if (interval === 'day') return dateExpression;
  if (interval === 'week')
    return `date(${dateExpression}, '-' || ((CAST(strftime('%w', ${dateExpression}) AS INTEGER) + 6) % 7) || ' days')`;
  return `substr(${dateExpression}, 1, 7) || '-01'`;
}

export function analyticsDetailSql(interval: AnalyticsInterval) {
  const visitDay = 'visit_date';
  const firstVisitDay = `date(first_seen_at, '+9 hours')`;
  const inquiryDay = `date(created_at, '+9 hours')`;
  return {
    visitors: `
      SELECT ${periodExpression(visitDay, interval)} AS period_start,
        COUNT(DISTINCT visitor_hash) AS value
      FROM site_visitor_days
      WHERE visit_date >= ?
      GROUP BY period_start
      ORDER BY period_start
    `,
    newVisitors: `
      SELECT ${periodExpression(firstVisitDay, interval)} AS period_start,
        COUNT(*) AS value
      FROM site_visitors
      WHERE ${firstVisitDay} >= ?
      GROUP BY period_start
      ORDER BY period_start
    `,
    inquiries: `
      SELECT ${periodExpression(inquiryDay, interval)} AS period_start,
        COUNT(*) AS value
      FROM inquiries
      WHERE ${inquiryDay} >= ?
      GROUP BY period_start
      ORDER BY period_start
    `,
    baseline: `
      SELECT
        (SELECT COUNT(*) FROM site_visitors
          WHERE ${firstVisitDay} < ?) AS visitors_before,
        (SELECT COUNT(*) FROM inquiries
          WHERE ${inquiryDay} < ?) AS inquiries_before
    `,
  };
}

function countMap(rows: AnalyticsCountRow[]) {
  return new Map(rows.map((row) => [row.period_start, Number(row.value || 0)]));
}

export function mergeAnalyticsRows(
  periods: AnalyticsPeriod[],
  visitors: AnalyticsCountRow[],
  newVisitors: AnalyticsCountRow[],
  inquiries: AnalyticsCountRow[],
  baseline: AnalyticsBaselineRow,
): AnalyticsDetailRow[] {
  const visitorsByPeriod = countMap(visitors);
  const newVisitorsByPeriod = countMap(newVisitors);
  const inquiriesByPeriod = countMap(inquiries);
  let visitorsCumulative = Number(baseline.visitors_before || 0);
  let inquiriesCumulative = Number(baseline.inquiries_before || 0);

  return periods.map((period) => {
    visitorsCumulative += newVisitorsByPeriod.get(period.periodStart) || 0;
    const periodInquiries = inquiriesByPeriod.get(period.periodStart) || 0;
    inquiriesCumulative += periodInquiries;
    return {
      ...period,
      visitors: visitorsByPeriod.get(period.periodStart) || 0,
      visitorsCumulative,
      inquiries: periodInquiries,
      inquiriesCumulative,
    };
  });
}
