import { products } from '@/lib/catalog';
import { ProductCatalog } from '@/components/product-catalog';
import { getContentItems, mergeBySlug } from '@/lib/content-data';
import type { Product } from '@/lib/catalog';
import Link from 'next/link';

export default async function ProductsPage() {
  const catalog = mergeBySlug(
    products,
    await getContentItems<Product>('product'),
  );
  return (
    <main className="catalog-page">
      <div className="subnav">
        <Link href="/">← OIC KOREA</Link>
        <Link href="/cases">설치사례 보기</Link>
      </div>
      <section className="catalog-hero">
        <p className="eyebrow">
          <i />
          PRODUCTS
        </p>
        <h1>
          설치 목적과 예산에 맞는
          <br />
          최적의 디스플레이 솔루션을 확인해 보세요.
        </h1>
        <p>
          설치 환경과 운영 목적을 고려하여 안내전광판, 멀티비전, 옥외용 키오스크
          등 적합한 제품을 제안하고, 예산 활용의 효율성과 유지관리 편의성까지
          함께 검토합니다.
        </p>
      </section>
      <ProductCatalog items={catalog} />
    </main>
  );
}
