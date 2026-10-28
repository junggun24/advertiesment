export const VISITOR_COOKIE = 'oic_visitor_id';

export const UPSERT_VISITOR_SQL = `
INSERT INTO site_visitors (visitor_hash, first_seen_at, last_seen_at, page_views)
VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
ON CONFLICT(visitor_hash) DO UPDATE SET
  last_seen_at = CURRENT_TIMESTAMP,
  page_views = page_views + 1
`;

export const UPSERT_VISITOR_DAY_SQL = `
INSERT INTO site_visitor_days
  (visit_date, visitor_hash, first_seen_at, last_seen_at, page_views)
VALUES (date('now', '+9 hours'), ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
ON CONFLICT(visit_date, visitor_hash) DO UPDATE SET
  last_seen_at = CURRENT_TIMESTAMP,
  page_views = page_views + 1
`;

export const DASHBOARD_STATS_SQL = `
SELECT
  date('now', '+9 hours') AS as_of_date,
  (SELECT COUNT(*) FROM site_visitor_days
    WHERE visit_date = date('now', '+9 hours')) AS visitors_today,
  (SELECT COUNT(*) FROM site_visitors) AS visitors_total,
  (SELECT COUNT(*) FROM inquiries
    WHERE date(created_at, '+9 hours') = date('now', '+9 hours')) AS inquiries_today,
  (SELECT COUNT(*) FROM inquiries) AS inquiries_total
`;

export function isVisitorToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function visitorTokenFromCookie(cookie: string | null) {
  if (!cookie) return '';
  const value = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`))
    ?.slice(VISITOR_COOKIE.length + 1);
  return isVisitorToken(value) ? value : '';
}

export async function hashVisitorToken(value: string) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function visitorCookie(value: string, request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${VISITOR_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}
