import type { Metadata } from 'next';
import { PUBLIC_SITE_URL } from '@/lib/content-types';
import { getRepresentativeCaseImage } from './representative-case-image';

export function absoluteSiteUrl(value: string) {
  return new URL(value, PUBLIC_SITE_URL).toString();
}

export async function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Promise<Metadata> {
  const caseImage = image
    ? undefined
    : await getRepresentativeCaseImage(
        undefined,
        path === '/cases' ? 'exyangyang' : 'public-office-board',
      );
  const shareImage = image
    ? { url: image, alt: title }
    : (caseImage ?? { url: '/oic/case-1.jpg', alt: title });
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
      images: [shareImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage.url],
    },
  };
}
