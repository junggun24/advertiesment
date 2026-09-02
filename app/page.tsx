'use client';

import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardCheck, Phone } from 'lucide-react';
import { products } from '@/lib/catalog';
import { InquiryForm } from '@/components/inquiry-form';
import './home.css';

const strengths=[
  {letter:'O',title:'요구사항 기획',text:'누가, 어디에서, 어떤 정보를 보는지 먼저 정리합니다.'},
  {letter:'I',title:'현장 맞춤 설계',text:'크기·밝기·배선·구조물을 공간 조건에 맞춥니다.'},
  {letter:'C',title:'제작·설치',text:'제품 제작부터 현장 인수와 운영 안내까지 연결합니다.'},
];

export default function Home(){
  const [slide,setSlide]=useState(0); const product=products[slide];
  const move=(direction:number)=>setSlide(current=>(current+direction+products.length)%products.length);
  return <main className="compact-home">
    <section className="compact-hero" id="top">
      <div className="hero-copy"><div className="badges"><span>자체 연구소 · 제조시설 보유</span><span>인천 본사 · 전국 설치 상담</span></div><p className="eyebrow">PUBLIC DISPLAY SOLUTION</p><h1>공공 디스플레이,<br/><em>현장에 맞춰</em><br/>제작합니다.</h1><p className="lead">안내전광판·멀티비전·옥외용 키오스크를 사용 목적과 설치 조건에 맞춰 기획하고 설치합니다.</p><div className="actions"><a className="primary" href="#inquiry">제품·견적 문의 <ArrowRight/></a><a href="/products">제품 비교하기</a></div></div>
      <div className="manual-showcase" aria-live="polite"><div className="showcase-image"><img src={product.image} alt={`${product.name} 제품 이미지`}/><button className="slide-prev" onClick={()=>move(-1)} aria-label="이전 제품"><ChevronLeft/></button><button className="slide-next" onClick={()=>move(1)} aria-label="다음 제품"><ChevronRight/></button><span>{slide+1} / {products.length}</span></div><div className="showcase-copy"><small>{product.category}</small><h2>{product.name}</h2><p>{product.summary}</p><a href={`/products/${product.slug}`}>제품 상세 보기 <ArrowRight/></a></div><div className="showcase-dots">{products.map((item,index)=><button key={item.slug} className={index===slide?'active':''} onClick={()=>setSlide(index)} aria-label={`${item.name} 보기`}/>)}</div></div>
    </section>

    <section className="oic-strengths" aria-label="오아이씨코리아의 업무 강점">{strengths.map((item,index)=><article className={`strength-${index+1}`} key={item.letter}><b>{item.letter}</b><div><h2>{item.title}</h2><p>{item.text}</p></div></article>)}</section>

    <section className="compact-middle"><div className="middle-heading"><p className="eyebrow">PROCUREMENT TO INSTALLATION</p><h2>구매 검토부터<br/>현장 인수까지.</h2><p>필요한 정보만 빠르게 확인하고, 상세 내용은 목적에 맞는 페이지에서 이어서 볼 수 있습니다.</p></div><div className="middle-links"><a href="/products"><span>제품을 비교하고 싶다면</span><strong>제품소개</strong><ArrowRight/></a><a href="/info"><span>가격·설치가 궁금하다면</span><strong>디스플레이 정보</strong><ArrowRight/></a><a href="/cases"><span>비슷한 현장을 찾는다면</span><strong>설치사례</strong><ArrowRight/></a></div><div className="middle-note"><ClipboardCheck/><p><b>제품명을 몰라도 괜찮습니다.</b><br/>설치 장소 사진, 표시할 내용, 희망 일정과 예산 범위가 있으면 더 빠르게 검토할 수 있습니다.</p></div></section>

    <section className="inquiry compact-inquiry" id="inquiry"><div><p className="eyebrow light">PROJECT INQUIRY</p><h2>현장 조건을 남기면<br/>검토가 시작됩니다.</h2><p>신재훈 과장이 내용을 확인하고 추가로 필요한 사진이나 치수를 안내합니다.</p><button className="phone phone-copy" type="button"><Phone/>032-719-7947</button><a className="profile-link" href="/people/shin-jaehoon">상담 담당자 소개 보기 →</a></div><InquiryForm compact/></section>

    <footer className="copyable-footer"><img src="/oic/logo.png" alt="오아이씨코리아"/><address><b>주식회사 오아이씨코리아</b><p>인천광역시 부평구 안남로 369번길 12, 5층</p><p>전화 032-719-7947 · 이메일 sales@oickorea.com</p></address><small>© OIC KOREA</small></footer>
  </main>;
}
