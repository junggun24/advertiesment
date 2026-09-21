'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/catalog';

export function ProductCatalog({items}:{items:Product[]}){
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('전체');
  const categories=['전체',...Array.from(new Set(items.map(item=>item.category)))];
  const filtered=useMemo(()=>items.filter(product=>(category==='전체'||product.category===category)&&[product.name,product.summary,...(product.uses??[])].join(' ').includes(query)),[query,category,items]);
  return <>
    <section className="catalog-tools">
      <label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="제품명 또는 사용 목적 검색"/></label>
      <div>{categories.map(value=><button className={category===value?'active':''} onClick={()=>setCategory(value)} key={value}>{value}</button>)}</div>
    </section>
    <section className="catalog-list product-grid">{filtered.map((product,index)=><article key={product.slug}><Link className="catalog-image-link" href={`/products/${product.slug}`} aria-label={`${product.name} 상세 정보 보기`}>{product.image&&<Image unoptimized className="catalog-image" src={product.image} alt={`${product.name} 제품 이미지`} width={1200} height={800}/>}<span>이미지 클릭하여 상세보기</span></Link><small>0{index+1} · {product.category}</small><h2>{product.name}</h2><p>{product.summary}</p><div>{(product.uses??[]).map(value=><span key={value}>{value}</span>)}</div><Link href={`/products/${product.slug}`}>상세 정보 <ArrowRight/></Link></article>)}</section>
    {!filtered.length&&<p className="empty">검색 결과가 없습니다. 다른 검색어를 입력해 주세요.</p>}
  </>;
}
