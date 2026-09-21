import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의 접수 완료',
  robots: { index: false, follow: false, nocache: true },
};

export default function InquiryCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
