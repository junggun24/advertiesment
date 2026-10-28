import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { pageMetadata } from '@/lib/seo-metadata';

export const metadata = pageMetadata({
  title: '관공서·프랜차이즈 디스플레이 구축',
  description:
    '관공서 나라장터 구매와 프랜차이즈 다점포 운영에 맞춘 안내전광판, 멀티비전 구축 방식을 소개합니다.',
  path: '/business',
  image: '/oic/business-public-system.jpg',
});
const sectors = [
  {
    id: 'public',
    label: '관공서 · 공공기관',
    title: '맞춤형 디스플레이 시스템 구축',
    text: '맞춤형 디스플레이 시스템 구축을 통해 정보 전달력과 공간 활용도를 높이고, 불필요한 도입 비용과 유지관리 부담을 줄여 효율적이고 안정적인 운영 환경을 제공합니다.',
    items: [
      '현장실사·맞춤형 설계',
      '전문 시공·설치 검수',
      '전국 유지보수·사후관리',
    ],
    image: '/oic/business-public-system.jpg',
    imageAlt: '관공서와 공공기관 전자게시판 시스템 구성도',
  },
  {
    id: 'franchise',
    label: '프랜차이즈 · 매장',
    title: '전국 매장의 디스플레이를\n동일한 품질과 기준으로 구축합니다.',
    text: '프랜차이즈 본사의 운영 방침과 매장별 설치 환경을 고려하여 전자메뉴판과 홍보용 디스플레이를 구축합니다.',
    items: [
      '매장 맞춤형 디스플레이',
      '전국 지점 설치 관리',
      '본사 원격 콘텐츠 관리',
    ],
    image: '/oic/business-franchise-system.jpg',
    imageAlt: '프랜차이즈 본사와 전국 매장 디스플레이 운영 구성도',
  },
];
export default function BusinessPage() {
  return (
    <main className="business-page">
      <section className="plain-hero">
        <h1>공간마다 필요한 디스플레이 솔루션은 다릅니다.</h1>
        <p>
          고객의 도입 목적과 설치 공간의 특성, 운영 환경을 종합적으로 분석하여
          최적의 디스플레이 솔루션을 제안합니다.
        </p>
      </section>
      {sectors.map((sector) => (
        <section className="sector-row" id={sector.id} key={sector.id}>
          <div className="sector-copy">
            <small>{sector.label}</small>
            <h2>
              {sector.title.split('\n').map((v, i) => (
                <span key={v}>
                  {v}
                  {i === 0 && <br />}
                </span>
              ))}
            </h2>
            <p>{sector.text}</p>
            <ul>
              {sector.items.map((item, index) => (
                <li key={item}>
                  <b>{String(index + 1).padStart(2, '0')}.</b>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link className="sector-cta" href="/inquiry">
              이 조건으로 상담하기 <ArrowRight />
            </Link>
          </div>
          <figure className="sector-diagram">
            <a
              href={sector.image}
              target="_blank"
              rel="noreferrer"
              aria-label={`${sector.label} 시스템 구성도 원본 이미지 크게 보기`}
            >
              <Image
                unoptimized
                width={1280}
                height={720}
                src={sector.image}
                alt={sector.imageAlt}
              />
            </a>
            <figcaption>이미지를 누르면 원본 크기로 볼 수 있습니다.</figcaption>
          </figure>
        </section>
      ))}
    </main>
  );
}
