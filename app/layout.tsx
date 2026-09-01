import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://oic-korea-display.changsoft101.chatgpt.site'),
  title: { default: '공공 디스플레이 맞춤 제작 | 오아이씨코리아', template: '%s | 오아이씨코리아' },
  description: '안내전광판, 멀티비전, 옥외용 키오스크를 설치 환경과 목적에 맞춰 설계·제작합니다.',
  alternates: { canonical: '/' },
  keywords: ['안내전광판','멀티비전','옥외용 키오스크','공공 디스플레이','영상정보디스플레이장치'],
  openGraph: { type:'website', locale:'ko_KR', siteName:'오아이씨코리아', url:'/', title:'공공 디스플레이 맞춤 제작 | 오아이씨코리아', description:'안내전광판, 멀티비전, 옥외용 키오스크를 기획부터 설치까지 맞춤 제작합니다.', images:[{url:'/oic/prod-notice.jpg',width:600,height:400,alt:'오아이씨코리아 안내전광판'}] },
  twitter: { card:'summary_large_image', title:'공공 디스플레이 맞춤 제작 | 오아이씨코리아', description:'공공기관용 디스플레이를 목적과 공간에 맞춰 설계·제작합니다.', images:['/oic/prod-notice.jpg'] },
  robots: { index:true, follow:true, googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1} },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = {
    '@context':'https://schema.org', '@graph':[
      {'@type':'Organization','@id':'https://oic-korea-display.changsoft101.chatgpt.site/#organization',name:'주식회사 오아이씨코리아',url:'https://oic-korea-display.changsoft101.chatgpt.site/',logo:'https://oic-korea-display.changsoft101.chatgpt.site/oic/logo.png',telephone:'+82-32-719-7947',email:'sales@oickorea.com',address:{'@type':'PostalAddress',streetAddress:'안남로 369번길 12, 5층',addressLocality:'부평구',addressRegion:'인천광역시',addressCountry:'KR'}},
      {'@type':'WebSite','@id':'https://oic-korea-display.changsoft101.chatgpt.site/#website',url:'https://oic-korea-display.changsoft101.chatgpt.site/',name:'오아이씨코리아',publisher:{'@id':'https://oic-korea-display.changsoft101.chatgpt.site/#organization'},potentialAction:{'@type':'SearchAction',target:'https://oic-korea-display.changsoft101.chatgpt.site/info?q={search_term_string}','query-input':'required name=search_term_string'}}
    ]
  };
  return <html lang="ko"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /></body></html>;
}
