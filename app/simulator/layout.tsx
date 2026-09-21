import type { Metadata } from 'next';

export const metadata:Metadata={title:'디스플레이 예상 견적 계산기',description:'벽면 크기와 디스플레이 구성을 입력해 제품 수량과 예상 금액을 확인하세요.',alternates:{canonical:'/simulator'}};

export default function SimulatorLayout({children}:{children:React.ReactNode}){return children}
