import type { Metadata } from 'next';
import './simulator.css';

export const metadata: Metadata = {
  title: '조달 디스플레이 사양·가격 계산기',
  description:
    '비디오월, LED 디스플레이, 옥외용 키오스크의 조달 사양을 비교하고 벽면 크기와 배열에 따른 제품 수량과 예상 금액을 계산하세요.',
  alternates: { canonical: '/simulator' },
};

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
