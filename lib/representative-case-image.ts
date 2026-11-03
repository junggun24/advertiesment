import { cache } from 'react';
import type { CaseStudy } from './catalog';
import { getContentItems } from './content-data';

const preferredCases: Record<string, string> = {
  'information-led-board': 'safety-information-board',
  'video-wall': 'khnphangang',
  'outdoor-kiosk': 'ganghwa',
};
const publishedCases = cache(() => getContentItems<CaseStudy>('case'));

export async function getRepresentativeCaseImage(
  productSlug?: string,
  caseSlug = 'public-office-board',
) {
  const items = (await publishedCases()).filter(
    (item) => item.image && (!productSlug || item.productSlug === productSlug),
  );
  const preferred = productSlug ? preferredCases[productSlug] : caseSlug;
  const item = items.find((item) => item.slug === preferred) ?? items[0];
  return item
    ? { url: item.image, alt: `${item.title} 실제 설치 현장` }
    : undefined;
}
