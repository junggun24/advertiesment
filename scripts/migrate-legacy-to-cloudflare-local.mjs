import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

process.loadEnvFile?.('.env.local');

const required = [
  'DATABASE_URL',
  'MINIO_ENDPOINT',
  'MINIO_BUCKET',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} 환경변수가 필요합니다.`);
}

const pg = new Pool({ connectionString: process.env.DATABASE_URL });
const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
});

const d1Directory = join(
  process.cwd(),
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject',
);
const d1File = readdirSync(d1Directory)
  .filter((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite')
  .map((name) => join(d1Directory, name))
  .sort((a, b) => statSync(b).size - statSync(a).size)[0];
if (!d1File) throw new Error('로컬 D1 파일을 찾을 수 없습니다. 먼저 npm run db:init을 실행하세요.');

const json = (value, fallback) =>
  JSON.stringify(value == null ? fallback : value);
const time = (value) =>
  value instanceof Date ? value.toISOString() : value == null ? null : String(value);

const content = (await pg.query('SELECT * FROM content_items ORDER BY id')).rows;
const inquiries = (await pg.query('SELECT * FROM inquiries ORDER BY id')).rows;
const assets = (await pg.query('SELECT * FROM content_assets ORDER BY id')).rows;

for (const asset of assets) {
  const object = await s3.send(
    new GetObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: asset.object_key }),
  );
  const bytes = await object.Body.transformToByteArray();
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'r2',
      'object',
      'put',
      `oic-korea-local-files/${asset.object_key}`,
      '--local',
      '--config',
      'wrangler.jsonc',
      '--persist-to',
      '.wrangler/state',
      '--pipe',
      '--content-type',
      asset.content_type || object.ContentType || 'application/octet-stream',
      '--force',
    ],
    { cwd: process.cwd(), input: Buffer.from(bytes), encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(`R2 복사 실패: ${asset.object_key}\n${result.stderr || result.stdout}`);
  }
}

const db = new DatabaseSync(d1File);
db.exec('PRAGMA foreign_keys=ON');
db.exec('BEGIN IMMEDIATE');
try {
  const contentSql = db.prepare(`
    INSERT INTO content_items
      (id,type,slug,title,data,sort_order,published,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,slug=excluded.slug,title=excluded.title,data=excluded.data,
      sort_order=excluded.sort_order,published=excluded.published,
      created_at=excluded.created_at,updated_at=excluded.updated_at
  `);
  for (const row of content) {
    contentSql.run(
      Number(row.id), row.type, row.slug, row.title, json(row.data, {}),
      Number(row.sort_order), row.published ? 1 : 0, time(row.created_at),
      time(row.updated_at),
    );
  }

  const inquiryColumns = [
    'id','name','organization','contact','message','status','assignee','memo',
    'inquiry_channel','source_type','source_name','campaign','ad_group','keyword',
    'content','landing_page','submitted_page','referrer','device_type','page_view_count',
    'first_visited_at','elapsed_seconds','attribution_raw','last_source_type',
    'last_source_name','last_campaign','last_ad_group','last_keyword','last_content',
    'last_landing_page','last_referrer','session_count','session_page_view_count',
    'last_visited_at','journey','quality_flags','created_at','updated_at',
  ];
  const inquirySql = db.prepare(`
    INSERT INTO inquiries (${inquiryColumns.join(',')})
    VALUES (${inquiryColumns.map(() => '?').join(',')})
    ON CONFLICT(id) DO UPDATE SET ${inquiryColumns
      .filter((column) => column !== 'id')
      .map((column) => `${column}=excluded.${column}`)
      .join(',')}
  `);
  for (const row of inquiries) {
    inquirySql.run(
      ...inquiryColumns.map((column) => {
        const value = row[column];
        if (['attribution_raw','journey','quality_flags'].includes(column)) {
          return json(value, column === 'quality_flags' ? [] : {});
        }
        if (column.endsWith('_at')) return time(value);
        return typeof value === 'bigint' ? Number(value) : value;
      }),
    );
  }

  const assetSql = db.prepare(`
    INSERT INTO content_assets
      (id,object_key,original_name,content_type,size_bytes,inquiry_id,created_at)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      object_key=excluded.object_key,original_name=excluded.original_name,
      content_type=excluded.content_type,size_bytes=excluded.size_bytes,
      inquiry_id=excluded.inquiry_id,created_at=excluded.created_at
  `);
  for (const row of assets) {
    assetSql.run(
      Number(row.id), row.object_key, row.original_name, row.content_type,
      Number(row.size_bytes), row.inquiry_id == null ? null : Number(row.inquiry_id),
      time(row.created_at),
    );
  }
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
} finally {
  db.close();
  await pg.end();
}

console.log(
  JSON.stringify({
    content_items: content.length,
    inquiries: inquiries.length,
    content_assets: assets.length,
    r2_objects: assets.length,
  }),
);
