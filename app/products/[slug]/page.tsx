import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { cases, getProduct } from '@/lib/catalog';

export default async function ProductDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const product=getProduct(slug); if(!product) notFound();
  const related=cases.filter(c=>c.productSlug===slug);
  return <main className="detail-page">
    <div className="subnav"><a href="/products">← 제품 목록</a><a href="/#inquiry">견적 문의</a></div>
    <section className="detail-hero"><small>{product.category}</small><h1>{product.name}</h1><p>{product.summary}</p><span>{product.status}</span></section>
    <section className="detail-grid"><article><h2>주요 특징</h2>{product.features.map(v=><p key={v}><CheckCircle2/>{v}</p>)}</article><article><h2>주요 사용처</h2>{product.uses.map(v=><p key={v}><CheckCircle2/>{v}</p>)}</article><article><h2>가격 안내</h2><strong>{product.price}</strong><p>설치 환경과 규격 확인 후 정확한 범위를 안내합니다.</p></article></section>
    <section className="related"><h2>관련 설치 구성</h2>{related.length?<div>{related.map(c=><a key={c.slug} href={`/cases/${c.slug}`}><span>{c.place}</span><b>{c.title}</b><ArrowRight/></a>)}</div>:<p>관련 설치사례를 준비 중입니다.</p>}</section>
  </main>
}
