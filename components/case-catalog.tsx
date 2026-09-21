'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { CaseStudy } from '@/lib/catalog';

const filters = [
  { label: '전체', terms: [] },
  { label: '홍보·안내', terms: ['홍보', '행사', '안내'] },
  { label: '시민·현장 안전', terms: ['안전', '재난', '기상'] },
  { label: '교육·문화기관', terms: ['교육', '학교', '문화'] },
];

export function CaseCatalog({ items }: { items: CaseStudy[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('전체');
  const selected =
    filters.find((value) => value.label === filter) ?? filters[0];
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const hay = [
          item.title,
          item.place,
          item.purpose,
          item.summary,
          item.region,
          item.clientType,
        ].join(' ');
        return (
          hay.includes(query) &&
          (!selected.terms.length ||
            selected.terms.some((term) => hay.includes(term)))
        );
      }),
    [query, items, selected],
  );
  return (
    <section className="case-browser">
      <aside>
        <strong>설치 목적</strong>
        <p>찾으려는 용도와 가까운 항목을 선택하세요.</p>
        {filters.map((value) => (
          <button
            key={value.label}
            className={filter === value.label ? 'active' : ''}
            onClick={() => setFilter(value.label)}
          >
            <span aria-hidden="true">{filter === value.label ? '☑' : '□'}</span>
            {value.label}
          </button>
        ))}
      </aside>
      <div className="case-results">
        <label className="case-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="장소 또는 설치 목적 검색"
          />
        </label>
        <section className="catalog-list case-list">
          {filtered.map((item, index) => (
            <article key={item.slug}>
              <Link
                className="catalog-image-link"
                href={`/cases/${item.slug}`}
                aria-label={`${item.title} 구성 보기`}
              >
                {item.image && (
                  <Image
                    unoptimized
                    className="catalog-image"
                    src={item.image}
                    alt={`${item.title} 설치 구성 예시`}
                    width={1200}
                    height={800}
                  />
                )}
                <span>이미지 클릭하여 사례보기</span>
              </Link>
              <small>CASE {String(index + 1).padStart(2, '0')}</small>
              <h2>{item.title}</h2>
              <p>
                <MapPin /> {item.place} · {item.purpose}
              </p>
              <span>{item.status}</span>
              <Link href={`/cases/${item.slug}`}>
                구성 보기 <ArrowRight />
              </Link>
            </article>
          ))}
        </section>
        {!filtered.length && (
          <p className="empty">
            선택한 분류의 사례가 없습니다. 다른 분류를 확인해 주세요.
          </p>
        )}
      </div>
    </section>
  );
}
