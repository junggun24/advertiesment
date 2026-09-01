import type { Metadata } from 'next';
import { ArrowRight, Search } from 'lucide-react';

export const metadata: Metadata = { title:'디스플레이 정보', description:'안내전광판, 멀티비전, 옥외용 키오스크의 가격·설치·구매·A/S 질문에 쉽게 답합니다.', alternates:{canonical:'/info'} };

const articles = [
  {tag:'가격·견적',q:'안내전광판 가격은 어떻게 결정되나요?',a:'화면 크기, 실내·실외 여부, 필요한 밝기, 제어 방식, 구조물과 배선 등 설치 조건을 함께 확인해 결정합니다. 같은 크기라도 현장 조건에 따라 총액이 달라질 수 있습니다.'},
  {tag:'제품 선택',q:'멀티비전과 안내전광판 중 무엇을 선택해야 하나요?',a:'영상과 여러 화면을 고해상도로 보여주는 실내 공간은 멀티비전이 알맞고, 안내문·안전정보를 멀리 전달하거나 옥외에 설치한다면 안내전광판을 먼저 검토합니다.'},
  {tag:'나라장터 구매',q:'나라장터 제품은 무엇을 먼저 확인해야 하나요?',a:'제품명만 보지 말고 규격, 구성품, 등록 가격에 설치비가 포함됐는지, 납품 가능 지역과 기간을 확인해야 합니다. 식별번호는 최종 견적 전에 담당자에게 재확인하세요.'},
  {tag:'설치·시공',q:'현장 실사에서는 어떤 항목을 확인하나요?',a:'벽면 크기와 재질, 전원·통신 위치, 시청 거리와 햇빛 방향, 장비 반입 동선, 작업 가능 시간, 안전 설비 필요 여부를 확인합니다.'},
  {tag:'설치·시공',q:'문의 전에 어떤 자료를 준비하면 좋나요?',a:'설치 위치 사진, 벽면의 대략적인 가로·세로 길이, 표시할 콘텐츠, 희망 일정과 예산 범위를 준비하면 제품 제안이 빨라집니다.'},
  {tag:'유지보수·A/S',q:'설치 후 A/S는 어떻게 진행되나요?',a:'증상을 확인한 뒤 원격 점검 가능 여부와 현장 방문 필요 여부를 구분합니다. 부품 교체가 필요한 경우 대상 부품과 일정을 안내한 뒤 작업합니다.'},
];

export default async function InfoPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=''}=await searchParams; const query=q.trim(); const filtered=query?articles.filter(v=>`${v.tag} ${v.q} ${v.a}`.includes(query)):articles;
  const schema={'@context':'https://schema.org','@type':'FAQPage',mainEntity:articles.map(v=>({'@type':'Question',name:v.q,acceptedAnswer:{'@type':'Answer',text:v.a}}))};
  return <main className="catalog-page info-page"><div className="subnav"><a href="/">← OIC KOREA</a><a href="/#inquiry">제품·견적 문의</a></div><section className="catalog-hero"><p className="eyebrow light">DISPLAY INFORMATION</p><h1>디스플레이 정보</h1><p>구매 담당자가 실제로 궁금해하는 질문에 쉬운 말로 먼저 답합니다.</p><form action="/info"><label><Search/><input name="q" defaultValue={query} placeholder="가격, 나라장터, 설치, A/S 검색"/><button>검색</button></label></form><div className="chips"><a href="/info">전체</a>{['가격·견적','나라장터 구매','설치·시공','유지보수·A/S'].map(v=><a key={v} href={`/info?q=${encodeURIComponent(v)}`}>{v}</a>)}</div></section><section className="info-list">{filtered.map((v,i)=><article key={v.q}><div><small>{v.tag}</small><span>답변 {String(i+1).padStart(2,'0')}</span></div><h2>{v.q}</h2><p><b>답변.</b> {v.a}</p><a href="/#inquiry">이 조건으로 상담하기 <ArrowRight/></a></article>)}{!filtered.length&&<p className="empty">검색 결과가 없습니다. 다른 단어로 검색해 주세요.</p>}</section><section className="info-cta"><h2>글로 해결되지 않는 질문은,<br/>견적과 함께 답해 드립니다.</h2><a href="/#inquiry">제품·견적 문의 <ArrowRight/></a></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /></main>;
}
