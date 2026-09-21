import { cloudflareEnv } from './cloudflare-env';
import { PUBLIC_SITE_URL } from './content-types';
import { logInfo, logWarning } from './monitoring';

type ChangedContent = Record<string, unknown> & {
  type?: unknown;
  slug?: unknown;
};

function contentPaths(item: ChangedContent) {
  const type = typeof item.type === 'string' ? item.type : '';
  const slug = typeof item.slug === 'string' ? item.slug : '';
  if (type === 'product' && slug) return [`/products/${slug}`, '/products'];
  if (type === 'case' && slug) return [`/cases/${slug}`, '/cases'];
  if (type === 'faq') return ['/info'];
  if (type === 'site' || type === 'seo') return ['/'];
  return [];
}

export async function notifyContentIndexNow(item: ChangedContent) {
  return notifyIndexNow(contentPaths(item));
}

export async function notifyIndexNow(paths: string[]) {
  const key = cloudflareEnv().INDEXNOW_KEY;
  if (!key || paths.length === 0) {
    if (!key) logWarning('indexnow.not_configured');
    return false;
  }
  const origin = new URL(PUBLIC_SITE_URL);
  const urlList = [...new Set(paths)].map((path) => new URL(path, origin).toString());
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: origin.hostname,
        key,
        keyLocation: `${origin.origin}/indexnow-key.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      logWarning('indexnow.rejected', { status: response.status, urls: urlList.length });
      return false;
    }
    logInfo('indexnow.submitted', { status: response.status, urls: urlList.length });
    return true;
  } catch {
    logWarning('indexnow.failed', { urls: urlList.length });
    return false;
  }
}
