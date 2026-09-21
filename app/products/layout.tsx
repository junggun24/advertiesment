import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '디스플레이 제품소개',
  description:
    '공공기관용 안내전광판, 멀티비전, 옥외용 키오스크의 특징과 적용 공간을 확인하세요.',
  alternates: { canonical: '/products' },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
