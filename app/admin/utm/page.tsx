'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react';
import { PUBLIC_SITE_URL } from '@/lib/content-types';
import './utm.css';

const presets = [
  { label: '구글 검색광고', source: 'google', medium: 'cpc' },
  { label: '네이버 검색광고', source: 'naver', medium: 'cpc' },
  { label: '메타 광고', source: 'meta', medium: 'paid_social' },
  { label: '카카오 광고', source: 'kakao', medium: 'cpc' },
  { label: '뉴스레터', source: 'newsletter', medium: 'email' },
  { label: '오프라인 QR', source: 'offline', medium: 'qr' },
];

export default function UtmAdminPage() {
  const [ready, setReady] = useState(false);
  const [base, setBase] = useState(`${PUBLIC_SITE_URL}/`);
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    void fetch('/api/admin/session')
      .then(async (response) => {
        const data = (await response.json()) as { authenticated?: boolean };
        if (!data.authenticated) {
          location.replace('/admin/login');
          return;
        }
        setReady(true);
      })
      .catch(() => location.replace('/admin/login'));
  }, []);
  const generated = useMemo(() => {
    try {
      const url = new URL(base || PUBLIC_SITE_URL, PUBLIC_SITE_URL);
      const values = {
        utm_source: source,
        utm_medium: medium,
        utm_campaign: campaign,
        utm_term: term,
        utm_content: content,
      };
      for (const [key, value] of Object.entries(values)) {
        if (value.trim()) url.searchParams.set(key, value.trim());
        else url.searchParams.delete(key);
      }
      return url.toString();
    } catch {
      return '';
    }
  }, [base, source, medium, campaign, term, content]);
  async function copy() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  if (!ready)
    return (
      <main className="admin-gate">
        <p>관리자 권한을 확인하고 있습니다.</p>
      </main>
    );
  return (
    <main className="utm-admin">
      <header className="admin-header">
        <Link href="/admin">
          <ArrowLeft /> 관리자 홈
        </Link>
        <div>
          <small>OIC KOREA</small>
          <b>UTM 링크 생성기</b>
        </div>
        <Link href="/admin/inquiries">유입 보고서</Link>
      </header>
      <section className="utm-heading">
        <p>CAMPAIGN URL BUILDER</p>
        <h1>
          광고·홍보 링크를
          <br />
          같은 기준으로 만드세요.
        </h1>
        <span>
          이 화면에서 만든 주소로 방문하면 매체, 캠페인, 키워드와 소재가 문의
          데이터에 자동 저장됩니다.
        </span>
      </section>
      <section className="utm-workspace">
        <form onSubmit={(event) => event.preventDefault()}>
          <h2>1. 링크 정보 입력</h2>
          <label className="wide">
            연결할 페이지 주소
            <input
              type="url"
              required
              value={base}
              onChange={(event) => setBase(event.target.value)}
              placeholder={`${PUBLIC_SITE_URL}/products`}
            />
          </label>
          <div className="utm-presets">
            {presets.map((preset) => (
              <button
                type="button"
                className={
                  source === preset.source && medium === preset.medium
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setSource(preset.source);
                  setMedium(preset.medium);
                }}
                key={preset.label}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="utm-fields">
            <label>
              유입 매체 (source)
              <input
                required
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="예: naver"
              />
            </label>
            <label>
              유입 방식 (medium)
              <input
                required
                value={medium}
                onChange={(event) => setMedium(event.target.value)}
                placeholder="예: cpc, qr, email"
              />
            </label>
            <label className="wide">
              캠페인 이름 (campaign)
              <input
                required
                value={campaign}
                onChange={(event) => setCampaign(event.target.value)}
                placeholder="예: 2026_public_display"
              />
              <small>
                날짜나 공백 대신 영문 소문자, 숫자와 밑줄 사용을 권장합니다.
              </small>
            </label>
            <label>
              검색 키워드 (term)
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="선택사항"
              />
            </label>
            <label>
              광고 소재 구분 (content)
              <input
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="예: banner_a"
              />
            </label>
          </div>
        </form>
        <aside>
          <h2>2. 완성된 추적 링크</h2>
          <div className={generated ? 'utm-result' : 'utm-result invalid'}>
            {generated || '올바른 페이지 주소를 입력해 주세요.'}
          </div>
          <button
            disabled={!generated || !source || !medium || !campaign}
            onClick={() => void copy()}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? '복사 완료' : '추적 링크 복사'}
          </button>
          {generated && (
            <a href={generated} target="_blank" rel="noreferrer">
              새 창에서 테스트 <ExternalLink />
            </a>
          )}
          <dl>
            <div>
              <dt>source</dt>
              <dd>어디에서 방문했는지</dd>
            </div>
            <div>
              <dt>medium</dt>
              <dd>광고, QR, 이메일 등 유입 방식</dd>
            </div>
            <div>
              <dt>campaign</dt>
              <dd>어떤 홍보 활동인지</dd>
            </div>
            <div>
              <dt>term / content</dt>
              <dd>키워드와 광고 소재 구분</dd>
            </div>
          </dl>
          <p>
            오프라인 전단·명함·전시회 QR을 만들 때도 먼저 이 링크를 생성한 뒤 QR
            제작 도구에 붙여 넣으세요.
          </p>
        </aside>
      </section>
    </main>
  );
}
