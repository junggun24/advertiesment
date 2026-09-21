'use client';

import { usePathname } from 'next/navigation';
import { FileText, Menu, Phone, X } from 'lucide-react';
import { useState } from 'react';
import { InquiryForm } from './inquiry-form';
import { useContent } from '@/lib/use-content';
import { defaultSiteSettings, type SiteSettings } from '@/lib/content-types';

export function SiteHeader(){
  const pathname=usePathname(); const [menu,setMenu]=useState(false); const [quote,setQuote]=useState(false); const [phone,setPhone]=useState(false);
  const site=useContent<SiteSettings>('site',[defaultSiteSettings])[0]??defaultSiteSettings;
  if(pathname.startsWith('/admin')) return null;
  return <><header className="site-header"><a className="logo" href="/"><img src="/oic/logo.png" alt="OIC KOREA"/></a><nav className={menu?'open':''}><a href="/about">회사소개</a><a href="/business">업무분야</a><a href="/products">제품소개</a><a href="/cases">설치사례</a><a href="/info">디스플레이 정보</a><button className="nav-cta" onClick={()=>setQuote(true)}>제품 · 견적 문의</button></nav><button className="menu" onClick={()=>setMenu(!menu)} aria-label="메뉴 열기">{menu?<X/>:<Menu/>}</button>{phone&&<div className="phone-card"><small>영업팀 · 과장</small><strong>{site.consultantName}</strong><a href={`tel:${site.phone.replaceAll('-','')}`}>{site.phone}</a><span>평일 09:00–18:00</span><button onClick={()=>setPhone(false)}>닫기</button></div>}</header><div className="floating-contact"><button onClick={()=>setPhone(true)} aria-label="전화 상담"><Phone/></button><button onClick={()=>setQuote(true)} aria-label="견적 문의"><FileText/></button></div>{quote&&<div className="quote-drawer" role="dialog" aria-modal="true" aria-label="제품 견적 문의"><button className="drawer-backdrop" onClick={()=>setQuote(false)} aria-label="닫기"/><section><div className="drawer-intro"><p className="eyebrow">QUICK INQUIRY</p><h2>제품명을 몰라도<br/>문의할 수 있습니다.</h2><p>장소와 목적을 알려주시면 {site.consultantName}이 필요한 제품과 확인 항목을 정리합니다.</p><a href="/inquiry">상세 견적문의 페이지 보기 →</a></div><InquiryForm compact/><button className="drawer-close" onClick={()=>setQuote(false)} aria-label="문의창 닫기"><X/></button></section></div>}</>;
}
