'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { cases } from '@/lib/catalog';

export default function CasesPage(){
  const [query,setQuery]=useState('');
  const filtered=useMemo(()=>cases.filter(c=>[c.title,c.place,c.purpose,c.summary].join(' ').includes(query)),[query]);
  return <main className="catalog-page">
    <div className="subnav"><a href="/">← OIC KOREA</a><a href="/products">제품 보기</a></div>
    <section className="catalog-hero"><p className="eyebrow"><i/>CASES</p><h1>비슷한 공간의<br/>설치 구성을 확인하세요.</h1><p>실제 사례 자료가 확정되는 대로 사진과 기관 정보를 순차 공개합니다.</p></section>
    <section className="catalog-tools single"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="장소 또는 설치 목적 검색"/></label></section>
    <section className="catalog-list case-list">{filtered.map((c,i)=><article key={c.slug}><img className="catalog-image" src={c.image} alt={`${c.title} 설치 구성 예시`}/><small>CASE 0{i+1}</small><h2>{c.title}</h2><p><MapPin/> {c.place} · {c.purpose}</p><span>{c.status}</span><a href={`/cases/${c.slug}`}>구성 보기 <ArrowRight/></a></article>)}</section>
  </main>
}
