import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cases, getProduct, type CaseStudy, type Product } from '@/lib/catalog';
import { getContentItems, getContentRecords, mergeBySlug } from '@/lib/content-data';
import { prepareEditorHtml, resolveContentImage } from '@/lib/editor-content';
import '../../detail-seo.css';

async function storedProduct(slug:string){const records=await getContentRecords<Product>('product');const record=records.find(item=>item.slug===slug);if(!record)return null;return{record,product:{...record.data,slug:record.slug,image:resolveContentImage(record.data)} as Product}}
const safeSources=(values?:string[])=>values?.filter(value=>/^https?:\/\//i.test(value))??[];

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const saved=await storedProduct(slug);const product=saved?.product??getProduct(slug);return product?{title:product.name,description:product.summary,alternates:{canonical:`/products/${slug}`},...(product.image?{openGraph:{title:product.name,description:product.summary,images:[{url:product.image,alt:`${product.name} 제품 이미지`}]},twitter:{card:'summary_large_image',title:product.name,description:product.summary,images:[product.image]}}:{})}:{title:'제품을 찾을 수 없습니다.',robots:{index:false,follow:false}}}

export default async function ProductDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const saved=await storedProduct(slug);const product=saved?.product??getProduct(slug);if(!product)notFound();
  const related=mergeBySlug(cases,await getContentItems<CaseStudy>('case')).filter(item=>item.productSlug===slug);
  const specs=[['모델명',product.modelName],['제품 규격',product.dimensions],['해상도',product.resolution],['밝기',product.brightness],['설치 환경',product.environment],['방수·방진',product.protectionRating],['소비전력',product.powerConsumption],['제어 방식',product.controlMethod],['설치 방식',product.installationMethod]].filter((entry):entry is [string,string]=>Boolean(entry[1]));
  const sources=safeSources(product.sourceUrls);const modified=saved?.record.updated_at?.slice(0,10);
  const amount=product.priceAmount&&Number(product.priceAmount)>0?Number(product.priceAmount):null;
  const schema={'@context':'https://schema.org','@graph':[{'@type':'Product','@id':`/products/${slug}#product`,name:product.name,image:product.image||undefined,description:product.summary,brand:{'@type':'Brand',name:'OIC KOREA'},category:product.category,sku:product.procurementId||product.modelName||undefined,additionalProperty:specs.map(([name,value])=>({'@type':'PropertyValue',name,value})),...(amount?{offers:{'@type':'Offer',price:amount,priceCurrency:'KRW',availability:'https://schema.org/InStock',url:`/products/${slug}`}}:{})},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:'/'},{'@type':'ListItem',position:2,name:'제품소개',item:'/products'},{'@type':'ListItem',position:3,name:product.name,item:`/products/${slug}`}]}]};
  return <main className="detail-page">
    <div className="subnav"><a href="/products">← 제품 목록</a><a href="/inquiry">견적 문의</a></div>
    <section className={product.image?'detail-hero has-image':'detail-hero'}><div><small>{product.category}</small><h1>{product.name}</h1><p>{product.summary}</p><span>{product.status}</span></div>{product.image&&<img src={product.image} alt={`${product.name} 제품 이미지`} decoding="async" fetchPriority="high"/>}</section>
    {product.body&&<article className="editor-content" dangerouslySetInnerHTML={{__html:prepareEditorHtml(product.body)}}/>}
    {specs.length>0&&<section className="fact-section"><h2>제품 규격</h2><dl>{specs.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>}
    <section className="detail-grid"><article><h2>주요 특징</h2>{(product.features??[]).map(value=><p key={value}><CheckCircle2/>{value}</p>)}</article><article><h2>주요 사용처</h2>{(product.uses??[]).map(value=><p key={value}><CheckCircle2/>{value}</p>)}</article><article><h2>가격 안내</h2><strong>{product.price||'상담 후 안내'}</strong><p>설치 환경과 규격 확인 후 정확한 범위를 안내합니다.</p></article></section>
    {(product.priceIncludes?.length||product.priceExcludes?.length||product.procurementId||product.leadTime||product.warranty)&&<section className="fact-section"><h2>구매·납품 정보</h2><dl>{product.procurementId&&<div><dt>나라장터 식별번호</dt><dd>{product.procurementId}</dd></div>}{product.leadTime&&<div><dt>예상 납기</dt><dd>{product.leadTime}</dd></div>}{product.warranty&&<div><dt>보증·A/S</dt><dd>{product.warranty}</dd></div>}{product.priceIncludes?.length&&<div><dt>가격 포함</dt><dd>{product.priceIncludes.join(', ')}</dd></div>}{product.priceExcludes?.length&&<div><dt>가격 제외</dt><dd>{product.priceExcludes.join(', ')}</dd></div>}</dl></section>}
    {(product.author||product.reviewer||modified||sources.length>0)&&<aside className="detail-trust">{product.author&&<span><b>작성</b>{product.author}</span>}{product.reviewer&&<span><b>검수</b>{product.reviewer}</span>}{modified&&<span><b>최종 수정</b><time dateTime={modified}>{modified}</time></span>}{sources.map(source=><a href={source} target="_blank" rel="noreferrer" key={source}>근거 자료 · {new URL(source).hostname}</a>)}</aside>}
    <section className="related"><h2>관련 설치 구성</h2>{related.length?<div>{related.map(item=><a key={item.slug} href={`/cases/${item.slug}`}><span>{item.place}</span><b>{item.title}</b><ArrowRight/></a>)}</div>:<p>관련 설치사례를 준비 중입니다.</p>}</section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
  </main>;
}
