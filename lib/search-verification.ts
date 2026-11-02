import type { SeoSettings } from './content-types.ts';

export function searchVerificationMetadata(
  seo: Pick<
    SeoSettings,
    'googleVerification' | 'naverVerification' | 'bingVerification'
  >,
) {
  const other: Record<string, string> = {};
  if (seo.naverVerification.trim())
    other['naver-site-verification'] = seo.naverVerification.trim();
  if (seo.bingVerification.trim())
    other['msvalidate.01'] = seo.bingVerification.trim();
  return {
    google: seo.googleVerification.trim() || undefined,
    other,
  };
}
