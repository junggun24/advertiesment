export type ContentType = 'product' | 'case' | 'faq' | 'site' | 'seo';
export type ContentItem<T = Record<string, unknown>> = {
  id: number;
  type: ContentType;
  slug: string;
  title: string;
  data: T;
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};
export type SiteSettings={companyName:string;phone:string;email:string;address:string;fax:string;businessNumber:string;heroTitle:string;heroDescription:string;consultantName:string};
export const defaultSiteSettings:SiteSettings={companyName:'주식회사 오아이씨코리아',phone:'032-719-7947',email:'sales@oickorea.com',address:'인천광역시 부평구 안남로 369번길 12, 5층',fax:'032-719-7591',businessNumber:'130-86-61170',heroTitle:'모든 디스플레이, 커스텀 주문 제작이 가능합니다.',heroDescription:'공공기관 안내전광판부터 멀티비전, 옥외용 키오스크까지. 설치 목적과 공간에 맞춰 기획·제작·설치를 한 번에 진행합니다.',consultantName:'신재훈 과장'};
export type SeoSettings={siteName:string;siteUrl:string;title:string;titleTemplate:string;description:string;keywords:string[];ogTitle:string;ogDescription:string;ogImage:string;allowIndexing:boolean};
export const PUBLIC_SITE_URL='https://display.dsko.workers.dev';
export const defaultSeoSettings:SeoSettings={siteName:'오아이씨코리아',siteUrl:PUBLIC_SITE_URL,title:'공공 디스플레이 맞춤 제작 | 오아이씨코리아',titleTemplate:'%s | 오아이씨코리아',description:'안내전광판, 멀티비전, 옥외용 키오스크를 설치 환경과 목적에 맞춰 설계·제작합니다.',keywords:['안내전광판','멀티비전','옥외용 키오스크','공공 디스플레이','영상정보디스플레이장치'],ogTitle:'공공 디스플레이 맞춤 제작 | 오아이씨코리아',ogDescription:'안내전광판, 멀티비전, 옥외용 키오스크를 기획부터 설치까지 맞춤 제작합니다.',ogImage:'/oic/prod-notice.jpg',allowIndexing:true};
