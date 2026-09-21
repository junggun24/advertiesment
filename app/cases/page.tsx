'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { cases } from '@/lib/catalog';
import { useContent } from '@/lib/use-content';

const filters=[{label:'전체',terms:[]},{label:'홍보·안내',terms:['홍보','행사','안내']},{label:'시민·현장 안전',terms:['안전','재난','기상']},{label:'교육·문화기관',terms:['교육','학교','문화']}];

export default function CasesPage(){
  const caseItems=useContent('case',cases);
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('전체');
  const selected=filters.find(v=>v.label===filter)??filters[0];
  const filtered=useMemo(()=>caseItems.filter(c=>{const hay=[c.title,c.place,c.purpose,c.summary].join(' ');return hay.includes(query)&&(!selected.terms.length||selected.terms.some(t=>hay.includes(t)));}),[query,caseItems,selected]);
  return <main className="catalog-page">
    <div className="subnav"><a href="/">← OIC KOREA</a><a href="/products">제품 보기</a></div>
    <section className="catalog-hero"><p className="eyebrow"><i/>CASES</p><h1>비슷한 공간의<br/>설치 구성을 확인하세요.</h1><p>설치 목적을 먼저 고르면 비슷한 표현으로 등록된 사례도 한 번에 확인할 수 있습니다.</p></section>
    <section className="case-browser"><aside><strong>설치 목적</strong><p>찾으려는 용도와 가까운 항목을 선택하세요.</p>{filters.map(v=><button key={v.label} className={filter===v.label?'active':''} onClick={()=>setFilter(v.label)}><span aria-hidden="true">{filter===v.label?'☑':'□'}</span>{v.label}</button>)}</aside><div className="case-results"><label className="case-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="장소 또는 설치 목적 검색"/></label><section className="catalog-list case-list">{filtered.map((c,i)=><article key={c.slug}><a className="catalog-image-link" href={`/cases/${c.slug}`} aria-label={`${c.title} 구성 보기`}><img className="catalog-image" src={c.image} alt={`${c.title} 설치 구성 예시`}/><span>이미지 클릭하여 사례보기</span></a><small>CASE 0{i+1}</small><h2>{c.title}</h2><p><MapPin/> {c.place} · {c.purpose}</p><span>{c.status}</span><a href={`/cases/${c.slug}`}>구성 보기 <ArrowRight/></a></article>)}</section>{!filtered.length&&<p className="empty">선택한 분류의 사례가 없습니다. 다른 분류를 확인해 주세요.</p>}</div></section>
  </main>
}
