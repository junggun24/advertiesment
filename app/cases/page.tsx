import { cases } from '@/lib/catalog';
import { CaseCatalog } from '@/components/case-catalog';
import { getContentItems, mergeBySlug } from '@/lib/content-data';
import type { CaseStudy } from '@/lib/catalog';

export default async function CasesPage(){
  const caseItems=mergeBySlug(cases,await getContentItems<CaseStudy>('case'));
  return <main className="catalog-page">
    <div className="subnav"><a href="/">← OIC KOREA</a><a href="/products">제품 보기</a></div>
    <section className="catalog-hero"><p className="eyebrow"><i/>CASES</p><h1>비슷한 공간의<br/>설치 구성을 확인하세요.</h1><p>설치 목적을 먼저 고르면 비슷한 표현으로 등록된 사례도 한 번에 확인할 수 있습니다.</p></section>
    <CaseCatalog items={caseItems}/>
  </main>
}
