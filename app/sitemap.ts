import type { MetadataRoute } from 'next';
import { cases, products } from '@/lib/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const base='https://oic-korea-display.changsoft101.chatgpt.site';
  return [
    {url:`${base}/`,changeFrequency:'weekly',priority:1},
    {url:`${base}/products`,changeFrequency:'weekly',priority:.9},
    {url:`${base}/cases`,changeFrequency:'weekly',priority:.8},
    {url:`${base}/info`,changeFrequency:'weekly',priority:.9},
    ...products.map(p=>({url:`${base}/products/${p.slug}`,changeFrequency:'monthly' as const,priority:.8})),
    ...cases.map(c=>({url:`${base}/cases/${c.slug}`,changeFrequency:'monthly' as const,priority:.7})),
  ];
}
