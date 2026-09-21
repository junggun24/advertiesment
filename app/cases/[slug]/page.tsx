import { ArrowRight, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getCase, getProduct } from '@/lib/catalog';
import type { Metadata } from 'next';
import { getContentItems } from '@/lib/content-data';
import type { CaseStudy, Product } from '@/lib/catalog';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const stored=await getContentItems<CaseStudy>('case');const c=stored.find(item=>item.slug===slug)??getCase(slug);return c?{title:c.title,description:c.summary,alternates:{canonical:`/cases/${slug}`},...(c.image?{openGraph:{images:[{url:c.image}]}}:{})}:{title:'사례를 찾을 수 없습니다.'}}

export default async function CaseDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const storedCases=await getContentItems<CaseStudy>('case'); const item=storedCases.find(value=>value.slug===slug)??getCase(slug); if(!item) notFound(); const storedProducts=await getContentItems<Product>('product'); const product=storedProducts.find(value=>value.slug===item.productSlug)??getProduct(item.productSlug);
  return <main className="detail-page">
    <div className="subnav"><a href="/cases">← 설치사례 목록</a><a href="/inquiry">견적 문의</a></div>
    <section className={item.image?'detail-hero has-image':'detail-hero'}><div><small><MapPin/> {item.place}</small><h1>{item.title}</h1><p>{item.summary}</p><span>{item.status}</span></div>{item.image&&<img src={item.image} alt={`${item.title} 설치 구성 예시`}/>}</section>
    {item.body&&<article className="editor-content" dangerouslySetInnerHTML={{__html:item.body}}/>}
    <section className="case-detail"><div><small>설치 목적</small><strong>{item.purpose}</strong></div><div><small>연결 제품</small><strong>{product?.name}</strong></div><div><small>상세 자료</small><strong>검토 후 업데이트</strong></div></section>
    {product&&<section className="related"><h2>이 구성에 사용되는 제품</h2><div><a href={`/products/${product.slug}`}><span>{product.category}</span><b>{product.name}</b><ArrowRight/></a></div></section>}
  </main>
}
