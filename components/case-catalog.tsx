'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import type { CaseStudy } from '@/lib/catalog';
import { ResponsiveImage } from '@/components/responsive-image';
import {
  CASE_PURPOSES,
  formatCaseDisplaySize,
  matchesCasePurpose,
  type CasePurpose,
} from '@/lib/case-categories';

const filters = ['전체', ...CASE_PURPOSES] as const;

export type CaseCatalogItem = Pick<
  CaseStudy,
  | 'slug'
  | 'title'
  | 'place'
  | 'purpose'
  | 'summary'
  | 'image'
  | 'region'
  | 'clientType'
  | 'modelName'
  | 'clientAddress'
  | 'displayRows'
  | 'displayColumns'
>;

export function CaseCatalog({ items }: { items: CaseCatalogItem[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('전체');
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
          item.modelName,
          item.clientAddress,
        ].join(' ');
        return (
          hay.includes(query) &&
          (filter === '전체' ||
            matchesCasePurpose(item.purpose, filter as CasePurpose))
        );
      }),
    [query, items, filter],
  );
  return (
    <section className="case-browser">
      <aside>
        <strong>설치 목적</strong>
        <p>찾으려는 용도와 가까운 항목을 선택하세요.</p>
        {filters.map((value) => (
          <button
            key={value}
            className={filter === value ? 'active' : ''}
            onClick={() => setFilter(value)}
          >
            <span aria-hidden="true">{filter === value ? '☑' : '□'}</span>
            {value}
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
          {filtered.map((item) => {
            const displaySize = formatCaseDisplaySize(
              item.displayRows,
              item.displayColumns,
            );
            return (
              <article key={item.slug}>
                <Link
                  className="catalog-image-link"
                  href={`/cases/${item.slug}`}
                  aria-label={`${item.title} 구성 보기`}
                >
                  {item.image && (
                    <ResponsiveImage
                      className="catalog-image"
                      src={item.image}
                      alt={`${item.title} 설치 구성 예시`}
                      width={1200}
                      height={800}
                      sizes="(max-width: 800px) 100vw, 50vw"
                    />
                  )}
                  <span>이미지 클릭하여 사례보기</span>
                </Link>
                <h2>{item.title}</h2>
                <dl className="case-card-meta">
                  <div>
                    <dt>모델명</dt>
                    <dd>{item.modelName || '모델명 미입력'}</dd>
                  </div>
                  <div>
                    <dt>구성</dt>
                    <dd>{displaySize || '단·열 미입력'}</dd>
                  </div>
                  <div>
                    <dt>수요기관 주소</dt>
                    <dd>
                      <MapPin /> {item.clientAddress || item.place}
                    </dd>
                  </div>
                </dl>
                <span className="case-purpose">{item.purpose}</span>
                <Link href={`/cases/${item.slug}`}>
                  구성 보기 <ArrowRight />
                </Link>
              </article>
            );
          })}
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
