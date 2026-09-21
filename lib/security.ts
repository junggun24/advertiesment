import { cloudflareEnv } from './cloudflare-env';
import { logError, logWarning } from './monitoring';

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
};

type TurnstileResult = {
  success: boolean;
  reason?: string;
};

function clientAddress(request: Request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
}

async function hashIdentifier(value: string) {
  const secret = cloudflareEnv().ADMIN_SESSION_SECRET ?? 'oic-rate-limit';
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${secret}:${value}`),
  );
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const identifier = await hashIdentifier(clientAddress(request));
  const row = await cloudflareEnv().DB.prepare(
    `INSERT INTO request_rate_limits
      (scope, identifier_hash, window_start, hits, updated_at)
     VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(scope, identifier_hash, window_start)
     DO UPDATE SET hits = hits + 1, updated_at = CURRENT_TIMESTAMP
     RETURNING hits`,
  ).bind(scope, identifier, windowStart).first<{ hits: number }>();
  const hits = Number(row?.hits ?? 1);
  const retryAfter = Math.max(1, windowStart + windowSeconds - now);
  const allowed = hits <= limit;
  if (!allowed) {
    logWarning('security.rate_limit_exceeded', { scope, hits, limit });
  }
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - hits),
    retryAfter,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers({
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
  });
  if (!result.allowed) headers.set('Retry-After', String(result.retryAfter));
  return headers;
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function turnstileClientConfig(request: Request) {
  const { TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY } = cloudflareEnv();
  const enabled = Boolean(TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY);
  return {
    enabled,
    required: enabled && !isLocalRequest(request),
    siteKey: enabled ? TURNSTILE_SITE_KEY ?? '' : '',
  };
}

export async function verifyTurnstile(
  request: Request,
  token: string,
  expectedAction: 'inquiry' | 'admin_login',
): Promise<TurnstileResult> {
  const config = cloudflareEnv();
  if (!config.TURNSTILE_SECRET_KEY) {
    if (!isLocalRequest(request)) {
      logWarning('security.turnstile_not_configured', { action: expectedAction });
    }
    return { success: true };
  }
  if (!token || token.length > 2048) {
    return { success: false, reason: '보안 검증을 완료해 주세요.' };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: config.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientAddress(request),
        idempotency_key: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json() as {
      success?: boolean;
      hostname?: string;
      action?: string;
      'error-codes'?: string[];
    };
    const allowedHostnames = (config.TURNSTILE_ALLOWED_HOSTNAMES || new URL(request.url).hostname)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const valid = Boolean(
      result.success
      && result.action === expectedAction
      && result.hostname
      && allowedHostnames.includes(result.hostname),
    );
    if (!valid) {
      logWarning('security.turnstile_rejected', {
        action: expectedAction,
        hostname: result.hostname ?? null,
        codes: result['error-codes']?.join(',') ?? null,
      });
    }
    return valid
      ? { success: true }
      : { success: false, reason: '보안 검증에 실패했습니다. 다시 시도해 주세요.' };
  } catch (error) {
    logError('security.turnstile_error', error, { action: expectedAction });
    return { success: false, reason: '보안 검증을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
}
