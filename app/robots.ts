import type { MetadataRoute } from 'next';
import { PUBLIC_SITE_URL } from '@/lib/content-types';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      '*',
      'OAI-SearchBot',
      'ChatGPT-User',
      'PerplexityBot',
      'ClaudeBot',
      'Google-Extended',
    ].map((userAgent) => ({
      userAgent,
      allow: ['/', '/api/uploads/'],
      disallow: ['/api/', '/api/uploads/private/'],
    })),
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
