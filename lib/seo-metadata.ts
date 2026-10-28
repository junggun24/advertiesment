import type { Metadata } from 'next';
import { PUBLIC_SITE_URL } from '@/lib/content-types';

export function absoluteSiteUrl(value: string) {
  return new URL(value, PUBLIC_SITE_URL).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  image = '/oic/prod-notice.jpg',
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: '오아이씨코리아',
      title,
      description,
      url: path,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
