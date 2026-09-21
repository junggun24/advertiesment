import http from 'node:http';
import { Pool } from 'pg';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { buildInquiryWorkbook } from './inquiry-export.mjs';

process.loadEnvFile?.('.env.local');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const port = Number(process.env.CONTENT_API_PORT || 3101);
const bucket = process.env.MINIO_BUCKET || 'oic-assets';
const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}
await ensureBucket();

const json = (response, status, body) => {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
};

async function body(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length
    ? JSON.parse(Buffer.concat(chunks).toString('utf8'))
    : {};
}

function inquiryFilter(url) {
  const values = [];
  const where = [];
  const status = url.searchParams.get('status');
  const source = url.searchParams.get('source');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (status && status !== 'all') {
    values.push(status);
    where.push(`i.status=$${values.length}`);
  }
  if (source && source !== 'all') {
    values.push(source);
    where.push(`i.source_type=$${values.length}`);
  }
  if (from) {
    values.push(from);
    where.push(`i.created_at >= $${values.length}::date`);
  }
  if (to) {
    values.push(to);
    where.push(`i.created_at < ($${values.length}::date + interval '1 day')`);
  }
  return { values, sql: where.length ? `where ${where.join(' and ')}` : '' };
}

async function handler(request, response) {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/health') {
      const result = await pool.query('select current_database() as database');
      return json(response, 200, {
        ok: true,
        database: result.rows[0].database,
      });
    }
    if (url.pathname === '/uploads' && request.method === 'POST') {
      const contentType =
        request.headers['content-type'] || 'application/octet-stream';
      const scope =
        url.searchParams.get('scope') === 'inquiry' ? 'inquiry' : 'content';
      const inquiryId =
        scope === 'inquiry' ? Number(url.searchParams.get('inquiryId')) : null;
      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ];
      if (!allowed.includes(String(contentType)))
        return json(response, 400, {
          message: '허용되지 않는 파일 형식입니다.',
        });
      if (scope === 'content' && !String(contentType).startsWith('image/'))
        return json(response, 400, {
          message: '콘텐츠에는 이미지 파일만 업로드할 수 있습니다.',
        });
      if (scope === 'inquiry' && !Number.isInteger(inquiryId))
        return json(response, 400, {
          message: '문의 정보가 올바르지 않습니다.',
        });
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (scope === 'inquiry' && size > 10 * 1024 * 1024)
          return json(response, 413, {
            message: '문의 첨부파일은 파일당 10MB 이하만 업로드할 수 있습니다.',
          });
        chunks.push(chunk);
      }
      const original = decodeURIComponent(
        url.searchParams.get('filename') || 'image',
      );
      const extension = (
        original.match(/\.[a-zA-Z0-9]+$/)?.[0] || ''
      ).toLowerCase();
      const key = `${scope === 'inquiry' ? 'private/inquiries' : 'uploads'}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: Buffer.concat(chunks),
          ContentType: String(contentType),
        }),
      );
      const result = await pool.query(
        'insert into content_assets(object_key,original_name,content_type,size_bytes,inquiry_id) values($1,$2,$3,$4,$5) returning *',
        [key, original, String(contentType), size, inquiryId],
      );
      return json(response, 201, {
        ...result.rows[0],
        url:
          scope === 'inquiry'
            ? `/api/admin/assets/${key}`
            : `/api/uploads/${key}`,
      });
    }
    const uploadMatch = url.pathname.match(/^\/uploads\/(.+)$/);
    if (uploadMatch && request.method === 'GET') {
      const key = decodeURIComponent(uploadMatch[1]);
      const object = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      const bytes = await object.Body.transformToByteArray();
      response.writeHead(200, {
        'content-type': object.ContentType || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      });
      return response.end(Buffer.from(bytes));
    }
    if (uploadMatch && request.method === 'DELETE') {
      const key = decodeURIComponent(uploadMatch[1]);
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      await pool.query('delete from content_assets where object_key=$1', [key]);
      return json(response, 200, { ok: true });
    }

    if (url.pathname === '/inquiries' && request.method === 'POST') {
      const value = await body(request);
      const tracking = value.attribution || {};
      const result = await pool.query(
        `insert into inquiries (name, organization, contact, message, inquiry_channel, source_type, source_name, campaign, ad_group, keyword, content, landing_page, submitted_page, referrer, device_type, page_view_count, first_visited_at, elapsed_seconds, attribution_raw, last_source_type, last_source_name, last_campaign, last_ad_group, last_keyword, last_content, last_landing_page, last_referrer, session_count, session_page_view_count, last_visited_at, journey, quality_flags)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,nullif($17,'')::timestamptz,$18,$19::jsonb,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,nullif($30,'')::timestamptz,$31::jsonb,$32::jsonb) returning *`,
        [
          value.name,
          value.organization,
          value.contact,
          value.message,
          tracking.inquiryChannel,
          tracking.sourceType,
          tracking.sourceName,
          tracking.campaign,
          tracking.adGroup,
          tracking.keyword,
          tracking.content,
          tracking.landingPage,
          tracking.submittedPage,
          tracking.referrer,
          tracking.deviceType,
          tracking.pageViewCount,
          tracking.firstVisitedAt,
          tracking.elapsedSeconds,
          JSON.stringify(tracking.raw || {}),
          tracking.lastSourceType,
          tracking.lastSourceName,
          tracking.lastCampaign,
          tracking.lastAdGroup,
          tracking.lastKeyword,
          tracking.lastContent,
          tracking.lastLandingPage,
          tracking.lastReferrer,
          tracking.sessionCount,
          tracking.sessionPageViewCount,
          tracking.lastVisitedAt,
          JSON.stringify(tracking.journey || { pages: [], events: [] }),
          JSON.stringify(tracking.qualityFlags || []),
        ],
      );
      return json(response, 201, result.rows[0]);
    }
    if (url.pathname === '/inquiries' && request.method === 'GET') {
      const filter = inquiryFilter(url);
      const result = await pool.query(
        `select i.*, coalesce((select json_agg(json_build_object('id',a.id,'name',a.original_name,'type',a.content_type,'size',a.size_bytes,'url','/api/admin/assets/'||a.object_key) order by a.id) from content_assets a where a.inquiry_id=i.id),'[]'::json) attachments from inquiries i ${filter.sql} order by i.created_at desc`,
        filter.values,
      );
      return json(response, 200, { inquiries: result.rows });
    }
    if (url.pathname === '/inquiries/export' && request.method === 'GET') {
      const filter = inquiryFilter(url);
      const result = await pool.query(
        `select i.* from inquiries i ${filter.sql} order by i.created_at desc`,
        filter.values,
      );
      const bytes = await buildInquiryWorkbook(result.rows);
      response.writeHead(200, {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="oic-inquiries-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'content-length': bytes.length,
      });
      return response.end(bytes);
    }
    const inquiryMatch = url.pathname.match(/^\/inquiries\/(\d+)$/);
    if (inquiryMatch && request.method === 'PATCH') {
      const value = await body(request);
      const result = await pool.query(
        `update inquiries set status=$1, assignee=$2, memo=$3, updated_at=now()
         where id=$4 returning *`,
        [
          value.status,
          value.assignee ?? '',
          value.memo ?? '',
          Number(inquiryMatch[1]),
        ],
      );
      return json(
        response,
        result.rowCount ? 200 : 404,
        result.rows[0] ?? { message: '문의가 없습니다.' },
      );
    }
    if (inquiryMatch && request.method === 'DELETE') {
      const assets = await pool.query(
        'select object_key from content_assets where inquiry_id=$1',
        [Number(inquiryMatch[1])],
      );
      for (const asset of assets.rows)
        await s3.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: asset.object_key }),
        );
      const result = await pool.query('delete from inquiries where id=$1', [
        Number(inquiryMatch[1]),
      ]);
      return json(response, result.rowCount ? 200 : 404, {
        ok: Boolean(result.rowCount),
      });
    }

    if (url.pathname === '/content' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      const values = type ? [type] : [];
      const result = await pool.query(
        `select id, type, slug, title, data, sort_order, published, created_at, updated_at
         from content_items ${type ? 'where type=$1' : ''}
         order by type, sort_order, id`,
        values,
      );
      return json(response, 200, { items: result.rows });
    }
    if (url.pathname === '/content' && request.method === 'POST') {
      const value = await body(request);
      const result = await pool.query(
        `insert into content_items (type, slug, title, data, sort_order, published)
         values ($1,$2,$3,$4,$5,$6) returning *`,
        [
          value.type,
          value.slug,
          value.title,
          value.data ?? {},
          value.sort_order ?? 0,
          value.published !== false,
        ],
      );
      return json(response, 201, result.rows[0]);
    }
    const contentMatch = url.pathname.match(/^\/content\/(\d+)$/);
    if (contentMatch && request.method === 'PUT') {
      const value = await body(request);
      const result = await pool.query(
        `update content_items set type=$1, slug=$2, title=$3, data=$4,
         sort_order=$5, published=$6, updated_at=now() where id=$7 returning *`,
        [
          value.type,
          value.slug,
          value.title,
          value.data ?? {},
          value.sort_order ?? 0,
          value.published !== false,
          Number(contentMatch[1]),
        ],
      );
      return json(
        response,
        result.rowCount ? 200 : 404,
        result.rows[0] ?? { message: '콘텐츠가 없습니다.' },
      );
    }
    if (contentMatch && request.method === 'DELETE') {
      const result = await pool.query('delete from content_items where id=$1', [
        Number(contentMatch[1]),
      ]);
      return json(response, result.rowCount ? 200 : 404, {
        ok: Boolean(result.rowCount),
      });
    }
    return json(response, 404, { message: 'Not found' });
  } catch (error) {
    return json(response, 500, {
      message: error instanceof Error ? error.message : 'Database error',
    });
  }
}

const server = http.createServer(handler);
server.listen(port, '127.0.0.1', () =>
  console.log(`PostgreSQL content API: http://127.0.0.1:${port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => pool.end().finally(() => process.exit(0))),
  );
