'use client';

import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Menu, Phone, Search, X } from 'lucide-react';
import { cases, products } from '@/lib/catalog';

const answers = [
  ['안내전광판 가격은 어떻게 정해지나요?','화면 크기, 실내·실외 여부, 밝기, 제어 방식과 설치 조건을 함께 확인해 결정합니다.'],
  ['제품명과 규격을 몰라도 문의할 수 있나요?','네. 설치 장소, 사용 목적, 대략적인 크기와 예산만 알려주시면 필요한 규격부터 함께 정리합니다.'],
  ['현장 확인에서는 무엇을 보나요?','벽면 크기와 재질, 전원·통신 위치, 시청 거리, 장비 반입 동선과 작업 가능 시간을 확인합니다.'],
];

export default function Home() {
  const [menu,setMenu]=useState(false); const [sent,setSent]=useState(false); const [sending,setSending]=useState(false); const [error,setError]=useState('');
  return <main>
    <header className="site-header">
      <a className="logo" href="#top"><img src="/oic/logo.png" alt="오아이씨코리아"/></a>
      <nav className={menu?'open':''}><a href="#about">회사소개</a><a href="/products">제품소개</a><a href="/cases">설치사례</a><a href="/info">디스플레이 정보</a><a className="nav-cta" href="#inquiry">제품·견적 문의</a></nav>
      <button className="menu" onClick={()=>setMenu(!menu)} aria-label="메뉴 열기">{menu?<X/>:<Menu/>}</button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><div className="badges"><span>자체 연구소 · 제조시설 보유</span><span>인천 본사 · 전국 설치 상담</span></div><p className="eyebrow">PUBLIC DISPLAY SOLUTION</p><h1>모든 디스플레이,<br/><em>커스텀 주문 제작</em>이<br/>가능합니다.</h1><p className="lead">공공기관 안내전광판부터 멀티비전, 옥외용 키오스크까지. 설치 목적과 공간에 맞춰 기획·제작·설치를 한 번에 진행합니다.</p><div className="actions"><a className="primary" href="#inquiry">설치 상담 시작하기 <ArrowRight/></a><a href="/products">제품 살펴보기</a></div></div>
      <div className="hero-visual"><img src="/oic/prod-notice.jpg" alt="오아이씨코리아 안내전광판 제품 예시"/><div className="visual-caption"><small>OIC DISPLAY SOLUTION</small><b>공간과 목적에 맞춘 디스플레이</b><span>제품 이미지는 제공된 기획 시안을 기준으로 구성했습니다.</span></div></div>
    </section>

    <section className="proof" id="about"><div><strong>기획</strong><span>목적과 예산부터 정리</span></div><div><strong>설계</strong><span>공간에 맞는 규격 제안</span></div><div><strong>제작</strong><span>맞춤 구성과 품질 확인</span></div><div><strong>A–Z</strong><span>설치와 운영 안내까지</span></div></section>

    <section className="section product-section"><div className="section-head"><div><p className="eyebrow">PRODUCTS</p><h2>설치 목적에 맞는<br/>제품을 선택하세요.</h2></div><p>첨부 기획안의 제품 구성을 실제 탐색 흐름으로 옮겼습니다. 최종 규격과 조달 식별번호는 상담 시 확인합니다.</p></div><div className="product-cards">{products.map(p=><article key={p.slug}><a className="card-image" href={`/products/${p.slug}`}><img src={p.image} alt={`${p.name} 제품 이미지`}/></a><div><small>{p.category}</small><h3>{p.name}</h3><p>{p.summary}</p><strong>{p.price}</strong><span>{p.status}</span><a className="text-link" href={`/products/${p.slug}`}>상세 정보 <ArrowRight/></a></div></article>)}</div></section>

    <section className="solution"><div><p className="eyebrow light">ONE-STOP SOLUTION</p><h2>나라장터 제품 검토부터<br/>현장 설치까지 한 번에.</h2><p>정확한 제품명을 몰라도 괜찮습니다. 구매 목적과 공간 조건을 기준으로 필요한 내용을 담당자 눈높이에서 정리합니다.</p></div><ul><li><Check/> 설치 장소와 사용 목적 확인</li><li><Check/> 제품·규격·예산 범위 제안</li><li><Check/> 현장 실사와 상세 설계</li><li><Check/> 제작·설치·운영 안내</li></ul></section>

    <section className="section"><div className="section-head"><div><p className="eyebrow">INSTALLATION CASES</p><h2>공간별 설치 구성을<br/>사진으로 확인하세요.</h2></div><a className="text-link" href="/cases">전체 사례 보기 <ArrowRight/></a></div><div className="case-cards">{cases.map(c=><a href={`/cases/${c.slug}`} key={c.slug}><img src={c.image} alt={`${c.title} 설치 구성 예시`}/><span>{c.place} · {c.purpose}</span><h3>{c.title}</h3><p>{c.summary}</p></a>)}</div><p className="data-note">※ 첨부 시안에 익명·임시값으로 표시된 사례입니다. 기관명과 상세 실적은 확인 후 공개합니다.</p></section>

    <section className="section knowledge"><div className="section-head"><div><p className="eyebrow">DISPLAY ANSWERS</p><h2>구매 담당자가 궁금한 내용을<br/>먼저 답합니다.</h2></div><a className="search-link" href="/info"><Search/> 디스플레이 정보 검색</a></div><div className="answer-grid">{answers.map(([q,a],i)=><article key={q}><small>Q{i+1}</small><h3>{q}</h3><p>{a}</p></article>)}</div><a className="primary inline-cta" href="/info">가격·설치·A/S 답변 더 보기 <ArrowRight/></a></section>

    <section className="process"><div><p className="eyebrow light">HOW WE WORK</p><h2>네 단계로 명확하게<br/>진행합니다.</h2><p>문의부터 설치 완료까지 현재 단계를 확인할 수 있도록 안내합니다.</p></div><ol>{[['요청 확인','장소·목적·예산을 확인합니다.'],['제품 제안','조건에 맞는 제품과 규격을 제안합니다.'],['현장 설계','벽면·전원·시야와 작업 조건을 확인합니다.'],['제작·설치','제작, 설치와 운영 안내를 마무리합니다.']].map((v,i)=><li key={v[0]}><b>0{i+1}</b><div><h3>{v[0]}</h3><p>{v[1]}</p></div></li>)}</ol></section>

    <section className="inquiry" id="inquiry"><div><p className="eyebrow light">PROJECT INQUIRY</p><h2>설치할 공간이 있다면,<br/>지금 이야기해 주세요.</h2><p>설치 장소, 사용 목적, 대략적인 크기와 예산을 남겨주시면 담당자가 필요한 항목을 함께 정리합니다.</p><a className="phone" href="tel:0327197947"><Phone/>032-719-7947</a></div><form onSubmit={async e=>{e.preventDefault();setSending(true);setError('');const form=new FormData(e.currentTarget);try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(form))});const data=await response.json() as {message?:string};if(!response.ok)throw new Error(data.message||'문의 접수에 실패했습니다.');setSent(true)}catch(err){setError(err instanceof Error?err.message:'문의 접수에 실패했습니다.')}finally{setSending(false)}}}>{sent?<div className="success"><CheckCircle2/><h3>문의가 접수되었습니다.</h3><p>담당자가 내용을 확인한 뒤 연락드립니다.</p><button type="button" onClick={()=>setSent(false)}>다시 작성</button></div>:<><div className="row"><label>이름<input name="name" required maxLength={40} placeholder="담당자 성함"/></label><label>기관·회사명<input name="organization" required maxLength={100} placeholder="기관 또는 회사명"/></label></div><label>연락처<input name="contact" required maxLength={40} type="tel" placeholder="010-0000-0000"/></label><label>문의 내용<textarea name="message" required maxLength={2000} rows={4} placeholder="설치 장소와 사용 목적을 간단히 적어주세요."/></label><label className="consent"><input required type="checkbox"/> 개인정보 수집 및 이용에 동의합니다.</label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="submit" disabled={sending}>{sending?'접수 중...':'견적 문의 보내기'} <ArrowRight/></button></>}</form></section>

    <footer><img src="/oic/logo.png" alt="오아이씨코리아"/><div><b>주식회사 오아이씨코리아</b><p>인천광역시 부평구 안남로 369번길 12, 5층 · 032-719-7947 · sales@oickorea.com</p></div><small>© OIC KOREA</small></footer>
    <div className="floating"><a href="tel:0327197947" aria-label="전화 상담"><Phone/></a><a href="#inquiry">견적 문의</a></div>
  </main>;
}
