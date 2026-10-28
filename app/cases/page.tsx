import { cases } from '@/lib/catalog';
import {
  CaseCatalog,
  type CaseCatalogItem,
} from '@/components/case-catalog';
import { getContentItems, mergeBySlug } from '@/lib/content-data';
import type { CaseStudy } from '@/lib/catalog';
import Link from 'next/link';

export default async function CasesPage() {
  const caseItems = mergeBySlug(
    cases,
    await getContentItems<CaseStudy>('case'),
  );
  const catalogItems: CaseCatalogItem[] = caseItems.map((item) => ({
    slug: item.slug,
    title: item.title,
    place: item.place,
    purpose: item.purpose,
    summary: item.summary,
    image: item.image,
    region: item.region,
    clientType: item.clientType,
    modelName: item.modelName,
    clientAddress: item.clientAddress,
    displayRows: item.displayRows,
    displayColumns: item.displayColumns,
  }));
  return (
    <main className="catalog-page">
      <div className="subnav">
        <Link href="/">← OIC KOREA</Link>
        <Link href="/products">제품 보기</Link>
      </div>
      <section className="catalog-hero">
        <p className="eyebrow">
          <i />
          CASES
        </p>
        <h1>
          비슷한 공간의
          <br />
          설치 구성을 확인하세요.
        </h1>
        <p>
          설치 목적을 먼저 고르면 비슷한 표현으로 등록된 사례도 한 번에 확인할
          수 있습니다.
        </p>
      </section>
      <CaseCatalog items={catalogItems} />
    </main>
  );
}
