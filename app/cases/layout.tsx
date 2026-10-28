import { pageMetadata } from '@/lib/seo-metadata';

export const metadata = pageMetadata({
  title: '안내전광판·멀티비전 설치 사례',
  description:
    '공공청사, 학교, 안전 현장과 문화시설의 안내전광판 및 멀티비전 설치 모델과 화면 구성을 확인하세요.',
  path: '/cases',
  image: '/oic/case-1.jpg',
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
