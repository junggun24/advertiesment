const ADMIN_ID = 'admin';
const ADMIN_PASSWORD = 'admin123';
const SESSION_MAX_AGE = 60 * 60 * 12;
const SESSION_SECRET = 'oic-local-admin-session-2026';

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function credentialsAreValid(id: string, password: string) {
  return id === ADMIN_ID && password === ADMIN_PASSWORD;
}

export async function createAdminSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const signature = await sign(String(expiresAt));
  return `${expiresAt}.${signature}`;
}

export async function isAdminAuthenticated(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('oic_admin_session='))
    ?.slice('oic_admin_session='.length);

  if (!token) return false;
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  return signature === await sign(expiresAt);
}

export function adminCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `oic_admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function clearAdminCookie(request: Request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `oic_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
