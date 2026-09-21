'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const ATTRIBUTION_KEY = 'oic-inquiry-attribution-v2';
const SESSION_TIMEOUT = 30 * 60 * 1000;
const PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'gbraid',
  'wbraid',
  'dclid',
  'fbclid',
  'msclkid',
  'ttclid',
  'n_query',
  'n_keyword',
  'n_campaign_type',
  'n_ad_group',
  'n_ad',
  'kakao_ad',
  'campaign_id',
];

type Touch = Record<string, string>;
type JourneyPage = { path: string; enteredAt: string; durationSeconds: number };
type JourneyEvent = { type: string; label: string; path: string; at: string };
type StoredAttribution = {
  firstTouch?: Touch;
  lastTouch?: Touch;
  firstVisitedAt?: string;
  lastVisitedAt?: string;
  pageViewCount?: number;
  sessionCount?: number;
  sessionId?: string;
  sessionStartedAt?: string;
  lastActivityAt?: string;
  sessionPageViewCount?: number;
  pages?: JourneyPage[];
  events?: JourneyEvent[];
};

function read(): StoredAttribution {
  try {
    return JSON.parse(
      localStorage.getItem(ATTRIBUTION_KEY) || '{}',
    ) as StoredAttribution;
  } catch {
    return {};
  }
}
function write(value: StoredAttribution) {
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
}
function page() {
  return `${location.pathname}${location.search}`.slice(0, 1000);
}
function externalReferrer() {
  try {
    return document.referrer &&
      new URL(document.referrer).host !== location.host
      ? document.referrer
      : '';
  } catch {
    return '';
  }
}
function touch(): Touch {
  const params = new URLSearchParams(location.search);
  const result: Touch = {
    landingPage: page(),
    referrer: externalReferrer(),
    capturedAt: new Date().toISOString(),
  };
  for (const key of PARAMS) {
    const value = params.get(key);
    if (value) result[key] = value.slice(0, 500);
  }
  return result;
}
function closeLastPage(saved: StoredAttribution, now = Date.now()) {
  const pages = saved.pages || [];
  const last = pages.at(-1);
  if (last && last.durationSeconds === 0) {
    const entered = Date.parse(last.enteredAt);
    if (Number.isFinite(entered))
      last.durationSeconds = Math.max(
        0,
        Math.min(86400, Math.round((now - entered) / 1000)),
      );
  }
}
function recordEvent(type: string, label: string) {
  const saved = read();
  const events = saved.events || [];
  events.push({
    type,
    label: label.trim().slice(0, 120),
    path: page(),
    at: new Date().toISOString(),
  });
  saved.events = events.slice(-100);
  saved.lastActivityAt = new Date().toISOString();
  write(saved);
}
export function trackInquiryEvent(type: string, label: string) {
  recordEvent(type, label);
}

export function currentAttribution() {
  const saved = read();
  const now = Date.now();
  closeLastPage(saved, now);
  const first = Date.parse(saved.firstVisitedAt || '');
  saved.lastVisitedAt = new Date(now).toISOString();
  write(saved);
  return {
    ...saved,
    submittedPage: page(),
    elapsedSeconds: Number.isFinite(first)
      ? Math.max(0, Math.round((now - first) / 1000))
      : 0,
    userAgent: navigator.userAgent,
  };
}

export function AttributionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const now = Date.now();
    const iso = new Date(now).toISOString();
    const saved = read();
    const lastActivity = Date.parse(saved.lastActivityAt || '');
    const newSession =
      !Number.isFinite(lastActivity) || now - lastActivity > SESSION_TIMEOUT;
    closeLastPage(saved, now);
    const currentTouch = touch();
    const hasSignal =
      PARAMS.some((key) => Boolean(currentTouch[key])) ||
      Boolean(currentTouch.referrer);
    if (!saved.firstTouch) {
      saved.firstTouch = currentTouch;
      saved.firstVisitedAt = iso;
    }
    if (newSession || hasSignal || !saved.lastTouch)
      saved.lastTouch = currentTouch;
    if (newSession) {
      saved.sessionId = crypto.randomUUID();
      saved.sessionStartedAt = iso;
      saved.sessionCount = (saved.sessionCount || 0) + 1;
      saved.sessionPageViewCount = 0;
    }
    saved.pageViewCount = (saved.pageViewCount || 0) + 1;
    saved.sessionPageViewCount = (saved.sessionPageViewCount || 0) + 1;
    saved.lastActivityAt = iso;
    saved.lastVisitedAt = iso;
    const pages = saved.pages || [];
    pages.push({ path: page(), enteredAt: iso, durationSeconds: 0 });
    saved.pages = pages.slice(-100);
    write(saved);

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest('a,button');
      if (!target) return;
      const label = (
        target.getAttribute('aria-label') ||
        target.textContent ||
        target.getAttribute('href') ||
        ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      const href = target.getAttribute('href') || '';
      if (href.startsWith('tel:')) recordEvent('phone_click', label || '전화');
      else if (/kakao|채널톡/i.test(`${href} ${label}`))
        recordEvent('chat_click', label);
      else if (/문의|견적|상담/.test(label) || href.startsWith('/inquiry'))
        recordEvent('cta_click', label || href);
    };
    const onInput = (event: Event) => {
      const form = (
        event.target as HTMLElement | null
      )?.closest<HTMLFormElement>('form.inquiry-form');
      if (!form || form.dataset.trackingStarted) return;
      form.dataset.trackingStarted = 'true';
      recordEvent('form_start', '문의 폼 입력 시작');
    };
    const onHide = () => {
      const latest = read();
      closeLastPage(latest);
      latest.lastActivityAt = new Date().toISOString();
      write(latest);
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('input', onInput, true);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('input', onInput, true);
      window.removeEventListener('pagehide', onHide);
      onHide();
    };
  }, [pathname]);
  return null;
}
