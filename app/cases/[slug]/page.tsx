import { ArrowRight, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCase, getProduct, type CaseStudy, type Product } from '@/lib/catalog';
import { getContentItems, getContentRecords } from '@/lib/content-data';
import { prepareEditorHtml, resolveContentImage } from '@/lib/editor-content';
import '../../detail-seo.css';

async function storedCase(slug:string){const records=await getContentRecords<CaseStudy>('case');const record=records.find(item=>item.slug===slug);if(!record)return null;return{record,item:{...record.data,slug:record.slug,image:resolveContentImage(record.data)} as CaseStudy}}
const safeSources=(values?:string[])=>values?.filter(value=>/^https?:\/\//i.test(value))??[];

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const saved=await storedCase(slug);const item=saved?.item??getCase(slug);return item?{title:item.title,description:item.summary,alternates:{canonical:`/cases/${slug}`},...(item.image?{openGraph:{title:item.title,description:item.summary,type:'article',images:[{url:item.image,alt:`${item.title} 설치 이미지`}]},twitter:{card:'summary_large_image',title:item.title,description:item.summary,images:[item.image]}}:{})}:{title:'사례를 찾을 수 없습니다.',robots:{index:false,follow:false}}}

export default async function CaseDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const saved=await storedCase(slug);const item=saved?.item??getCase(slug);if(!item)notFound();
  const storedProducts=await getContentItems<Product>('product');const product=storedProducts.find(value=>value.slug===item.productSlug)??getProduct(item.productSlug);
  const facts=[['설치 일자',item.installedAt],['고객·시설 유형',item.clientType],['설치 지역',item.region],['적용 모델',item.modelName],['설치 기간',item.projectDuration]].filter((entry):entry is [string,string]=>Boolean(entry[1]));
  const sources=safeSources(item.sourceUrls);const published=item.installedAt??saved?.record.created_at?.slice(0,10);const modified=saved?.record.updated_at?.slice(0,10);
  const schema={'@context':'https://schema.org','@graph':[{'@type':'Article','@id':`/cases/${slug}#article`,headline:item.title,description:item.summary,image:item.image||undefined,datePublished:published,dateModified:modified,author:{'@type':'Organization',name:item.author||'오아이씨코리아'},publisher:{'@type':'Organization',name:'주식회사 오아이씨코리아'},about:product?{'@type':'Product',name:product.name,url:`/products/${product.slug}`}:undefined},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:'/'},{'@type':'ListItem',position:2,name:'설치사례',item:'/cases'},{'@type':'ListItem',position:3,name:item.title,item:`/cases/${slug}`}]}]};
  return <main className="detail-page">
    <div className="subnav"><a href="/cases">← 설치사례 목록</a><a href="/inquiry">견적 문의</a></div>
    <section className={item.image?'detail-hero has-image':'detail-hero'}><div><small><MapPin/> {item.place}</small><h1>{item.title}</h1><p>{item.summary}</p><span>{item.status}</span></div>{item.image&&<img src={item.image} alt={`${item.title} 설치 구성 예시`} decoding="async" fetchPriority="high"/>}</section>
    {item.body&&<article className="editor-content" dangerouslySetInnerHTML={{__html:prepareEditorHtml(item.body)}}/>}
    {(item.challenge||item.solution||item.result)&&<section className="case-story">{item.challenge&&<article><small>설치 전 문제</small><h2>현장에서 해결해야 했던 점</h2><p>{item.challenge}</p></article>}{item.solution&&<article><small>적용 방법</small><h2>어떻게 구성했는지</h2><p>{item.solution}</p></article>}{item.result&&<article><small>설치 결과</small><h2>설치 후 달라진 점</h2><p>{item.result}</p></article>}</section>}
    <section className="case-detail"><div><small>설치 목적</small><strong>{item.purpose}</strong></div><div><small>연결 제품</small><strong>{product?.name??'제품 정보 확인 중'}</strong></div><div><small>상세 자료</small><strong>{item.specifications?.length?item.specifications.join(' · '):'등록된 본문을 확인하세요'}</strong></div></section>
    {facts.length>0&&<section className="fact-section"><h2>프로젝트 정보</h2><dl>{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{item.constraints?.length&&<div><dt>현장 제약과 대응</dt><dd>{item.constraints.join(', ')}</dd></div>}</dl></section>}
    {(item.author||item.reviewer||modified||sources.length>0)&&<aside className="detail-trust">{item.author&&<span><b>작성</b>{item.author}</span>}{item.reviewer&&<span><b>현장 확인·검수</b>{item.reviewer}</span>}{modified&&<span><b>최종 수정</b><time dateTime={modified}>{modified}</time></span>}{sources.map(source=><a href={source} target="_blank" rel="noreferrer" key={source}>근거 자료 · {new URL(source).hostname}</a>)}</aside>}
    {product&&<section className="related"><h2>이 구성에 사용되는 제품</h2><div><a href={`/products/${product.slug}`}><span>{product.category}</span><b>{product.name}</b><ArrowRight/></a></div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
  </main>;
}
