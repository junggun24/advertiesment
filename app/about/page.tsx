import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, Check, MapPin, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: '회사소개',
  description:
    '인천 사옥을 기반으로 공공 안내전광판, 멀티비전, 옥외용 키오스크를 기획·제작·설치하는 오아이씨코리아를 소개합니다.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="content-page">
      <section className="content-hero about-building-hero">
        <div>
          <p className="eyebrow light">ABOUT OIC KOREA</p>
          <h1>
            공공 공간의 정보를
            <br />
            제대로 보이게 만듭니다.
          </h1>
          <p>
            오아이씨코리아는 안내전광판, 멀티비전, 옥외용 키오스크를 설치 목적과
            현장 조건에 맞춰 구성하는 디스플레이 전문 기업입니다.
          </p>
        </div>
        <figure>
          <Image
            unoptimized
            width={1200}
            height={800}
            src="/oic/company-building.jpg"
            alt="인천광역시 부평구에 위치한 오아이씨코리아 사옥 외관"
          />
          <figcaption>인천 부평구 오아이씨코리아 사옥</figcaption>
        </figure>
      </section>
      <section className="about-intro">
        <div>
          <p className="eyebrow">WHAT WE DO</p>
          <h2>
            제품 판매보다 먼저
            <br />
            사용 환경을 확인합니다.
          </h2>
        </div>
        <div>
          <p>
            공공청사, 상황실, 문화시설과 옥외 공간은 필요한 밝기와 내구성,
            콘텐츠 운영 방법이 서로 다릅니다. 그래서 제품명부터 정하지 않고 누가
            어떤 정보를 어디에서 봐야 하는지부터 확인합니다.
          </p>
          <p>
            검토 결과를 바탕으로 제품 규격, 설치 구조, 전기·통신 공사 범위와
            운영 방법을 하나의 제안으로 정리합니다.
          </p>
        </div>
      </section>
      <section className="value-grid trust-grid">
        <article>
          <Building2 />
          <h2>자체 사옥 기반</h2>
          <p>
            인천 부평구 사옥을 기반으로 제품 검토부터 제작·설치 상담까지 책임
            있게 진행합니다.
          </p>
        </article>
        <article>
          <Wrench />
          <h2>현장 중심 설계</h2>
          <p>
            벽체, 반입 동선, 배선과 시청 거리를 확인해 설치 후 생길 문제를
            줄입니다.
          </p>
        </article>
        <article>
          <Check />
          <h2>납품 이후 지원</h2>
          <p>검수, 사용 방법과 유지보수 접수 창구를 명확하게 안내합니다.</p>
        </article>
      </section>
      <section className="company-facts">
        <div>
          <p className="eyebrow light">COMPANY INFORMATION</p>
          <h2>
            주식회사
            <br />
            오아이씨코리아
          </h2>
        </div>
        <dl>
          <div>
            <dt>본사</dt>
            <dd>
              <MapPin />
              인천광역시 부평구 안남로 369번길 12, 5층
            </dd>
          </div>
          <div>
            <dt>대표전화</dt>
            <dd>032-719-7947</dd>
          </div>
          <div>
            <dt>팩스</dt>
            <dd>032-719-7591</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>sales@oickorea.com</dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>130-86-61170</dd>
          </div>
        </dl>
      </section>
      <section className="page-cta">
        <div>
          <h2>
            제품과 현장을 연결하는
            <br />
            상담 담당자를 만나보세요.
          </h2>
          <p>문의 전에 담당자의 역할과 상담 진행 방식을 확인할 수 있습니다.</p>
        </div>
        <Link href="/people/shin-jaehoon">
          신재훈 담당자 소개 <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
