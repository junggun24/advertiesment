'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { ContentItem } from '@/lib/content-types';
import { CASE_PURPOSES, selectCaseExportItems } from '@/lib/case-categories';
import './case-purpose-export.css';

export function CasePurposeExport({ items }: { items: ContentItem[] }) {
  const [includeDrafts, setIncludeDrafts] = useState(false);
  return (
    <section className="case-purpose-export" aria-label="설치 목적별 PDF 저장">
      <div>
        <h2>설치 목적별 PDF 저장</h2>
        <p>
          목적을 선택하면 해당 사례의 상세 본문과 모든 사진을 담은 출력 화면이
          열립니다. PDF 저장을 누른 뒤 대상을 ‘PDF로 저장’으로 선택하세요.
        </p>
      </div>
      <label>
        <input
          type="checkbox"
          checked={includeDrafts}
          onChange={(event) => setIncludeDrafts(event.target.checked)}
        />
        비공개 사례 포함
      </label>
      <div className="case-purpose-export-buttons">
        {CASE_PURPOSES.map((purpose) => {
          const count = selectCaseExportItems(
            items,
            purpose,
            includeDrafts,
          ).length;
          const content = (
            <>
              <FileDown />
              <b>{purpose}</b>
              <span>{count}건</span>
            </>
          );
          return count ? (
            <a
              key={purpose}
              href={`/api/admin/cases/export?purpose=${encodeURIComponent(purpose)}${includeDrafts ? '&includeDrafts=1' : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${purpose} ${count}건 PDF 저장`}
            >
              {content}
            </a>
          ) : (
            <span
              key={purpose}
              className="case-purpose-export-empty"
              aria-disabled="true"
            >
              {content}
            </span>
          );
        })}
      </div>
    </section>
  );
}
