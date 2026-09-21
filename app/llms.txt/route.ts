import { PUBLIC_SITE_URL } from '@/lib/content-types';

export function GET() {
  const text = `# 오아이씨코리아

> 공공기관과 기업을 위한 안내전광판, 비디오월, LED 디스플레이, 옥외용 키오스크의 기획·제작·설치 전문 기업입니다.

## 주요 페이지

- [회사소개](${PUBLIC_SITE_URL}/about): 회사 정보와 제작·설치 역량
- [제품소개](${PUBLIC_SITE_URL}/products): 제품별 특징, 규격과 구매 정보
- [설치사례](${PUBLIC_SITE_URL}/cases): 현장별 설치 목적과 적용 사례
- [디스플레이 정보](${PUBLIC_SITE_URL}/info): 제품 선택에 필요한 질문과 답변
- [사양·가격 계산기](${PUBLIC_SITE_URL}/simulator): 조달 제품 사양 비교와 예상 금액 계산
- [견적문의](${PUBLIC_SITE_URL}/inquiry): 설치 환경과 목적을 바탕으로 상담 요청
- [신재훈 담당자](${PUBLIC_SITE_URL}/people/shin-jaehoon): 제품 및 견적 상담 담당자 정보

## 회사 정보

- 회사명: 주식회사 오아이씨코리아
- 주소: 인천광역시 부평구 안남로 369번길 12, 5층
- 전화: 032-719-7947
- 이메일: sales@oickorea.com
`;
  return new Response(text, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
