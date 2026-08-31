import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '공공 디스플레이 맞춤 제작 | 오아이씨코리아',
  description: '안내전광판, 멀티비전, 옥외용 키오스크를 설치 환경과 목적에 맞춰 설계·제작합니다.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
