export type Product = {
  slug: string; name: string; category: string; summary: string;
  features: string[]; uses: string[]; price: string; status: string;
};

export const products: Product[] = [
  { slug:'information-led-board', name:'안내전광판', category:'전광판', summary:'행정·재난·기상 정보를 멀리서도 선명하게 전달하는 맞춤형 전광판', features:['옥내·옥외 맞춤 설계','원격 콘텐츠 운영','설치 환경별 밝기 조정'], uses:['시정 홍보','재난·기상 안내','안전보건 안내'], price:'나라장터 등록 가격 확인 예정', status:'상세 자료 입력 중' },
  { slug:'video-wall', name:'멀티비전', category:'영상정보디스플레이장치', summary:'상황실과 홍보관의 공간 크기에 맞춰 구성하는 대형 다중 화면', features:['고해상도 대형 화면','다중 입력 통합 제어','벽면 맞춤 배치'], uses:['상황실','홍보관','회의실'], price:'구성 및 크기별 견적', status:'상세 자료 입력 중' },
  { slug:'outdoor-kiosk', name:'옥외용 키오스크', category:'영상정보디스플레이장치', summary:'햇빛과 비바람 속에서도 안정적으로 정보를 제공하는 독립형 장치', features:['고휘도 화면','방수·방진 구조','터치 기능 선택'], uses:['공공청사','공원·광장','문화시설'], price:'나라장터 등록 가격 확인 예정', status:'상세 자료 입력 중' },
];

export type CaseStudy = { slug:string; title:string; place:string; purpose:string; productSlug:string; summary:string; status:string };
export const cases: CaseStudy[] = [
  { slug:'public-office-board', title:'시정 홍보 전자게시판', place:'공공청사', purpose:'시정 홍보', productSlug:'information-led-board', summary:'청사 방문객과 시민에게 주요 행정 소식과 생활 정보를 전달하는 구성입니다.', status:'실제 사례 자료 입력 예정' },
  { slug:'safety-information-board', title:'안전보건 안내전광판', place:'안전 현장', purpose:'안전 안내', productSlug:'information-led-board', summary:'작업자에게 안전수칙과 현장 정보를 실시간으로 전달하는 구성입니다.', status:'실제 사례 자료 입력 예정' },
  { slug:'culture-video-wall', title:'문화시설 안내 멀티비전', place:'문화시설', purpose:'행사 안내', productSlug:'video-wall', summary:'행사 일정과 시설 안내를 한 화면에서 선명하게 전달하는 구성입니다.', status:'실제 사례 자료 입력 예정' },
];

export const getProduct = (slug:string) => products.find(item=>item.slug===slug);
export const getCase = (slug:string) => cases.find(item=>item.slug===slug);
