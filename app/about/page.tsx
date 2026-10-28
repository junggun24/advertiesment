import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { pageMetadata } from '@/lib/seo-metadata';
import { getSiteSettings } from '@/lib/site-settings-data';

export const metadata = pageMetadata({
  title: '회사소개',
  description:
    '인천 사옥을 기반으로 공공 안내전광판, 멀티비전, 옥외용 키오스크를 기획·제작·설치하는 오아이씨코리아를 소개합니다.',
  path: '/about',
  image: '/oic/company-building.jpg',
});

export default async function AboutPage() {
  const site = await getSiteSettings();
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
            오아이씨코리아는 2011년 설립 이래 디스플레이 산업의 기술 발전과 ICT
            융합 환경에 발맞춰 성장해 온 디스플레이 솔루션 전문 기업입니다.
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
            안내전광판, 멀티비전, 옥외용 키오스크 등 다양한 디스플레이 장치를
            설치 목적과 현장 환경에 맞춰 설계·구축하며, 축적된 기술력과 전문성을
            바탕으로 고객의 요구에 최적화된 맞춤형 디스플레이 솔루션을
            제공합니다.
          </p>
        </div>
      </section>
      <section className="value-grid trust-grid">
        <article>
          <h2>01. ONE WAY SOLUTION</h2>
          <p>
            자체 제조 기술과 R&amp;D 노하우를 바탕으로 디스플레이 시스템의
            설계부터 제조, 설치 및 유지보수까지 모든 과정을 통합 관리하는 원스톱
            디스플레이 솔루션을 제공합니다.
          </p>
        </article>
        <article>
          <h2>02. 현장 중심의 맞춤형 설계 역량</h2>
          <p>
            설치 공간의 특성과 사용 목적을 분석하여 시청 거리, 설치 구조, 배선
            환경 등을 종합적으로 고려하고, 현장 조건에 최적화된 맞춤형
            디스플레이 시스템을 설계·구축합니다.
          </p>
        </article>
        <article>
          <h2>03. 체계적인 유지보수 및 기술지원</h2>
          <p>
            제품 납품 이후에도 안정적인 시스템 운영을 위해 기술지원과 유지보수
            서비스를 제공하며, 신속한 장애 대응과 지속적인 사후관리로 고객의
            운영 부담을 줄입니다.
          </p>
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
            <dd>인천광역시 부평구 안남로369번길 12 오아이씨코리아 사옥</dd>
          </div>
          <div>
            <dt>대표전화</dt>
            <dd>{site.consultantPhone}</dd>
          </div>
          <div>
            <dt>팩스</dt>
            <dd>{site.fax}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>
              <a href={`mailto:${site.consultantEmail}`}>
                {site.consultantEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>{site.businessNumber}</dd>
          </div>
        </dl>
      </section>
      <section className="page-cta">
        <div>
          <h2>
            제품과 현장을 연결하는
            <br />
            설계 담당자를 만나보세요.
          </h2>
          <p>문의 전에 담당자의 역할과 상담 진행 방식을 확인할 수 있습니다.</p>
        </div>
        <Link href="/people/shin-jaehoon">
          {site.consultantName} 소개 <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
