import { cloudflareEnv } from './cloudflare-env';

type JsonRecord = { message?: string; [key: string]: unknown };

function parseJson(value: unknown, fallback: unknown) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeContent(row: Record<string, unknown>) {
  return {
    ...row,
    data: parseJson(row.data, {}),
    published: Boolean(row.published),
  };
}

export function normalizeInquiry(row: Record<string, unknown>) {
  return {
    ...row,
    attribution_raw: parseJson(row.attribution_raw, {}),
    journey: parseJson(row.journey, { pages: [], events: [] }),
    quality_flags: parseJson(row.quality_flags, []),
  };
}

function requestBody(init?: RequestInit) {
  if (!init?.body || typeof init.body !== 'string') {
    return {} as Record<string, unknown>;
  }
  return JSON.parse(init.body) as Record<string, unknown>;
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function contentRequest(url: URL, init?: RequestInit): Promise<JsonRecord> {
  const db = cloudflareEnv().DB;
  const method = (init?.method ?? 'GET').toUpperCase();
  const id = Number(url.pathname.match(/^\/content\/(\d+)$/)?.[1]);

  if (url.pathname === '/content' && method === 'GET') {
    const type = url.searchParams.get('type');
    const query = type
      ? db
          .prepare(
            'SELECT * FROM content_items WHERE type=? ORDER BY type, sort_order, id',
          )
          .bind(type)
      : db.prepare('SELECT * FROM content_items ORDER BY type, sort_order, id');
    const result = await query.all<Record<string, unknown>>();
    return { items: result.results.map(normalizeContent) };
  }

  if (url.pathname === '/content' && method === 'POST') {
    const value = requestBody(init);
    const result = await db
      .prepare(
        `INSERT INTO content_items (type,slug,title,data,sort_order,published)
         VALUES (?,?,?,?,?,?)`,
      )
      .bind(
        text(value.type),
        text(value.slug),
        text(value.title),
        JSON.stringify(value.data ?? {}),
        number(value.sort_order),
        value.published === false ? 0 : 1,
      )
      .run();
    const row = await db
      .prepare('SELECT * FROM content_items WHERE id=?')
      .bind(result.meta.last_row_id)
      .first<Record<string, unknown>>();
    return normalizeContent(row ?? {}) as JsonRecord;
  }

  if (Number.isInteger(id) && method === 'PUT') {
    const value = requestBody(init);
    const result = await db
      .prepare(
        `UPDATE content_items
         SET type=?,slug=?,title=?,data=?,sort_order=?,published=?,updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
      )
      .bind(
        text(value.type),
        text(value.slug),
        text(value.title),
        JSON.stringify(value.data ?? {}),
        number(value.sort_order),
        value.published === false ? 0 : 1,
        id,
      )
      .run();
    if (!result.meta.changes) throw new Error('콘텐츠가 없습니다.');
    const row = await db
      .prepare('SELECT * FROM content_items WHERE id=?')
      .bind(id)
      .first<Record<string, unknown>>();
    return normalizeContent(row ?? {}) as JsonRecord;
  }

  if (Number.isInteger(id) && method === 'DELETE') {
    const result = await db.prepare('DELETE FROM content_items WHERE id=?').bind(id).run();
    if (!result.meta.changes) throw new Error('콘텐츠가 없습니다.');
    return { ok: true };
  }

  throw new Error('지원하지 않는 콘텐츠 요청입니다.');
}

async function inquiryRequest(url: URL, init?: RequestInit): Promise<JsonRecord> {
  const { DB: db, FILES: files } = cloudflareEnv();
  const method = (init?.method ?? 'GET').toUpperCase();
  const id = Number(url.pathname.match(/^\/inquiries\/(\d+)$/)?.[1]);

  if (url.pathname === '/inquiries' && method === 'POST') {
    const value = requestBody(init);
    const tracking = (value.attribution ?? {}) as Record<string, unknown>;
    const columns = [
      'name', 'organization', 'contact', 'message', 'inquiry_channel',
      'source_type', 'source_name', 'campaign', 'ad_group', 'keyword',
      'content', 'landing_page', 'submitted_page', 'referrer', 'device_type',
      'page_view_count', 'first_visited_at', 'elapsed_seconds', 'attribution_raw',
      'last_source_type', 'last_source_name', 'last_campaign', 'last_ad_group',
      'last_keyword', 'last_content', 'last_landing_page', 'last_referrer',
      'session_count', 'session_page_view_count', 'last_visited_at', 'journey',
      'quality_flags',
    ];
    const values = [
      text(value.name), text(value.organization), text(value.contact), text(value.message),
      text(tracking.inquiryChannel, '상담신청 폼'), text(tracking.sourceType, 'Unknown'),
      text(tracking.sourceName, '확인 불가'), text(tracking.campaign),
      text(tracking.adGroup), text(tracking.keyword), text(tracking.content),
      text(tracking.landingPage), text(tracking.submittedPage), text(tracking.referrer),
      text(tracking.deviceType), number(tracking.pageViewCount, 1),
      text(tracking.firstVisitedAt) || null, number(tracking.elapsedSeconds),
      JSON.stringify(tracking.raw ?? {}), text(tracking.lastSourceType, 'Unknown'),
      text(tracking.lastSourceName, '확인 불가'), text(tracking.lastCampaign),
      text(tracking.lastAdGroup), text(tracking.lastKeyword), text(tracking.lastContent),
      text(tracking.lastLandingPage), text(tracking.lastReferrer),
      number(tracking.sessionCount, 1), number(tracking.sessionPageViewCount, 1),
      text(tracking.lastVisitedAt) || null,
      JSON.stringify(tracking.journey ?? { pages: [], events: [] }),
      JSON.stringify(tracking.qualityFlags ?? []),
    ];
    const result = await db
      .prepare(
        `INSERT INTO inquiries (${columns.join(',')})
         VALUES (${columns.map(() => '?').join(',')})`,
      )
      .bind(...values)
      .run();
    const row = await db
      .prepare('SELECT * FROM inquiries WHERE id=?')
      .bind(result.meta.last_row_id)
      .first<Record<string, unknown>>();
    return normalizeInquiry(row ?? {}) as JsonRecord;
  }

  if (url.pathname === '/inquiries' && method === 'GET') {
    const inquiries = await db
      .prepare('SELECT * FROM inquiries ORDER BY created_at DESC')
      .all<Record<string, unknown>>();
    const assets = await db
      .prepare('SELECT * FROM content_assets WHERE inquiry_id IS NOT NULL ORDER BY id')
      .all<Record<string, unknown>>();
    const grouped = new Map<number, Record<string, unknown>[]>();
    for (const asset of assets.results) {
      const inquiryId = Number(asset.inquiry_id);
      const list = grouped.get(inquiryId) ?? [];
      list.push({
        id: asset.id,
        name: asset.original_name,
        type: asset.content_type,
        size: asset.size_bytes,
        url: `/api/admin/assets/${text(asset.object_key)}`,
      });
      grouped.set(inquiryId, list);
    }
    return {
      inquiries: inquiries.results.map((row) => ({
        ...normalizeInquiry(row),
        attachments: grouped.get(Number(row.id)) ?? [],
      })),
    };
  }

  if (Number.isInteger(id) && method === 'PATCH') {
    const value = requestBody(init);
    const result = await db
      .prepare(
        `UPDATE inquiries
         SET status=?,assignee=?,memo=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      )
      .bind(text(value.status), text(value.assignee), text(value.memo), id)
      .run();
    if (!result.meta.changes) throw new Error('문의가 없습니다.');
    return { ok: true };
  }

  if (Number.isInteger(id) && method === 'DELETE') {
    const assets = await db
      .prepare('SELECT object_key FROM content_assets WHERE inquiry_id=?')
      .bind(id)
      .all<{ object_key: string }>();
    await Promise.all(assets.results.map((asset) => files.delete(asset.object_key)));
    const result = await db.prepare('DELETE FROM inquiries WHERE id=?').bind(id).run();
    if (!result.meta.changes) throw new Error('문의가 없습니다.');
    return { ok: true };
  }

  throw new Error('지원하지 않는 문의 요청입니다.');
}

export async function dbApi(path: string, init?: RequestInit) {
  const url = new URL(path, 'https://oic.internal');
  if (url.pathname.startsWith('/content')) return contentRequest(url, init);
  if (url.pathname.startsWith('/inquiries')) return inquiryRequest(url, init);
  throw new Error('지원하지 않는 데이터베이스 요청입니다.');
}
