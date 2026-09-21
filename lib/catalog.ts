export type Product = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  image: string;
  thumbnail?: string;
  body?: string;
  features: string[];
  uses: string[];
  price: string;
  status: string;
  modelName?: string;
  dimensions?: string;
  resolution?: string;
  brightness?: string;
  environment?: string;
  protectionRating?: string;
  powerConsumption?: string;
  controlMethod?: string;
  installationMethod?: string;
  leadTime?: string;
  warranty?: string;
  procurementId?: string;
  priceAmount?: string;
  priceIncludes?: string[];
  priceExcludes?: string[];
  author?: string;
  reviewer?: string;
  sourceUrls?: string[];
  modelIds?: number[];
};

export const products: Product[] = [
  {
    slug: 'information-led-board',
    name: '안내전광판',
    category: '전광판',
    summary: '행정·재난·기상 정보를 멀리서도 선명하게 전달하는 맞춤형 전광판',
    image: '/oic/prod-notice.jpg',
    features: [
      '옥내·옥외 맞춤 설계',
      '원격 콘텐츠 운영',
      '설치 환경별 밝기 조정',
    ],
    uses: ['시정 홍보', '재난·기상 안내', '안전보건 안내'],
    price: '시안 기준 2,070,000원부터',
    status: '최종 규격·조달 식별번호 확인 필요',
  },
  {
    slug: 'video-wall',
    name: '멀티비전',
    category: '영상정보디스플레이장치',
    summary: '상황실과 홍보관의 공간 크기에 맞춰 구성하는 대형 다중 화면',
    image: '/oic/prod-multivision.jpg',
    features: ['고해상도 대형 화면', '다중 입력 통합 제어', '벽면 맞춤 배치'],
    uses: ['상황실', '홍보관', '회의실'],
    price: '시안 기준 3,850,000원부터',
    status: '구성과 설치 환경에 따라 최종 견적',
  },
  {
    slug: 'outdoor-kiosk',
    name: '옥외용 키오스크',
    category: '영상정보디스플레이장치',
    summary: '햇빛과 비바람 속에서도 안정적으로 정보를 제공하는 독립형 장치',
    image: '/oic-outdoor-kiosk.jpg',
    features: ['고휘도 화면', '방수·방진 구조', '터치 기능 선택'],
    uses: ['공공청사', '공원·광장', '문화시설'],
    price: '시안 기준 9,900,000원부터',
    status: '최종 규격·조달 식별번호 확인 필요',
  },
];

export type CaseStudy = {
  slug: string;
  title: string;
  place: string;
  purpose: string;
  productSlug: string;
  summary: string;
  status: string;
  image: string;
  thumbnail?: string;
  body?: string;
  installedAt?: string;
  clientType?: string;
  region?: string;
  challenge?: string;
  solution?: string;
  result?: string;
  modelName?: string;
  specifications?: string[];
  projectDuration?: string;
  constraints?: string[];
  author?: string;
  reviewer?: string;
  sourceUrls?: string[];
};
export const cases: CaseStudy[] = [
  {
    slug: 'public-office-board',
    title: '공공청사 시정 홍보 전자게시판',
    place: '공공청사',
    purpose: '시정 홍보',
    productSlug: 'information-led-board',
    summary:
      '청사 방문객과 시민에게 주요 행정 소식과 생활 정보를 전달하는 구성입니다.',
    status: '첨부 시안 사례 · 기관명 확인 필요',
    image: '/oic/case-1.jpg',
  },
  {
    slug: 'safety-information-board',
    title: '안전보건 안내전광판',
    place: '안전 현장',
    purpose: '안전 안내',
    productSlug: 'information-led-board',
    summary:
      '작업자에게 안전수칙과 현장 정보를 실시간으로 전달하는 구성입니다.',
    status: '첨부 시안 사례 · 기관명 확인 필요',
    image: '/oic/case-2.jpg',
  },
  {
    slug: 'culture-video-wall',
    title: '문화시설 안내 멀티비전',
    place: '문화시설',
    purpose: '행사 안내',
    productSlug: 'video-wall',
    summary:
      '행사 일정과 시설 안내를 한 화면에서 선명하게 전달하는 구성입니다.',
    status: '첨부 시안 사례 · 기관명 확인 필요',
    image: '/oic/case-4.jpg',
  },
];

export const getProduct = (slug: string) =>
  products.find((item) => item.slug === slug);
export const getCase = (slug: string) =>
  cases.find((item) => item.slug === slug);
