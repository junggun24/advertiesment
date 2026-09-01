import { ArrowRight, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getCase, getProduct } from '@/lib/catalog';
import type { Metadata } from 'next';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const c=getCase(slug);return c?{title:c.title,description:c.summary,alternates:{canonical:`/cases/${slug}`},openGraph:{images:[{url:c.image}]}}:{title:'사례를 찾을 수 없습니다.'}}

export default async function CaseDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const item=getCase(slug); if(!item) notFound(); const product=getProduct(item.productSlug);
  return <main className="detail-page">
    <div className="subnav"><a href="/cases">← 설치사례 목록</a><a href="/#inquiry">견적 문의</a></div>
    <section className="detail-hero has-image"><div><small><MapPin/> {item.place}</small><h1>{item.title}</h1><p>{item.summary}</p><span>{item.status}</span></div><img src={item.image} alt={`${item.title} 설치 구성 예시`}/></section>
    <section className="case-detail"><div><small>설치 목적</small><strong>{item.purpose}</strong></div><div><small>연결 제품</small><strong>{product?.name}</strong></div><div><small>상세 자료</small><strong>검토 후 업데이트</strong></div></section>
    {product&&<section className="related"><h2>이 구성에 사용되는 제품</h2><div><a href={`/products/${product.slug}`}><span>{product.category}</span><b>{product.name}</b><ArrowRight/></a></div></section>}
  </main>
}
