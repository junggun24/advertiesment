import { env } from 'cloudflare:workers';

export type OicCloudflareEnv = {
  DB: D1Database;
  FILES: R2Bucket;
  ADMIN_LOGIN_ID?: string;
  ADMIN_LOGIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
};

export function cloudflareEnv() {
  return env as unknown as OicCloudflareEnv;
}
