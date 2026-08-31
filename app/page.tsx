'use client';

import { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, ClipboardCheck, MapPin, Menu, Monitor, ShieldCheck, Sparkles, X } from 'lucide-react';

const products = [
  ['안내전광판', '행정 안내와 재난·기상 정보를 멀리서도 선명하게 전달합니다.', '옥외 설치 · 맞춤 크기 · 원격 운영'],
  ['멀티비전', '상황실과 홍보관에 필요한 대형 화면을 공간에 맞춰 설계합니다.', '고해상도 · 다중 화면 · 통합 제어'],
  ['옥외용 키오스크', '햇빛과 비바람 속에서도 안정적으로 정보를 제공하는 독립형 장치입니다.', '고휘도 · 방수방진 · 터치 선택'],
];

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  return <main>
    <header>
      <a className="brand" href="#top"><b>OIC</b><span>KOREA</span></a>
      <nav className={menu ? 'open' : ''}>
        <a href="#products">제품</a><a href="#cases">설치사례</a><a href="#process">진행과정</a><a className="nav-cta" href="#inquiry">견적 문의</a>
      </nav>
      <button className="menu" onClick={() => setMenu(!menu)} aria-label="메뉴">{menu ? <X/> : <Menu/>}</button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><i/>PUBLIC DISPLAY SOLUTION</p>
        <h1>공공의 과제를 이해하고,<br/><em>디스플레이로 답합니다.</em></h1>
        <p className="lead">설치 환경과 목적을 먼저 듣고, 공공기관에 필요한 안내전광판·멀티비전·옥외용 키오스크를 맞춤 제작합니다.</p>
        <div className="actions"><a className="primary" href="#inquiry">견적 문의하기 <ArrowRight/></a><a href="#products">제품 살펴보기</a></div>
        <div className="points"><span><CheckCircle2/>공간 맞춤 설계</span><span><CheckCircle2/>조달 가격 기준 안내</span><span><CheckCircle2/>설치·운영 지원</span></div>
      </div>
      <div className="hero-img">
        <img src="/oic-outdoor-kiosk.jpg" alt="공공시설에 설치된 오아이씨코리아 옥외용 키오스크"/>
        <div><small>FEATURED SOLUTION</small><strong>옥외용 키오스크</strong><span>고휘도 · 방수방진 · 맞춤 설계</span></div>
      </div>
    </section>

    <section className="trust">
      <div><ShieldCheck/><span><b>공공조달</b> 기준에 맞춘 제품 안내</span></div>
      <div><ClipboardCheck/><span><b>기획부터 설치까지</b> 한 번에 진행</span></div>
      <div><Sparkles/><span><b>모든 디스플레이</b> 커스텀 주문 제작</span></div>
    </section>

    <section className="section" id="products">
      <div className="heading"><div><p className="eyebrow"><i/>PRODUCT LINEUP</p><h2>목적에 맞는<br/>디스플레이를 찾으세요.</h2></div><p>설치 장소와 사용 목적을 알려주시면 담당자가 알맞은 제품과 예상 범위를 안내합니다.</p></div>
      <div className="products">{products.map((p,i)=><article key={p[0]}><Monitor/><small>0{i+1}</small><h3>{p[0]}</h3><p>{p[1]}</p><span>{p[2]}</span><a href="#inquiry">상담 요청 <ArrowRight/></a></article>)}</div>
    </section>

    <section className="process" id="process">
      <div><p className="eyebrow light"><i/>HOW WE WORK</p><h2>복잡한 설치 조건도<br/>네 단계면 충분합니다.</h2><p>전문 용어를 몰라도 괜찮습니다. 장소와 목적만 알려주시면 필요한 질문부터 정리해 드립니다.</p></div>
      <ol>{[['요청 확인','설치 장소, 목적, 예산을 확인합니다.'],['제품 제안','조건에 맞는 제품과 규격을 제안합니다.'],['현장 설계','벽면·전원·시야를 확인해 상세 설계를 확정합니다.'],['제작·설치','제작부터 설치와 운영 안내까지 마무리합니다.']].map((v,i)=><li key={v[0]}><b>0{i+1}</b><div><h3>{v[0]}</h3><p>{v[1]}</p></div></li>)}</ol>
    </section>

    <section className="section" id="cases">
      <div className="heading"><div><p className="eyebrow"><i/>INSTALLATION CASES</p><h2>공간이 달라도<br/>해답은 분명합니다.</h2></div></div>
      <div className="cases">{[['공공청사','시정 홍보 전자게시판'],['안전 현장','안전보건 안내전광판'],['문화시설','행사·시설 안내 멀티비전']].map((v,i)=><article key={v[0]}><div><Building2/><small>CASE 0{i+1}</small></div><p><MapPin/>{v[0]}</p><h3>{v[1]}</h3></article>)}</div>
      <p className="note">※ 실제 설치 사진과 상세 정보는 자료 정리 후 순차적으로 업데이트됩니다.</p>
    </section>

    <section className="inquiry" id="inquiry">
      <div><p className="eyebrow light"><i/>PROJECT INQUIRY</p><h2>설치할 공간이 있다면,<br/>지금 이야기해 주세요.</h2><p>정확한 제품명을 몰라도 됩니다. 담당자가 내용을 확인하고 필요한 정보를 함께 정리합니다.</p><aside><span>상담 시 준비하면 좋은 정보</span><b>설치 장소 · 사용 목적 · 대략적인 크기 · 예산</b></aside></div>
      <form onSubmit={e=>{e.preventDefault();setSent(true)}}>
        {sent ? <div className="success"><CheckCircle2/><h3>문의 내용이 준비되었습니다.</h3><p>실제 접수 연결은 다음 개발 단계에서 연동됩니다.</p><button type="button" onClick={()=>setSent(false)}>다시 작성</button></div> : <>
          <div className="row"><label>이름<input required placeholder="담당자 성함"/></label><label>기관·회사명<input required placeholder="기관 또는 회사명"/></label></div>
          <label>연락처<input required type="tel" placeholder="010-0000-0000"/></label>
          <label>문의 내용<textarea required rows={4} placeholder="설치 장소와 사용 목적을 간단히 적어주세요."/></label>
          <label className="consent"><input required type="checkbox"/> 개인정보 수집 및 이용에 동의합니다.</label>
          <button className="submit" type="submit">견적 문의 보내기 <ArrowRight/></button>
        </>}
      </form>
    </section>
    <footer><span className="brand"><b>OIC</b><span>KOREA</span></span><p>공공 환경을 위한 맞춤형 디스플레이 솔루션</p><small>© OIC KOREA</small></footer>
  </main>
}
