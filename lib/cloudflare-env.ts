import { env } from 'cloudflare:workers';

export type OicCloudflareEnv = {
  DB: D1Database;
  FILES: R2Bucket;
  ADMIN_LOGIN_ID?: string;
  ADMIN_LOGIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_ALLOWED_HOSTNAMES?: string;
};

export function cloudflareEnv() {
  return env as unknown as OicCloudflareEnv;
}
