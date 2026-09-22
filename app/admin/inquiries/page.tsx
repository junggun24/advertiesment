'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import './attachments.css';
import './analytics.css';

type Attachment = {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
};
type Inquiry = {
  id: number;
  name: string;
  organization: string;
  contact: string;
  message: string;
  status: string;
  assignee: string;
  memo: string;
  created_at: string;
  updated_at: string;
  privacy_consent: number;
  privacy_consent_version: string;
  privacy_consented_at: string | null;
  attachments: Attachment[];
  inquiry_channel: string;
  source_type: string;
  source_name: string;
  campaign: string;
  ad_group: string;
  keyword: string;
  content: string;
  landing_page: string;
  submitted_page: string;
  referrer: string;
  device_type: string;
  page_view_count: number;
  first_visited_at: string | null;
  elapsed_seconds: number;
  last_source_type: string;
  last_source_name: string;
  last_campaign: string;
  last_ad_group: string;
  last_keyword: string;
  last_content: string;
  last_landing_page: string;
  last_referrer: string;
  session_count: number;
  session_page_view_count: number;
  last_visited_at: string | null;
  journey: {
    pages?: Array<{ path: string; enteredAt: string; durationSeconds: number }>;
    events?: Array<{ type: string; label: string; path: string; at: string }>;
  };
  quality_flags: string[];
};
const labels: Record<string, string> = {
  new: '신규',
  contacting: '상담 중',
  quoted: '견적 전달',
  contracted: '계약',
  closed: '종료',
};
const sourceLabels: Record<string, string> = {
  Ads: '광고',
  Organic: '자연검색',
  Direct: '직접 유입',
  Referral: '다른 사이트',
  Unknown: '확인 불가',
};
const sourceColors: Record<string, string> = {
  Ads: '#3157a4',
  Organic: '#2c7a5c',
  Direct: '#bf7432',
  Referral: '#7857a8',
  Unknown: '#7b8794',
};
const display = (value: string | number | null | undefined) =>
  value || '기록 없음';
function duration(seconds: number) {
  if (!seconds) return '1분 미만';
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
  return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`;
}

export default function InquiryAdmin() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [source, setSource] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  async function load() {
    setLoading(true);
    setNotice('');
    const res = await fetch('/api/inquiries', { cache: 'no-store' });
    if (res.status === 401) {
      window.location.replace('/admin/login');
      return;
    }
    if (!res.ok) {
      setNotice('문의 내역을 불러오지 못했습니다.');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { inquiries: Inquiry[] };
    setItems(data.inquiries);
    setSelected(
      (current) =>
        data.inquiries.find((v) => v.id === current?.id) ||
        data.inquiries[0] ||
        null,
    );
    setLoading(false);
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const dated = useMemo(
    () =>
      items.filter((v) => {
        const date = v.created_at.slice(0, 10);
        return (!from || date >= from) && (!to || date <= to);
      }),
    [items, from, to],
  );
  const visible = useMemo(
    () =>
      dated.filter(
        (v) =>
          (filter === 'all' || v.status === filter) &&
          (source === 'all' || (v.source_type || 'Unknown') === source) &&
          [
            v.name,
            v.organization,
            v.contact,
            v.message,
            v.source_name,
            v.campaign,
            v.keyword,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [dated, query, filter, source],
  );
  const sourceCounts = useMemo(
    () =>
      Object.keys(sourceLabels).map((key) => ({
        key,
        label: sourceLabels[key],
        count: dated.filter((v) => (v.source_type || 'Unknown') === key).length,
      })),
    [dated],
  );
  const maxSource = Math.max(1, ...sourceCounts.map((v) => v.count));
  const repeatCount = dated.filter((v) => (v.session_count || 1) > 1).length;
  const warningCount = dated.filter((v) => v.quality_flags?.length).length;
  const campaignStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of dated) {
      const key = item.campaign || item.source_name || '확인 불가';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [dated]);
  const aiSearchStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of dated) {
      const value =
        `${item.source_name} ${item.last_source_name}`.toLowerCase();
      const label = /chatgpt|openai/.test(value)
        ? 'ChatGPT'
        : /perplexity/.test(value)
          ? 'Perplexity'
          : /gemini|bard/.test(value)
            ? 'Gemini'
            : '';
      if (label) counts.set(label, (counts.get(label) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [dated]);
  const aiSearchCount = aiSearchStats.reduce(
    (sum, [, count]) => sum + count,
    0,
  );
  const organicSearchStats = useMemo(() => {
    const engines = ['구글 검색', '네이버 검색', '빙 검색', '다음 검색'];
    return engines.map((name) => ({
      name,
      count: dated.filter(
        (item) => item.source_type === 'Organic' && item.source_name === name,
      ).length,
    }));
  }, [dated]);
  const actionStats = useMemo(() => {
    const labels: Record<string, string> = {
      phone_click: '전화 클릭',
      chat_click: '채팅 클릭',
      cta_click: '문의 CTA',
      form_start: '폼 입력 시작',
      file_attach: '파일 첨부',
      form_submit: '폼 제출',
    };
    const counts = new Map<string, number>();
    for (const item of dated)
      for (const event of item.journey?.events || [])
        counts.set(event.type, (counts.get(event.type) || 0) + 1);
    return [...counts.entries()]
      .map(([key, count]) => [labels[key] || key, count] as const)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [dated]);
  async function save() {
    if (!selected) return;
    setNotice('저장 중...');
    const res = await fetch('/api/inquiries', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(selected),
    });
    if (!res.ok) {
      setNotice('저장하지 못했습니다.');
      return;
    }
    setNotice('저장되었습니다.');
    await load();
  }
  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    window.location.replace('/admin/login');
  }
  async function remove() {
    if (!selected || !window.confirm(`문의 #${selected.id}을 삭제할까요?`))
      return;
    const res = await fetch(`/api/inquiries?id=${selected.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      setNotice('삭제하지 못했습니다.');
      return;
    }
    setSelected(null);
    setNotice('삭제되었습니다.');
    await load();
  }
  async function removeAttachment(file: Attachment) {
    if (!window.confirm(`${file.name} 파일을 삭제할까요?`)) return;
    const res = await fetch(file.url, { method: 'DELETE' });
    if (!res.ok) {
      setNotice('첨부파일을 삭제하지 못했습니다.');
      return;
    }
    setNotice('첨부파일이 삭제되었습니다.');
    await load();
  }
  const counts = Object.keys(labels).reduce(
    (acc, key) => ({
      ...acc,
      [key]: dated.filter((v) => v.status === key).length,
    }),
    {} as Record<string, number>,
  );
  const exportParams = new URLSearchParams();
  if (filter !== 'all') exportParams.set('status', filter);
  if (source !== 'all') exportParams.set('source', source);
  if (from) exportParams.set('from', from);
  const exportQuery = exportParams.toString();
  return (
    <main className="admin-page inquiry-admin">
      <header className="admin-header">
        <Link href="/admin">
          <ArrowLeft /> 관리자 홈
        </Link>
        <div>
          <small>OIC KOREA</small>
          <b>문의·유입 관리</b>
        </div>
        <span className="admin-actions">
          <Link href="/admin/content">콘텐츠 관리</Link>
          <button onClick={() => void load()}>
            <RefreshCw /> 새로고침
          </button>
          <button onClick={() => void logout()}>로그아웃</button>
        </span>
      </header>
      <section className="inquiry-toolbar">
        <div>
          <label>
            시작일
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label>
            유입경로
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">전체 유입</option>
              {Object.entries(sourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <a
          className="excel-export"
          href={`/api/inquiries/export${exportQuery ? `?${exportQuery}` : ''}`}
        >
          <FileSpreadsheet /> Excel 내보내기
        </a>
      </section>
      <section className="inquiry-analytics">
        <div className="analytics-summary">
          <small>조회 조건 내 문의</small>
          <strong>{dated.length}</strong>
          <span>
            표시 중 {visible.length}건 · 재방문 {repeatCount}건 · AI 검색{' '}
            {aiSearchCount}건 · 점검 필요 {warningCount}건
          </span>
        </div>
        <div className="source-chart">
          {sourceCounts.map((item) => (
            <button
              aria-label={`${item.label} 문의 ${item.count}건으로 필터`}
              key={item.key}
              className={source === item.key ? 'active' : ''}
              onClick={() => setSource(source === item.key ? 'all' : item.key)}
            >
              <span>
                <b>{item.label}</b>
                <em>{item.count}건</em>
              </span>
              <i>
                <u
                  style={{
                    width: `${(item.count / maxSource) * 100}%`,
                    background: sourceColors[item.key],
                  }}
                />
              </i>
            </button>
          ))}
        </div>
      </section>
      <section className="automatic-insights">
        <div>
          <h2>캠페인·유입 상위</h2>
          {campaignStats.length ? (
            campaignStats.map(([label, count]) => (
              <p key={label}>
                <span>{label}</span>
                <b>{count}건</b>
              </p>
            ))
          ) : (
            <small>수집된 데이터가 없습니다.</small>
          )}
        </div>
        <div>
          <h2>문의 전 행동</h2>
          {actionStats.length ? (
            actionStats.map(([label, count]) => (
              <p key={label}>
                <span>{label}</span>
                <b>{count}회</b>
              </p>
            ))
          ) : (
            <small>새 문의부터 자동 집계됩니다.</small>
          )}
        </div>
        <div>
          <h2>AI 검색 유입</h2>
          {aiSearchStats.length ? (
            aiSearchStats.map(([label, count]) => (
              <p key={label}>
                <span>{label}</span>
                <b>{count}건</b>
              </p>
            ))
          ) : (
            <small>ChatGPT·Perplexity·Gemini 유입 문의가 아직 없습니다.</small>
          )}
        </div>
        <div>
          <h2>검색엔진별 견적 문의</h2>
          {organicSearchStats.map(({ name, count }) => (
            <p key={name}>
              <span>{name}</span>
              <b>{count}건</b>
            </p>
          ))}
          <small>최초 유입 기준 · 전환율은 검색엔진별 방문 수 연동 후 표시</small>
        </div>
      </section>
      <section className="admin-stats">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          <span>전체 상태</span>
          <b>{dated.length}</b>
        </button>
        {Object.entries(labels).map(([key, label]) => (
          <button
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
            key={key}
          >
            <span>{label}</span>
            <b>{counts[key] || 0}</b>
          </button>
        ))}
      </section>
      <section className="admin-workspace">
        <aside className="inquiry-list">
          <label>
            <Search />
            <input
              aria-label="문의 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="기관, 이름, 연락처, 캠페인 검색"
            />
          </label>
          {loading ? (
            <p className="admin-empty">불러오는 중...</p>
          ) : visible.length ? (
            visible.map((v) => (
              <button
                className={selected?.id === v.id ? 'selected' : ''}
                onClick={() => setSelected(v)}
                key={v.id}
              >
                <div>
                  <span className={`status ${v.status}`}>
                    {labels[v.status]}
                  </span>
                  <time>{v.created_at.slice(0, 10)}</time>
                </div>
                <b>{v.organization}</b>
                <span>
                  {v.name} · {v.contact}
                </span>
                <p>{v.message}</p>
                <small
                  className="source-pill"
                  style={{ color: sourceColors[v.source_type || 'Unknown'] }}
                >
                  {sourceLabels[v.source_type] || '확인 불가'} ·{' '}
                  {v.source_name || '기존 문의'}
                </small>
              </button>
            ))
          ) : (
            <p className="admin-empty">조건에 맞는 문의가 없습니다.</p>
          )}
        </aside>
        <section className="inquiry-detail">
          {selected ? (
            <>
              <div className="detail-title">
                <div>
                  <small>문의 #{selected.id}</small>
                  <h1>{selected.organization}</h1>
                  <p>
                    {selected.name} · {selected.contact}
                  </p>
                </div>
                <span className="admin-detail-actions">
                  <button className="danger" onClick={() => void remove()}>
                    <Trash2 /> 삭제
                  </button>
                  <button onClick={() => void save()}>
                    <Save /> 저장
                  </button>
                </span>
              </div>
              <article>
                <h2>문의 내용</h2>
                <p>{selected.message}</p>
                <small>
                  개인정보 동의:{' '}
                  {selected.privacy_consent
                    ? `확인 · ${display(selected.privacy_consented_at)} · 문서 ${display(selected.privacy_consent_version)}`
                    : '기존 문의 또는 동의 기록 없음'}
                </small>
              </article>
              <section className="attribution-detail">
                <div>
                  <h2>최초 유입 정보</h2>
                  <span
                    className="source-badge"
                    style={{
                      background:
                        sourceColors[selected.source_type || 'Unknown'],
                    }}
                  >
                    {sourceLabels[selected.source_type] || '확인 불가'}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>상세 유입경로</dt>
                    <dd>{display(selected.source_name)}</dd>
                  </div>
                  <div>
                    <dt>접수 채널</dt>
                    <dd>{display(selected.inquiry_channel)}</dd>
                  </div>
                  <div>
                    <dt>캠페인</dt>
                    <dd>{display(selected.campaign)}</dd>
                  </div>
                  <div>
                    <dt>광고그룹</dt>
                    <dd>{display(selected.ad_group)}</dd>
                  </div>
                  <div>
                    <dt>소재</dt>
                    <dd>{display(selected.content)}</dd>
                  </div>
                  <div>
                    <dt>키워드</dt>
                    <dd>{display(selected.keyword)}</dd>
                  </div>
                  <div>
                    <dt>처음 들어온 페이지</dt>
                    <dd>{display(selected.landing_page)}</dd>
                  </div>
                  <div>
                    <dt>문의한 페이지</dt>
                    <dd>{display(selected.submitted_page)}</dd>
                  </div>
                  <div>
                    <dt>이전 주소</dt>
                    <dd>{display(selected.referrer)}</dd>
                  </div>
                  <div>
                    <dt>방문 정보</dt>
                    <dd>
                      {display(selected.device_type)} ·{' '}
                      {selected.page_view_count || 1}페이지 ·{' '}
                      {duration(selected.elapsed_seconds)}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="attribution-detail final-touch">
                <div>
                  <h2>문의 전 최종 유입</h2>
                  <span
                    className="source-badge"
                    style={{
                      background:
                        sourceColors[selected.last_source_type || 'Unknown'],
                    }}
                  >
                    {sourceLabels[selected.last_source_type] || '확인 불가'}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>상세 유입경로</dt>
                    <dd>{display(selected.last_source_name)}</dd>
                  </div>
                  <div>
                    <dt>캠페인</dt>
                    <dd>{display(selected.last_campaign)}</dd>
                  </div>
                  <div>
                    <dt>광고그룹 · 키워드</dt>
                    <dd>
                      {display(
                        [selected.last_ad_group, selected.last_keyword]
                          .filter(Boolean)
                          .join(' · '),
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>최종 랜딩 페이지</dt>
                    <dd>{display(selected.last_landing_page)}</dd>
                  </div>
                  <div>
                    <dt>재방문·현재 방문</dt>
                    <dd>
                      총 {selected.session_count || 1}회 방문 · 현재{' '}
                      {selected.session_page_view_count || 1}페이지
                    </dd>
                  </div>
                  <div>
                    <dt>마지막 이전 주소</dt>
                    <dd>{display(selected.last_referrer)}</dd>
                  </div>
                </dl>
              </section>
              <section className="journey-detail">
                <div>
                  <h2>문의 전 행동</h2>
                  <span>
                    {selected.journey?.pages?.length || 0}개 페이지 ·{' '}
                    {selected.journey?.events?.length || 0}개 행동
                  </span>
                </div>
                {selected.quality_flags?.length > 0 && (
                  <div className="tracking-warning">
                    <b>자동수집 점검</b>
                    {selected.quality_flags.map((flag) => (
                      <p key={flag}>{flag}</p>
                    ))}
                  </div>
                )}
                <ol>
                  {(selected.journey?.pages || [])
                    .slice(-10)
                    .map((item, index) => (
                      <li key={`${item.enteredAt}-${index}`}>
                        <b>{item.path}</b>
                        <span>{duration(item.durationSeconds)}</span>
                      </li>
                    ))}
                </ol>
                <ul>
                  {(selected.journey?.events || [])
                    .slice(-10)
                    .map((item, index) => (
                      <li key={`${item.at}-${index}`}>
                        <b>{item.label}</b>
                        <span>{item.path}</span>
                      </li>
                    ))}
                </ul>
                {!selected.journey?.pages?.length && (
                  <p className="journey-empty">
                    기존 문의에는 방문 여정이 없습니다. 새 문의부터 자동으로
                    기록됩니다.
                  </p>
                )}
              </section>
              {selected.attachments?.length > 0 && (
                <section className="admin-attachments">
                  <h2>첨부파일</h2>
                  {selected.attachments.map((file) => (
                    <div key={file.id}>
                      <a href={file.url} target="_blank" rel="noreferrer">
                        <Download />
                        <span>
                          <b>{file.name}</b>
                          <small>
                            {file.type || '파일'} ·{' '}
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </small>
                        </span>
                      </a>
                      <button
                        title="첨부파일 삭제"
                        onClick={() => void removeAttachment(file)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  ))}
                </section>
              )}
              <div className="admin-fields">
                <label>
                  처리 상태
                  <select
                    value={selected.status}
                    onChange={(e) =>
                      setSelected({ ...selected, status: e.target.value })
                    }
                  >
                    {Object.entries(labels).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  담당자
                  <input
                    value={selected.assignee}
                    onChange={(e) =>
                      setSelected({ ...selected, assignee: e.target.value })
                    }
                    placeholder="담당자 이름"
                  />
                </label>
              </div>
              <label className="memo">
                내부 메모
                <textarea
                  rows={8}
                  value={selected.memo}
                  onChange={(e) =>
                    setSelected({ ...selected, memo: e.target.value })
                  }
                  placeholder="상담 내용, 다음 연락 일정 등을 기록하세요."
                />
              </label>
              {notice && <p className="admin-notice">{notice}</p>}
            </>
          ) : (
            <div className="admin-empty">왼쪽에서 문의를 선택하세요.</div>
          )}
        </section>
      </section>
    </main>
  );
}
