import type { MetadataRoute } from 'next';
import { cases, products } from '@/lib/catalog';
import { getContentRecords } from '@/lib/content-data';
import type { CaseStudy, Product } from '@/lib/catalog';
import { PUBLIC_SITE_URL } from '@/lib/content-types';
import { sitemapImages } from '@/lib/sitemap-images';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = PUBLIC_SITE_URL;
  const [productRecords, caseRecords] = await Promise.all([
    getContentRecords<Product>('product'),
    getContentRecords<CaseStudy>('case'),
  ]);
  const productMap = new Map(
    products.map((product) => [
      product.slug,
      {
        slug: product.slug,
        updatedAt: undefined as string | undefined,
        images: sitemapImages(product),
      },
    ]),
  );
  const caseMap = new Map(
    cases.map((item) => [
      item.slug,
      {
        slug: item.slug,
        updatedAt: undefined as string | undefined,
        images: sitemapImages(item),
      },
    ]),
  );
  for (const record of productRecords)
    productMap.set(record.slug, {
      slug: record.slug,
      updatedAt: record.updated_at,
      images: sitemapImages(record.data),
    });
  for (const record of caseRecords)
    caseMap.set(record.slug, {
      slug: record.slug,
      updatedAt: record.updated_at,
      images: sitemapImages(record.data),
    });
  const productImages = [...productMap.values()].flatMap((item) =>
    item.images.slice(0, 1),
  );
  const caseImages = [...caseMap.values()].flatMap((item) =>
    item.images.slice(0, 1),
  );
  return [
    {
      url: `${base}/`,
      changeFrequency: 'weekly',
      priority: 1,
      images: [
        ...new Set([
          ...productImages,
          ...[...caseMap.values()]
            .slice(0, 9)
            .flatMap((item) => item.images.slice(0, 1)),
        ]),
      ],
    },
    { url: `${base}/business`, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${base}/products`,
      changeFrequency: 'weekly',
      priority: 0.9,
      images: productImages,
    },
    {
      url: `${base}/cases`,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: caseImages,
    },
    { url: `${base}/info`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${base}/people/shin-jaehoon`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${base}/inquiry`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/simulator`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    ...[...productMap.values()].map((item) => ({
      url: `${base}/products/${item.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      images: item.images,
      ...(item.updatedAt ? { lastModified: new Date(item.updatedAt) } : {}),
    })),
    ...[...caseMap.values()].map((item) => ({
      url: `${base}/cases/${item.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      images: item.images,
      ...(item.updatedAt ? { lastModified: new Date(item.updatedAt) } : {}),
    })),
  ];
}
