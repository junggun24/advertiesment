import { products } from '@/lib/catalog';
import { ProductCatalog } from '@/components/product-catalog';
import { getContentItems, mergeBySlug } from '@/lib/content-data';
import type { Product } from '@/lib/catalog';

export default async function ProductsPage(){
  const catalog=mergeBySlug(products,await getContentItems<Product>('product'));
  return <main className="catalog-page">
    <div className="subnav"><a href="/">← OIC KOREA</a><a href="/cases">설치사례 보기</a></div>
    <section className="catalog-hero"><p className="eyebrow"><i/>PRODUCTS</p><h1>설치 목적에 맞는<br/>제품을 찾아보세요.</h1><p>제품명이나 사용 목적을 검색하면 관련 제품을 바로 확인할 수 있습니다.</p></section>
    <ProductCatalog items={catalog}/>
  </main>
}
