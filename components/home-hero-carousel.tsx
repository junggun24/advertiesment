'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    src: '/oic/home-company.jpg',
    alt: '인천 부평구 오아이씨코리아 자체 사옥 전경',
    title: '자체 사옥',
    description: '인천 부평구 오아이씨코리아 사옥',
    position: '56% 45%',
  },
  {
    src: '/oic/home-manufacturing.jpg',
    alt: '디스플레이 제품을 제작하고 품질을 확인하는 제조팀 생산 라인',
    title: '자체 제조설비',
    description: '제품 제작과 품질 검수를 수행하는 제조팀 라인',
    position: '50% 50%',
  },
  {
    src: '/oic/home-research.jpg',
    alt: '멀티비전 설치 구조를 설계하는 오아이씨코리아 연구소',
    title: '자체 연구소',
    description: '현장 조건에 맞는 설치 구조와 시스템 설계',
    position: '50% 50%',
  },
];

export function HomeHeroCarousel() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  const move = (offset: number) => {
    setIndex((current) => (current + offset + slides.length) % slides.length);
  };

  return (
    <figure className="hero-carousel" aria-label="오아이씨코리아 보유 시설">
      <div className="hero-carousel-viewport">
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={index === 0}
          sizes="(max-width: 900px) calc(100vw - 40px), 540px"
          style={{ objectPosition: slide.position }}
        />
        <button
          className="hero-carousel-previous"
          type="button"
          onClick={() => move(-1)}
          aria-label="이전 이미지 보기"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          className="hero-carousel-next"
          type="button"
          onClick={() => move(1)}
          aria-label="다음 이미지 보기"
        >
          <ChevronRight aria-hidden="true" />
        </button>
        <span className="hero-carousel-count" aria-hidden="true">
          {String(index + 1).padStart(2, '0')} /{' '}
          {String(slides.length).padStart(2, '0')}
        </span>
      </div>
      <figcaption className="hero-carousel-caption" aria-live="polite">
        <strong>{slide.title}</strong>
        <span>{slide.description}</span>
      </figcaption>
    </figure>
  );
}
