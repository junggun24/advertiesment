import { Pool } from 'pg';
import { products, cases } from '../lib/catalog.ts';

process.loadEnvFile?.('.env.local');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`create table if not exists inquiries (
  id bigserial primary key,
  name varchar(40) not null,
  organization varchar(100) not null,
  contact varchar(40) not null,
  message text not null,
  status varchar(20) not null default 'new',
  assignee varchar(80) not null default '',
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`);
await pool.query('create index if not exists idx_inquiries_status_created on inquiries(status, created_at desc)');
await pool.query(`create table if not exists content_items (
  id bigserial primary key,
  type varchar(30) not null,
  slug varchar(120) not null,
  title varchar(200) not null,
  data jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(type, slug)
)`);
await pool.query('create index if not exists idx_content_type_order on content_items(type, sort_order, id)');
await pool.query(`create table if not exists content_assets (
  id bigserial primary key,
  object_key text not null unique,
  original_name text not null,
  content_type varchar(100) not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
)`);
await pool.query('alter table content_assets add column if not exists inquiry_id bigint references inquiries(id) on delete cascade');

const faqs = [
  {slug:'pricing',title:'안내전광판 가격은 어떻게 결정되나요?',data:{tag:'가격·견적',answer:'화면 크기, 실내·실외 여부, 필요한 밝기, 제어 방식, 구조물과 배선 등 설치 조건을 함께 확인해 결정합니다. 같은 크기라도 현장 조건에 따라 총액이 달라질 수 있습니다.'}},
  {slug:'product-choice',title:'멀티비전과 안내전광판 중 무엇을 선택해야 하나요?',data:{tag:'제품 선택',answer:'영상과 여러 화면을 고해상도로 보여주는 실내 공간은 멀티비전이 알맞고, 안내문·안전정보를 멀리 전달하거나 옥외에 설치한다면 안내전광판을 먼저 검토합니다.'}},
  {slug:'procurement',title:'나라장터 제품은 무엇을 먼저 확인해야 하나요?',data:{tag:'나라장터 구매',answer:'제품명만 보지 말고 규격, 구성품, 등록 가격에 설치비가 포함됐는지, 납품 가능 지역과 기간을 확인해야 합니다.'}},
  {slug:'site-survey',title:'현장 실사에서는 어떤 항목을 확인하나요?',data:{tag:'설치·시공',answer:'벽면 크기와 재질, 전원·통신 위치, 시청 거리와 햇빛 방향, 장비 반입 동선, 작업 가능 시간, 안전 설비 필요 여부를 확인합니다.'}},
  {slug:'materials',title:'문의 전에 어떤 자료를 준비하면 좋나요?',data:{tag:'설치·시공',answer:'설치 위치 사진, 벽면의 대략적인 가로·세로 길이, 표시할 콘텐츠, 희망 일정과 예산 범위를 준비하면 제품 제안이 빨라집니다.'}},
  {slug:'support',title:'설치 후 A/S는 어떻게 진행되나요?',data:{tag:'유지보수·A/S',answer:'증상을 확인한 뒤 원격 점검 가능 여부와 현장 방문 필요 여부를 구분합니다. 부품 교체가 필요한 경우 대상 부품과 일정을 안내한 뒤 작업합니다.'}},
];

const seeds = [
  ...products.map((item, index) => ({ type:'product',slug:item.slug,title:item.name,data:item,sort:index })),
  ...cases.map((item, index) => ({ type:'case',slug:item.slug,title:item.title,data:item,sort:index })),
  ...faqs.map((item, index) => ({ type:'faq',...item,sort:index })),
  {type:'site',slug:'main',title:'사이트 기본정보',sort:0,data:{companyName:'주식회사 오아이씨코리아',phone:'032-719-7947',email:'sales@oickorea.com',address:'인천광역시 부평구 안남로 369번길 12, 5층',fax:'032-719-7591',businessNumber:'130-86-61170',heroTitle:'모든 디스플레이, 커스텀 주문 제작이 가능합니다.',heroDescription:'공공기관 안내전광판부터 멀티비전, 옥외용 키오스크까지. 설치 목적과 공간에 맞춰 기획·제작·설치를 한 번에 진행합니다.',consultantName:'신재훈 과장'}},
  {type:'seo',slug:'global',title:'전역 SEO 설정',sort:0,data:{siteName:'오아이씨코리아',siteUrl:'https://oic-korea-display.changsoft101.chatgpt.site',title:'공공 디스플레이 맞춤 제작 | 오아이씨코리아',titleTemplate:'%s | 오아이씨코리아',description:'안내전광판, 멀티비전, 옥외용 키오스크를 설치 환경과 목적에 맞춰 설계·제작합니다.',keywords:['안내전광판','멀티비전','옥외용 키오스크','공공 디스플레이','영상정보디스플레이장치'],ogTitle:'공공 디스플레이 맞춤 제작 | 오아이씨코리아',ogDescription:'안내전광판, 멀티비전, 옥외용 키오스크를 기획부터 설치까지 맞춤 제작합니다.',ogImage:'/oic/prod-notice.jpg',allowIndexing:true}},
];
for (const item of seeds) await pool.query(
  `insert into content_items(type,slug,title,data,sort_order) values($1,$2,$3,$4,$5)
   on conflict(type,slug) do nothing`,
  [item.type,item.slug,item.title,item.data,item.sort],
);
await pool.query("update content_items set data=jsonb_set(data,'{question}',to_jsonb(title)) where type='faq' and not (data ? 'question')");
console.log(`Database initialized with ${seeds.length} content seeds.`);
await pool.end();
