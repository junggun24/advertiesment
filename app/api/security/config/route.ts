import { turnstileClientConfig } from '@/lib/security';

export function GET(request: Request) {
  return Response.json(turnstileClientConfig(request), {
    headers: { 'cache-control': 'no-store' },
  });
}
