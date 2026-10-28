import type { Metadata } from 'next';
import './globals.css';
import './refinements.css';
import './request-updates.css';
import './editor.css';
import './image-sizing.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './design-refresh.css';
import { getContentItems } from '@/lib/content-data';
import {
  defaultSeoSettings,
  PUBLIC_SITE_URL,
  type SeoSettings,
} from '@/lib/content-types';
import { AttributionTracker } from '@/components/attribution-tracker';
import { getSiteSettings } from '@/lib/site-settings-data';

export async function generateMetadata(): Promise<Metadata> {
  const [saved] = await getContentItems<SeoSettings>('seo');
  const seo = { ...defaultSeoSettings, ...saved };
  return {
    metadataBase: new URL(seo.siteUrl),
    title: { default: seo.title, template: seo.titleTemplate },
    description: seo.description,
    alternates: { canonical: '/' },
    keywords: seo.keywords,
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: seo.siteName,
      url: '/',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [{ url: seo.ogImage, alt: seo.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [seo.ogImage],
    },
    robots: {
      index: seo.allowIndexing,
      follow: seo.allowIndexing,
      googleBot: {
        index: seo.allowIndexing,
        follow: seo.allowIndexing,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteSettings();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${PUBLIC_SITE_URL}/#organization`,
        name: '주식회사 오아이씨코리아',
        url: `${PUBLIC_SITE_URL}/`,
        logo: `${PUBLIC_SITE_URL}/oic/logo.png`,
        image: `${PUBLIC_SITE_URL}/oic/logo.png`,
        telephone: site.consultantPhone,
        email: site.consultantEmail,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: site.consultantPhone,
          email: site.consultantEmail,
          availableLanguage: 'Korean',
        },
        sameAs: ['https://www.oickorea.com/'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: '안남로 369번길 12, 5층',
          addressLocality: '부평구',
          addressRegion: '인천광역시',
          addressCountry: 'KR',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${PUBLIC_SITE_URL}/#website`,
        url: `${PUBLIC_SITE_URL}/`,
        name: '오아이씨코리아',
        publisher: { '@id': `${PUBLIC_SITE_URL}/#organization` },
      },
    ],
  };
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body>
        <AttributionTracker />
        <SiteHeader initialSite={site} />
        {children}
        <SiteFooter initialSite={site} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </body>
    </html>
  );
}
