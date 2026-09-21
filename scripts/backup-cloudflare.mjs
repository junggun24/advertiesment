import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const sourceDatabase = 'oic-korea-db';
const sourceBucket = 'ad-bucket';
const backupBucket = 'ad-backup';
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replace(/\.\d{3}Z$/, 'Z');
const prefix = `backups/${timestamp}`;

function wrangler(args, options = {}) {
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
}

const workingDirectory = mkdtempSync(join(tmpdir(), 'oic-cloudflare-backup-'));
try {
  const d1File = join(workingDirectory, 'd1.sql');
  wrangler([
    'd1',
    'export',
    sourceDatabase,
    '--remote',
    '--config',
    'wrangler.jsonc',
    '--output',
    d1File,
    '--skip-confirmation',
  ]);
  wrangler([
    'r2',
    'object',
    'put',
    `${backupBucket}/${prefix}/d1.sql`,
    '--remote',
    '--config',
    'wrangler.jsonc',
    '--file',
    d1File,
    '--content-type',
    'application/sql',
    '--force',
  ]);

  const queryOutput = wrangler([
    'd1',
    'execute',
    sourceDatabase,
    '--remote',
    '--config',
    'wrangler.jsonc',
    '--json',
    '--command',
    'SELECT object_key, original_name, content_type, size_bytes FROM content_assets ORDER BY object_key',
  ]);
  const query = JSON.parse(queryOutput);
  const assets = query[0]?.results ?? [];
  const manifestAssets = [];
  for (const asset of assets) {
    const localFile = join(workingDirectory, 'r2', asset.object_key);
    mkdirSync(dirname(localFile), { recursive: true });
    wrangler([
      'r2',
      'object',
      'get',
      `${sourceBucket}/${asset.object_key}`,
      '--remote',
      '--config',
      'wrangler.jsonc',
      '--file',
      localFile,
    ]);
    const bytes = readFileSync(localFile);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    wrangler([
      'r2',
      'object',
      'put',
      `${backupBucket}/${prefix}/r2/${asset.object_key}`,
      '--remote',
      '--config',
      'wrangler.jsonc',
      '--file',
      localFile,
      '--content-type',
      asset.content_type || 'application/octet-stream',
      '--force',
    ]);
    manifestAssets.push({ ...asset, sha256 });
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    sourceDatabase,
    sourceBucket,
    backupBucket,
    prefix,
    assetCount: manifestAssets.length,
    assets: manifestAssets,
  };
  const manifestFile = join(workingDirectory, 'manifest.json');
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  wrangler([
    'r2',
    'object',
    'put',
    `${backupBucket}/${prefix}/manifest.json`,
    '--remote',
    '--config',
    'wrangler.jsonc',
    '--file',
    manifestFile,
    '--content-type',
    'application/json',
    '--force',
  ]);
  console.log(
    JSON.stringify({ ok: true, prefix, assets: manifestAssets.length }),
  );
} finally {
  rmSync(workingDirectory, { recursive: true, force: true });
}
