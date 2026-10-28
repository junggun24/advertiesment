'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  MessageSquareText,
  RefreshCw,
  UsersRound,
} from 'lucide-react';
import type {
  AnalyticsDetailRow,
  AnalyticsInterval,
} from '@/lib/analytics-detail';
import './analytics.css';

type AnalyticsResponse = {
  interval: AnalyticsInterval;
  asOfDate: string;
  rangeStart: string;
  rows: AnalyticsDetailRow[];
  message?: string;
};

const intervalLabels: Record<AnalyticsInterval, string> = {
  day: '일별',
  week: '주별',
  month: '월별',
};

const number = new Intl.NumberFormat('ko-KR');
const date = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});
const shortDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  month: 'numeric',
  day: 'numeric',
});
const month = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
});

function utcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function periodLabel(row: AnalyticsDetailRow, interval: AnalyticsInterval) {
  if (interval === 'day') return date.format(utcDate(row.periodStart));
  if (interval === 'month') return month.format(utcDate(row.periodStart));
  return `${date.format(utcDate(row.periodStart))} – ${shortDate.format(utcDate(row.periodEnd))}`;
}

export default function AdminAnalyticsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [interval, setInterval] = useState<AnalyticsInterval>('day');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void fetch('/api/admin/session')
      .then(async (response) => {
        const session = (await response.json()) as { authenticated?: boolean };
        if (!session.authenticated) {
          location.replace('/admin/login');
          return;
        }
        setAuthorized(true);
      })
      .catch(() => location.replace('/admin/login'));
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const controller = new AbortController();
    void fetch(`/api/admin/analytics?interval=${interval}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as AnalyticsResponse;
        if (response.status === 401) {
          location.replace('/admin/login');
          return;
        }
        if (!response.ok)
          throw new Error(result.message || '상세 집계를 불러오지 못했습니다.');
        setData(result);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError')
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : '상세 집계를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [authorized, interval, reloadKey]);

  const rows = data?.rows ?? [];
  const latest = rows.at(-1);
  const chartRows = rows.slice(-12);
  const maxVisitors = Math.max(1, ...chartRows.map((row) => row.visitors));
  const maxInquiries = Math.max(1, ...chartRows.map((row) => row.inquiries));
  const reversedRows = [...rows].reverse();

  if (!authorized)
    return (
      <main className="admin-gate">
        <p>관리자 권한을 확인하고 있습니다.</p>
      </main>
    );

  return (
    <main className="analytics-detail-admin">
      <header className="analytics-detail-header">
        <Link href="/admin">
          <ArrowLeft /> 관리자 홈
        </Link>
        <div>
          <small>OIC KOREA</small>
          <b>접속 및 문의 상세 집계</b>
        </div>
        <Link href="/admin/inquiries">문의 관리</Link>
      </header>

      <section className="analytics-detail-heading">
        <div>
          <p>ANALYTICS DETAIL</p>
          <h1>방문자와 문의 추이를 확인하세요.</h1>
          <span>
            한국시간 기준으로 일별 30개, 주별 12개, 월별 12개 구간을 제공합니다.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError('');
            setReloadKey((value) => value + 1);
          }}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'spinning' : ''} /> 새로고침
        </button>
      </section>

      <div className="analytics-detail-content">
        <nav className="analytics-intervals" aria-label="집계 기간 선택">
          {(Object.keys(intervalLabels) as AnalyticsInterval[]).map((value) => (
            <button
              type="button"
              className={interval === value ? 'active' : ''}
              aria-pressed={interval === value}
              onClick={() => {
                if (interval === value) return;
                setLoading(true);
                setError('');
                setInterval(value);
              }}
              key={value}
            >
              {intervalLabels[value]}
            </button>
          ))}
          <span>
            {data ? `${data.rangeStart} – ${data.asOfDate}` : '집계 중'}
          </span>
        </nav>

        {error ? <p className="analytics-detail-error">{error}</p> : null}

        <section className="analytics-detail-summary">
          <article>
            <div>
              <CalendarDays />
            </div>
            <span>현재 구간 방문자</span>
            <strong>{number.format(latest?.visitors ?? 0)}</strong>
            <small>명</small>
          </article>
          <article>
            <div>
              <UsersRound />
            </div>
            <span>누적 방문자</span>
            <strong>{number.format(latest?.visitorsCumulative ?? 0)}</strong>
            <small>명</small>
          </article>
          <article className="inquiry-tone">
            <div>
              <MessageSquareText />
            </div>
            <span>현재 구간 문의</span>
            <strong>{number.format(latest?.inquiries ?? 0)}</strong>
            <small>건</small>
          </article>
          <article className="inquiry-tone">
            <div>
              <MessageSquareText />
            </div>
            <span>누적 문의</span>
            <strong>{number.format(latest?.inquiriesCumulative ?? 0)}</strong>
            <small>건</small>
          </article>
        </section>

        <section className="analytics-trend" aria-labelledby="trend-title">
          <header>
            <div>
              <small>TREND</small>
              <h2 id="trend-title">최근 구간 추이</h2>
            </div>
            <p>
              <span className="visitor-dot" /> 방문자
              <span className="inquiry-dot" /> 문의
            </p>
          </header>
          <div className="analytics-trend-list">
            {chartRows.map((row) => (
              <div className="analytics-trend-row" key={row.periodStart}>
                <strong>{periodLabel(row, interval)}</strong>
                <div>
                  <i>
                    <span
                      className="visitor-bar"
                      style={{
                        width: `${(row.visitors / maxVisitors) * 100}%`,
                      }}
                    />
                  </i>
                  <b>{number.format(row.visitors)}</b>
                </div>
                <div>
                  <i>
                    <span
                      className="inquiry-bar"
                      style={{
                        width: `${(row.inquiries / maxInquiries) * 100}%`,
                      }}
                    />
                  </i>
                  <b>{number.format(row.inquiries)}</b>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-table-section">
          <header>
            <div>
              <small>ACCUMULATION</small>
              <h2>기간별 상세 내역</h2>
            </div>
            <span>최신 구간부터 표시</span>
          </header>
          <div className="analytics-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>기간</th>
                  <th>방문자</th>
                  <th>누적 방문자</th>
                  <th>문의</th>
                  <th>누적 문의</th>
                </tr>
              </thead>
              <tbody>
                {reversedRows.map((row) => (
                  <tr key={row.periodStart}>
                    <th>{periodLabel(row, interval)}</th>
                    <td>{number.format(row.visitors)}명</td>
                    <td>{number.format(row.visitorsCumulative)}명</td>
                    <td>{number.format(row.inquiries)}건</td>
                    <td>{number.format(row.inquiriesCumulative)}건</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            방문자는 해당 기간의 고유 브라우저 수입니다. 누적 방문자는 집계 기능
            적용 이후, 누적 문의는 저장된 전체 문의 기준입니다.
          </p>
        </section>
      </div>
    </main>
  );
}
