import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { cases, getProduct } from '@/lib/catalog';
import type { Metadata } from 'next';
import { getContentItems } from '@/lib/content-data';
import type { Product } from '@/lib/catalog';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const stored=await getContentItems<Product>('product');const p=stored.find(item=>item.slug===slug)??getProduct(slug);return p?{title:p.name,description:p.summary,alternates:{canonical:`/products/${slug}`},...(p.image?{openGraph:{images:[{url:p.image}]}}:{})}:{title:'제품을 찾을 수 없습니다.'}}

export default async function ProductDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const stored=await getContentItems<Product>('product'); const product=stored.find(item=>item.slug===slug)??getProduct(slug); if(!product) notFound();
  const storedCases=await getContentItems<(typeof cases)[number]>('case'); const related=(storedCases.length?storedCases:cases).filter(c=>c.productSlug===slug);
  return <main className="detail-page">
    <div className="subnav"><a href="/products">← 제품 목록</a><a href="/inquiry">견적 문의</a></div>
    <section className={product.image?'detail-hero has-image':'detail-hero'}><div><small>{product.category}</small><h1>{product.name}</h1><p>{product.summary}</p><span>{product.status}</span></div>{product.image&&<img src={product.image} alt={`${product.name} 제품 이미지`}/>}</section>
    {product.body&&<article className="editor-content" dangerouslySetInnerHTML={{__html:product.body}}/>}
    <section className="detail-grid"><article><h2>주요 특징</h2>{product.features.map(v=><p key={v}><CheckCircle2/>{v}</p>)}</article><article><h2>주요 사용처</h2>{product.uses.map(v=><p key={v}><CheckCircle2/>{v}</p>)}</article><article><h2>가격 안내</h2><strong>{product.price}</strong><p>설치 환경과 규격 확인 후 정확한 범위를 안내합니다.</p></article></section>
    <section className="related"><h2>관련 설치 구성</h2>{related.length?<div>{related.map(c=><a key={c.slug} href={`/cases/${c.slug}`}><span>{c.place}</span><b>{c.title}</b><ArrowRight/></a>)}</div>:<p>관련 설치사례를 준비 중입니다.</p>}</section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Product',name:product.name,image:product.image,description:product.summary,brand:{'@type':'Brand',name:'OIC KOREA'},category:product.category})}} />
  </main>
}
