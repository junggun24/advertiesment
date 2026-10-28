import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import sharp from 'sharp';
import {
  IMAGE_VARIANT_WIDTHS,
  imageVariantKey,
  imageVariantWidthsFor,
} from '../lib/responsive-images.ts';

const args = new Map(
  process.argv.slice(2).map((value) => {
    const [key, ...rest] = value.split('=');
    return [key, rest.join('=') || true];
  }),
);
const origin = String(args.get('--origin') || 'https://dsko.co.kr').replace(
  /\/$/,
  '',
);
const bucket = String(args.get('--bucket') || 'ad-bucket');
const apply = args.has('--apply');
const confirmedBucket = args.get('--confirm-write');
const limit = Math.max(0, Number(args.get('--limit') || 0));
const onlyKey = args.get('--key') ? String(args.get('--key')) : '';
const wrangler = resolve('node_modules/.bin/wrangler');

if (apply && confirmedBucket !== bucket) {
  throw new Error(
    `원격 저장을 실행하려면 --confirm-write=${bucket} 값을 함께 지정해야 합니다.`,
  );
}

function collectUploadKeys(value, result = new Set()) {
  if (typeof value === 'string') {
    const matches = value.matchAll(
      /(?:https?:\/\/[^\s"'<>]+)?\/api\/uploads\/([^\s"'<>?]+)/gi,
    );
    for (const match of matches) {
      let key;
      try {
        key = decodeURIComponent(match[1]).replace(/&amp;.*$/, '');
      } catch {
        continue;
      }
      if (
        key.startsWith('uploads/') &&
        !IMAGE_VARIANT_WIDTHS.some((width) => key.endsWith(`@${width}.webp`))
      )
        result.add(key);
    }
    return result;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUploadKeys(item, result);
    return result;
  }
  if (value && typeof value === 'object')
    for (const item of Object.values(value)) collectUploadKeys(item, result);
  return result;
}

function uploadVariant(key, buffer) {
  const command = spawnSync(
    wrangler,
    [
      'r2',
      'object',
      'put',
      `${bucket}/${key}`,
      '--remote',
      '--pipe',
      '--content-type',
      'image/webp',
      '--force',
    ],
    { input: buffer, maxBuffer: 10 * 1024 * 1024 },
  );
  if (command.status !== 0)
    throw new Error(
      Buffer.concat([
        command.stdout ?? Buffer.alloc(0),
        command.stderr ?? Buffer.alloc(0),
      ])
        .toString('utf8')
        .trim() || `wrangler 종료 코드 ${command.status}`,
    );
}

if (apply) {
  const auth = spawnSync(wrangler, ['whoami'], { encoding: 'utf8' });
  if (auth.status !== 0)
    throw new Error(
      'Wrangler 인증이 필요합니다. 먼저 npx wrangler login을 실행하세요.',
    );
}

const contentResponse = await fetch(`${origin}/api/content`, {
  signal: AbortSignal.timeout(30_000),
});
if (!contentResponse.ok)
  throw new Error(`콘텐츠 목록 조회 실패: HTTP ${contentResponse.status}`);
const content = await contentResponse.json();
const discoveredKeys = [...collectUploadKeys(content)].sort((left, right) =>
  left.localeCompare(right),
);
if (onlyKey && !discoveredKeys.includes(onlyKey))
  throw new Error(`운영 콘텐츠에서 지정한 원본을 찾지 못했습니다: ${onlyKey}`);
const selectedKeys = onlyKey ? [onlyKey] : discoveredKeys;
const keys = limit ? selectedKeys.slice(0, limit) : selectedKeys;
const report = {
  mode: apply ? 'apply' : 'dry-run',
  origin,
  bucket,
  referenced_originals: discoveredKeys.length,
  processed_originals: 0,
  skipped_originals: 0,
  planned_variants: 0,
  written_variants: 0,
  source_bytes: 0,
  variant_bytes: 0,
  failures: [],
};

for (const [index, key] of keys.entries()) {
  try {
    const response = await fetch(`${origin}/api/uploads/${key}`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`원본 HTTP ${response.status}`);
    if (response.headers.get('content-type')?.includes('image/gif')) {
      report.skipped_originals += 1;
      continue;
    }
    const source = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) {
      report.skipped_originals += 1;
      continue;
    }
    report.processed_originals += 1;
    report.source_bytes += source.byteLength;
    const widths = imageVariantWidthsFor(metadata.width);
    report.planned_variants += widths.length;
    for (const width of widths) {
      const variant = await sharp(source)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      report.variant_bytes += variant.byteLength;
      if (apply) {
        uploadVariant(imageVariantKey(key, width), variant);
        report.written_variants += 1;
      }
    }
    if ((index + 1) % 25 === 0)
      process.stderr.write(`처리 ${index + 1}/${keys.length}\n`);
  } catch (error) {
    report.failures.push({
      key,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;
