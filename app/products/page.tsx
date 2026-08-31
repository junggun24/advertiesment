'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { products } from '@/lib/catalog';

export default function ProductsPage(){
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('전체');
  const filtered=useMemo(()=>products.filter(p=>(category==='전체'||p.category===category)&&[p.name,p.summary,...p.uses].join(' ').includes(query)),[query,category]);
  return <main className="catalog-page">
    <div className="subnav"><a href="/">← OIC KOREA</a><a href="/cases">설치사례 보기</a></div>
    <section className="catalog-hero"><p className="eyebrow"><i/>PRODUCTS</p><h1>설치 목적에 맞는<br/>제품을 찾아보세요.</h1><p>제품명이나 사용 목적을 검색하면 관련 제품을 바로 확인할 수 있습니다.</p></section>
    <section className="catalog-tools">
      <label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="제품명 또는 사용 목적 검색"/></label>
      <div>{['전체','전광판','영상정보디스플레이장치'].map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div>
    </section>
    <section className="catalog-list">{filtered.map((p,i)=><article key={p.slug}><small>0{i+1} · {p.category}</small><h2>{p.name}</h2><p>{p.summary}</p><div>{p.uses.map(v=><span key={v}>{v}</span>)}</div><a href={`/products/${p.slug}`}>상세 정보 <ArrowRight/></a></article>)}</section>
    {!filtered.length&&<p className="empty">검색 결과가 없습니다. 다른 검색어를 입력해 주세요.</p>}
  </main>
}
