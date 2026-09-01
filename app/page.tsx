'use client';

import { ArrowRight, Check, Phone, Search } from 'lucide-react';
import { cases, products } from '@/lib/catalog';
import { InquiryForm } from '@/components/inquiry-form';

const answers = [
  ['안내전광판 가격은 어떻게 정해지나요?','화면 크기, 실내·실외 여부, 밝기, 제어 방식과 설치 조건을 함께 확인해 결정합니다.'],
  ['제품명과 규격을 몰라도 문의할 수 있나요?','네. 설치 장소, 사용 목적, 대략적인 크기와 예산만 알려주시면 필요한 규격부터 함께 정리합니다.'],
  ['현장 확인에서는 무엇을 보나요?','벽면 크기와 재질, 전원·통신 위치, 시청 거리, 장비 반입 동선과 작업 가능 시간을 확인합니다.'],
];

export default function Home() {
  return <main>
    <section className="hero" id="top">
      <div className="hero-copy"><div className="badges"><span>자체 연구소 · 제조시설 보유</span><span>인천 본사 · 전국 설치 상담</span></div><p className="eyebrow">PUBLIC DISPLAY SOLUTION</p><h1>모든 디스플레이,<br/><em>커스텀 주문 제작</em>이<br/>가능합니다.</h1><p className="lead">공공기관 안내전광판부터 멀티비전, 옥외용 키오스크까지. 설치 목적과 공간에 맞춰 기획·제작·설치를 한 번에 진행합니다.</p><div className="actions"><a className="primary" href="#inquiry">설치 상담 시작하기 <ArrowRight/></a><a href="/products">제품 살펴보기</a></div></div>
      <div className="hero-visual"><img src="/oic/prod-notice.jpg" alt="오아이씨코리아 안내전광판 제품 예시"/><div className="visual-caption"><small>OIC DISPLAY SOLUTION</small><b>공간과 목적에 맞춘 디스플레이</b><span>제품 이미지는 제공된 기획 시안을 기준으로 구성했습니다.</span></div></div>
    </section>

    <section className="proof"><div><strong>기획</strong><span>목적과 예산부터 정리</span></div><div><strong>설계</strong><span>공간에 맞는 규격 제안</span></div><div><strong>제작</strong><span>맞춤 구성과 품질 확인</span></div><div><strong>A–Z</strong><span>설치와 운영 안내까지</span></div></section>

    <section className="section product-section"><div className="section-head"><div><p className="eyebrow">PRODUCTS</p><h2>설치 목적에 맞는<br/>제품을 선택하세요.</h2></div><p>첨부 기획안의 제품 구성을 실제 탐색 흐름으로 옮겼습니다. 최종 규격과 조달 식별번호는 상담 시 확인합니다.</p></div><div className="product-cards">{products.map(p=><article key={p.slug}><a className="card-image" href={`/products/${p.slug}`}><img src={p.image} alt={`${p.name} 제품 이미지`}/></a><div><small>{p.category}</small><h3>{p.name}</h3><p>{p.summary}</p><strong>{p.price}</strong><span>{p.status}</span><a className="text-link" href={`/products/${p.slug}`}>상세 정보 <ArrowRight/></a></div></article>)}</div></section>

    <section className="solution"><div><p className="eyebrow light">PUBLIC PROCUREMENT SUPPORT</p><h2>예산 검토에서<br/>현장 인수까지.</h2><p>구매 담당자가 놓치기 쉬운 규격, 설치 범위, 전기·통신 조건과 납기를 순서대로 확인해 실제 집행 가능한 견적을 만듭니다.</p></div><ul><li><Check/> 설치 장소와 표시 콘텐츠 확인</li><li><Check/> 조달 등록 여부와 구성 범위 검토</li><li><Check/> 구조물·배선·반입 동선 현장 확인</li><li><Check/> 납품·검수·운영 방법 안내</li></ul></section>

    <section className="section"><div className="section-head"><div><p className="eyebrow">INSTALLATION CASES</p><h2>공간별 설치 구성을<br/>사진으로 확인하세요.</h2></div><a className="text-link" href="/cases">전체 사례 보기 <ArrowRight/></a></div><div className="case-cards">{cases.map(c=><a href={`/cases/${c.slug}`} key={c.slug}><img src={c.image} alt={`${c.title} 설치 구성 예시`}/><span>{c.place} · {c.purpose}</span><h3>{c.title}</h3><p>{c.summary}</p></a>)}</div><p className="data-note">※ 첨부 시안에 익명·임시값으로 표시된 사례입니다. 기관명과 상세 실적은 확인 후 공개합니다.</p></section>

    <section className="section knowledge"><div className="section-head"><div><p className="eyebrow">DISPLAY ANSWERS</p><h2>구매 담당자가 궁금한 내용을<br/>먼저 답합니다.</h2></div><a className="search-link" href="/info"><Search/> 디스플레이 정보 검색</a></div><div className="answer-grid">{answers.map(([q,a],i)=><article key={q}><small>Q{i+1}</small><h3>{q}</h3><p>{a}</p></article>)}</div><a className="primary inline-cta" href="/info">가격·설치·A/S 답변 더 보기 <ArrowRight/></a></section>

    <section className="process"><div><p className="eyebrow light">PROJECT FLOW</p><h2>결정해야 할 일을<br/>순서대로 줄입니다.</h2><p>각 단계의 산출물을 분명히 해 담당자가 예산과 일정을 내부에서 설명하기 쉽도록 돕습니다.</p></div><ol>{[['요구사항 정리','표시할 정보, 사용자와 설치 장소를 한 장으로 정리합니다.'],['구성·견적 제안','제품 규격과 포함·제외 범위를 비교할 수 있게 제시합니다.'],['현장 확정','전기·통신·마감과 작업 일정을 확정합니다.'],['납품·인수','검수, 사용 교육과 유지보수 창구를 안내합니다.']].map((v,i)=><li key={v[0]}><b>0{i+1}</b><div><h3>{v[0]}</h3><p>{v[1]}</p></div></li>)}</ol></section>

    <section className="inquiry" id="inquiry"><div><p className="eyebrow light">PROJECT INQUIRY</p><h2>현장 조건을 남기면<br/>검토가 시작됩니다.</h2><p>담당자 신재훈 과장이 요청 내용을 확인하고, 추가로 필요한 사진이나 치수를 안내합니다.</p><button className="phone phone-copy" type="button"><Phone/>032-719-7947</button><a className="profile-link" href="/people/shin-jaehoon">상담 담당자 소개 보기 →</a></div><InquiryForm/></section>

    <footer><img src="/oic/logo.png" alt="오아이씨코리아"/><div><b>주식회사 오아이씨코리아</b><p>인천광역시 부평구 안남로 369번길 12, 5층 · 032-719-7947 · sales@oickorea.com</p></div><small>© OIC KOREA</small></footer>
  </main>;
}
