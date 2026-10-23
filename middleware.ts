import { NextResponse, type NextRequest } from 'next/server';
import { canonicalRedirectUrl } from '@/lib/canonical-host';

export function middleware(request: NextRequest) {
  const target = canonicalRedirectUrl(request.url);
  return target ? NextResponse.redirect(target, 301) : NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
