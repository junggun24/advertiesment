import { PUBLIC_SITE_URL } from './content-types.ts';
import { resolveContentImage } from './editor-content.ts';

type ImageContent = { thumbnail?: string; image?: string; body?: string };

export function sitemapImages(content: ImageContent) {
  const candidates = [
    resolveContentImage(content),
    ...[
      ...(content.body ?? '').matchAll(
        /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
      ),
    ].map((match) => match[1]),
  ];
  const images = new Set<string>();
  for (const source of candidates) {
    if (!source?.trim()) continue;
    try {
      const url = new URL(
        source.trim().replaceAll('&amp;', '&'),
        PUBLIC_SITE_URL,
      );
      const pathname = decodeURIComponent(url.pathname);
      if (url.origin !== PUBLIC_SITE_URL) continue;
      // Only public content uploads are crawlable API resources.
      if (
        pathname.startsWith('/api/') &&
        !pathname.startsWith('/api/uploads/uploads/')
      )
        continue;
      url.hash = '';
      images.add(url.href);
    } catch {
      // Invalid or external image sources do not belong in this site's sitemap.
    }
  }
  return [...images].slice(0, 1000);
}
