import { Check, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '상담 접수 완료',
  robots: { index: false, follow: false },
};

export default function InquiryCompletePage() {
  return (
    <main className="complete-page">
      <section>
        <div className="complete-check">
          <Check />
        </div>
        <h1>상담 접수가 완료되었습니다</h1>
        <p>담당 영업자 신재훈 과장이 영업일 기준 당일 확인 후 연락드립니다.</p>
        <div className="complete-next">
          <span>다음 안내</span>
          <b>문의 확인 → 추가 정보 안내 → 제품·견적 검토</b>
        </div>
        <article>
          <div>
            <h2>급하신 분은 전화가 빠릅니다</h2>
            <p>평일 09:00–18:00 · 담당자 직통</p>
          </div>
          <a href="tel:0327197947">
            <Phone />
            032-719-7947
          </a>
        </article>
        <nav>
          <Link href="/cases">기다리는 동안 설치 사례 보기 →</Link>
          <Link href="/">메인으로 돌아가기</Link>
        </nav>
      </section>
    </main>
  );
}
