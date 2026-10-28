import { pageMetadata } from '@/lib/seo-metadata';

export const metadata = pageMetadata({
  title: '안내전광판·멀티비전·옥외 키오스크 제품',
  description:
    '공공기관용 안내전광판, 멀티비전, 옥외용 키오스크의 규격, 조달 가격과 적용 공간을 비교하세요.',
  path: '/products',
});
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
