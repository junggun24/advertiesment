export const CANONICAL_HOST = 'dsko.co.kr';

const REDIRECT_HOSTS = new Set(['display.dsko.co.kr', 'www.dsko.co.kr']);

export function canonicalRedirectUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  if (!REDIRECT_HOSTS.has(url.hostname)) return null;
  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  return url;
}
