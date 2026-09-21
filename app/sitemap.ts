import type { MetadataRoute } from 'next';
import { cases, products } from '@/lib/catalog';
import { getContentRecords } from '@/lib/content-data';
import type { CaseStudy, Product } from '@/lib/catalog';
import { PUBLIC_SITE_URL } from '@/lib/content-types';

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const base=PUBLIC_SITE_URL;
  const [productRecords,caseRecords]=await Promise.all([getContentRecords<Product>('product'),getContentRecords<CaseStudy>('case')]);
  const productMap=new Map(products.map(product=>[product.slug,{slug:product.slug,updatedAt:undefined as string|undefined}]));
  const caseMap=new Map(cases.map(item=>[item.slug,{slug:item.slug,updatedAt:undefined as string|undefined}]));
  for(const record of productRecords)productMap.set(record.slug,{slug:record.slug,updatedAt:record.updated_at});
  for(const record of caseRecords)caseMap.set(record.slug,{slug:record.slug,updatedAt:record.updated_at});
  return [
    {url:`${base}/`,changeFrequency:'weekly',priority:1},
    {url:`${base}/business`,changeFrequency:'monthly',priority:.8},
    {url:`${base}/products`,changeFrequency:'weekly',priority:.9},
    {url:`${base}/cases`,changeFrequency:'weekly',priority:.8},
    {url:`${base}/info`,changeFrequency:'weekly',priority:.9},
    {url:`${base}/about`,changeFrequency:'monthly',priority:.8},
    {url:`${base}/people/shin-jaehoon`,changeFrequency:'monthly',priority:.7},
    {url:`${base}/inquiry`,changeFrequency:'monthly',priority:.8},
    {url:`${base}/simulator`,changeFrequency:'monthly',priority:.8},
    ...[...productMap.values()].map(item=>({url:`${base}/products/${item.slug}`,changeFrequency:'monthly' as const,priority:.8,...(item.updatedAt?{lastModified:new Date(item.updatedAt)}:{})})),
    ...[...caseMap.values()].map(item=>({url:`${base}/cases/${item.slug}`,changeFrequency:'monthly' as const,priority:.7,...(item.updatedAt?{lastModified:new Date(item.updatedAt)}:{})})),
  ];
}
