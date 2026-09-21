const SESSION_MAX_AGE = 60 * 60 * 12;
import { cloudflareEnv } from './cloudflare-env';

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function sign(value: string) {
  const secret = cloudflareEnv().ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('관리자 세션 비밀키가 설정되지 않았습니다.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function credentialsAreValid(id: string, password: string) {
  const config = cloudflareEnv();
  return Boolean(
    config.ADMIN_LOGIN_ID &&
    config.ADMIN_LOGIN_PASSWORD &&
    id === config.ADMIN_LOGIN_ID &&
    password === config.ADMIN_LOGIN_PASSWORD,
  );
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
