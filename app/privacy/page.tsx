import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보 처리 안내',
  description:
    '오아이씨코리아 견적 문의 과정에서 수집하는 개인정보와 이용 목적을 안내합니다.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <header>
        <small>PRIVACY</small>
        <h1>개인정보 처리 안내</h1>
        <p>견적 문의 접수와 답변을 위해 필요한 최소한의 정보만 수집합니다.</p>
      </header>
      <section>
        <h2>견적 문의 시 수집하는 정보</h2>
        <p>
          이름, 회사·기관명, 연락처, 문의 내용과 이용자가 직접 첨부한 파일을
          수집합니다.
        </p>
        <h2>이용 목적</h2>
        <p>
          제품 추천, 견적 산정, 현장 확인 일정 조율과 문의 답변을 위해
          사용합니다.
        </p>
        <h2>보유기간</h2>
        <p>
          문의 처리 목적을 달성한 뒤 지체 없이 삭제합니다. 다만 계약 체결 등으로
          관계 법령에 따른 보존 의무가 생기면 해당 기간 동안 분리하여
          보관합니다.
        </p>
        <h2>동의를 거부할 권리</h2>
        <p>
          개인정보 수집에 동의하지 않을 수 있으나, 연락처와 문의 내용이 없으면
          온라인 견적 문의 접수가 어렵습니다.
        </p>
        <h2>문의</h2>
        <p>
          개인정보 열람·수정·삭제 요청은 대표전화 032-719-7947 또는
          sales@oickorea.com으로 연락해 주세요.
        </p>
        <p className="legal-version">동의 문서 버전: 2026-09-21</p>
        <Link href="/inquiry">견적 문의로 돌아가기</Link>
      </section>
    </main>
  );
}
