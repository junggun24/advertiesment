'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  FilePenLine,
  ClipboardList,
  Link2,
  LogOut,
  MessageSquareText,
  MonitorCog,
  Search,
  UsersRound,
  UserRound,
} from 'lucide-react';
import './dashboard.css';

type DashboardStats = {
  asOfDate: string;
  visitors: { today: number; total: number };
  inquiries: { today: number; total: number };
};

const cards = [
  {
    href: '/admin/requirements',
    icon: ClipboardList,
    title: '요구사항',
    text: '프로젝트 요청과 진행 상태, 기획 자료와 첨부파일을 관리합니다.',
  },
  {
    href: '/admin/inquiries',
    icon: MessageSquareText,
    title: '문의 관리',
    text: '접수된 상담 내용을 확인하고 처리 상태를 관리합니다.',
  },
  {
    href: '/admin/content',
    icon: FilePenLine,
    title: '콘텐츠 관리',
    text: '제품, 설치사례, FAQ와 사이트 기본정보를 관리합니다.',
  },
  {
    href: '/admin/profile',
    icon: UserRound,
    title: '담당자 정보',
    text: '신재훈 과장의 소개, 연락처와 프로필 사진을 관리합니다.',
  },
  {
    href: '/admin/models',
    icon: MonitorCog,
    title: '제품 사양·가격',
    text: '조달 모델의 사양과 가격을 관리하고 Excel로 내보냅니다.',
  },
  {
    href: '/admin/utm',
    icon: Link2,
    title: 'UTM 링크 생성',
    text: '광고, QR, 이메일용 추적 링크를 같은 규칙으로 만듭니다.',
  },
  {
    href: '/admin/seo',
    icon: Search,
    title: 'SEO 관리',
    text: '검색 결과 제목, 설명, 키워드와 공유 이미지를 관리합니다.',
  },
];
export default function AdminDashboardPage() {
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState('');
  useEffect(() => {
    void fetch('/api/admin/session')
      .then(async (r) => {
        const d = (await r.json()) as { authenticated?: boolean };
        if (!d.authenticated) {
          location.replace('/admin/login');
          return;
        }
        try {
          const response = await fetch('/api/admin/dashboard-stats', {
            cache: 'no-store',
          });
          const data = (await response.json()) as DashboardStats & {
            message?: string;
          };
          if (!response.ok)
            throw new Error(data.message || '통계를 불러오지 못했습니다.');
          setStats(data);
        } catch (error) {
          setStatsError(
            error instanceof Error
              ? error.message
              : '통계를 불러오지 못했습니다.',
          );
        }
        setReady(true);
      })
      .catch(() => location.replace('/admin/login'));
  }, []);
  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    location.replace('/admin/login');
  }
  if (!ready)
    return (
      <main className="admin-gate">
        <p>관리자 권한을 확인하고 있습니다.</p>
      </main>
    );
  const formatCount = (value: number | undefined) =>
    value === undefined ? '-' : new Intl.NumberFormat('ko-KR').format(value);
  const overview = [
    {
      label: '오늘 방문자',
      value: stats?.visitors.today,
      icon: CalendarDays,
      tone: 'visitor',
      unit: '명',
    },
    {
      label: '누적 방문자',
      value: stats?.visitors.total,
      icon: UsersRound,
      tone: 'visitor',
      unit: '명',
    },
    {
      label: '오늘 문의',
      value: stats?.inquiries.today,
      icon: MessageSquareText,
      tone: 'inquiry-tone',
      unit: '건',
    },
    {
      label: '누적 문의',
      value: stats?.inquiries.total,
      icon: ClipboardList,
      tone: 'inquiry-tone',
      unit: '건',
    },
  ];
  return (
    <main className="admin-dashboard">
      <header>
        <div>
          <small>OIC KOREA</small>
          <h1>관리자 페이지</h1>
          <p>관리할 항목을 선택하세요.</p>
        </div>
        <span>
          <Link href="/">사이트 보기</Link>
          <button onClick={() => void logout()}>
            <LogOut />
            로그아웃
          </button>
        </span>
      </header>
      <section
        className="admin-overview"
        aria-labelledby="admin-overview-title"
      >
        <header>
          <div>
            <small>DAILY OVERVIEW</small>
            <h2 id="admin-overview-title">접속 및 문의 현황</h2>
          </div>
          <div className="admin-overview-actions">
            <span>{stats?.asOfDate || '한국시간 기준'}</span>
            <Link href="/admin/analytics">
              집계 상세보기 <ArrowRight />
            </Link>
          </div>
        </header>
        <div className="admin-overview-grid">
          {overview.map((item) => {
            const Icon = item.icon;
            return (
              <article className={item.tone} key={item.label}>
                <div>
                  <Icon />
                </div>
                <span>{item.label}</span>
                <strong>{formatCount(item.value)}</strong>
                <small>{item.unit}</small>
              </article>
            );
          })}
        </div>
        {statsError ? (
          <p className="admin-overview-error">{statsError}</p>
        ) : (
          <p className="admin-overview-note">
            방문자는 브라우저별 고유 식별자를 기준으로 집계하며 관리자 페이지는
            제외합니다. 방문자 누적은 집계 기능 적용 시점부터 시작하며, 문의는
            정상 접수되어 저장된 건수를 표시합니다.
          </p>
        )}
      </section>
      <section className="admin-management-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link href={card.href} key={card.href}>
              <div className="admin-dashboard-icon">
                <Icon />
              </div>
              <small>MANAGEMENT</small>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <strong>
                {card.title} 열기 <ArrowRight />
              </strong>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
