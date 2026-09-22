import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

process.loadEnvFile?.('.env.local');

const skipR2 = process.argv.includes('--skip-r2');
const remoteR2Bucket = 'ad-bucket';
const publicSiteUrl = 'https://display.dsko.co.kr';
const required = ['DATABASE_URL'];
if (!skipR2) {
  required.push(
    'MINIO_ENDPOINT',
    'MINIO_BUCKET',
    'MINIO_ROOT_USER',
    'MINIO_ROOT_PASSWORD',
  );
}
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} 환경변수가 필요합니다.`);
}

const pg = new Pool({ connectionString: process.env.DATABASE_URL });
const s3 = skipR2
  ? null
  : new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
      },
    });

const json = (value, fallback) =>
  JSON.stringify(value == null ? fallback : value);
const time = (value) =>
  value instanceof Date
    ? value.toISOString()
    : value == null
      ? null
      : String(value);
const sqlValue = (value) => {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number' || typeof value === 'bigint')
    return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
};

const runWrangler = (args, options = {}) => {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', ...args],
    { cwd: process.cwd(), encoding: 'utf8', ...options },
  );
  if (result.status !== 0) {
    throw new Error(
      result.stderr || result.stdout || `Wrangler failed: ${args.join(' ')}`,
    );
  }
  return result.stdout;
};

const content = (await pg.query('SELECT * FROM content_items ORDER BY id'))
  .rows;
const inquiries = (await pg.query('SELECT * FROM inquiries ORDER BY id')).rows;
const assets = (await pg.query('SELECT * FROM content_assets ORDER BY id'))
  .rows;

const contentColumns = [
  'id',
  'type',
  'slug',
  'title',
  'data',
  'sort_order',
  'published',
  'created_at',
  'updated_at',
];
const inquiryColumns = [
  'id',
  'name',
  'organization',
  'contact',
  'message',
  'status',
  'assignee',
  'memo',
  'inquiry_channel',
  'source_type',
  'source_name',
  'campaign',
  'ad_group',
  'keyword',
  'content',
  'landing_page',
  'submitted_page',
  'referrer',
  'device_type',
  'page_view_count',
  'first_visited_at',
  'elapsed_seconds',
  'attribution_raw',
  'last_source_type',
  'last_source_name',
  'last_campaign',
  'last_ad_group',
  'last_keyword',
  'last_content',
  'last_landing_page',
  'last_referrer',
  'session_count',
  'session_page_view_count',
  'last_visited_at',
  'journey',
  'quality_flags',
  'created_at',
  'updated_at',
];
const assetColumns = [
  'id',
  'object_key',
  'original_name',
  'content_type',
  'size_bytes',
  'inquiry_id',
  'created_at',
];

const normalizedInquiryValue = (row, column) => {
  const value = row[column];
  if (['attribution_raw', 'journey', 'quality_flags'].includes(column)) {
    return json(value, column === 'quality_flags' ? [] : {});
  }
  if (column.endsWith('_at')) return time(value);
  return value;
};

const upsert = (table, columns, values) => {
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column}=excluded.${column}`)
    .join(',');
  return `INSERT INTO ${table} (${columns.join(',')}) VALUES (${values
    .map(sqlValue)
    .join(',')}) ON CONFLICT(id) DO UPDATE SET ${updates};`;
};

const statements = ['PRAGMA foreign_keys=ON;'];
for (const row of content) {
  const contentData =
    row.type === 'seo' ? { ...row.data, siteUrl: publicSiteUrl } : row.data;
  statements.push(
    upsert('content_items', contentColumns, [
      Number(row.id),
      row.type,
      row.slug,
      row.title,
      json(contentData, {}),
      Number(row.sort_order),
      row.published ? 1 : 0,
      time(row.created_at),
      time(row.updated_at),
    ]),
  );
}
for (const row of inquiries) {
  statements.push(
    upsert(
      'inquiries',
      inquiryColumns,
      inquiryColumns.map((column) => normalizedInquiryValue(row, column)),
    ),
  );
}
for (const row of assets) {
  statements.push(
    upsert('content_assets', assetColumns, [
      Number(row.id),
      row.object_key,
      row.original_name,
      row.content_type,
      Number(row.size_bytes),
      row.inquiry_id == null ? null : Number(row.inquiry_id),
      time(row.created_at),
    ]),
  );
}
const temporaryDirectory = mkdtempSync(
  join(tmpdir(), 'oic-cloudflare-migrate-'),
);
const sqlFile = join(temporaryDirectory, 'legacy-data.sql');
try {
  writeFileSync(sqlFile, `${statements.join('\n')}\n`, { mode: 0o600 });
  runWrangler([
    'd1',
    'execute',
    'oic-korea-db',
    '--remote',
    '--config',
    'wrangler.jsonc',
    '--file',
    sqlFile,
  ]);

  if (!skipR2) {
    for (const asset of assets) {
      const object = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.MINIO_BUCKET,
          Key: asset.object_key,
        }),
      );
      const bytes = await object.Body.transformToByteArray();
      runWrangler(
        [
          'r2',
          'object',
          'put',
          `${remoteR2Bucket}/${asset.object_key}`,
          '--remote',
          '--config',
          'wrangler.jsonc',
          '--pipe',
          '--content-type',
          asset.content_type ||
            object.ContentType ||
            'application/octet-stream',
          '--force',
        ],
        { input: Buffer.from(bytes) },
      );
    }
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
  await pg.end();
}

console.log(
  JSON.stringify({
    content_items: content.length,
    inquiries: inquiries.length,
    content_assets: assets.length,
    r2_objects: skipR2 ? 0 : assets.length,
  }),
);
