import type { MetadataRoute } from 'next';
import { PUBLIC_SITE_URL } from '@/lib/content-types';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent:'*', allow:'/', disallow:['/api/'] },
      { userAgent:'OAI-SearchBot', allow:'/', disallow:['/api/'] },
      { userAgent:'ChatGPT-User', allow:'/', disallow:['/api/'] },
      { userAgent:'PerplexityBot', allow:'/', disallow:['/api/'] },
      { userAgent:'ClaudeBot', allow:'/', disallow:['/api/'] },
      { userAgent:'Google-Extended', allow:'/', disallow:['/api/'] },
    ],
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
