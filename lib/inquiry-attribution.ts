export type InquiryAttribution = {
  inquiryChannel: string;
  sourceType: string;
  sourceName: string;
  campaign: string;
  adGroup: string;
  keyword: string;
  content: string;
  landingPage: string;
  submittedPage: string;
  referrer: string;
  deviceType: string;
  pageViewCount: number;
  firstVisitedAt: string;
  elapsedSeconds: number;
  lastSourceType: string;
  lastSourceName: string;
  lastCampaign: string;
  lastAdGroup: string;
  lastKeyword: string;
  lastContent: string;
  lastLandingPage: string;
  lastReferrer: string;
  sessionCount: number;
  sessionPageViewCount: number;
  lastVisitedAt: string;
  journey: { pages: unknown[]; events: unknown[] };
  qualityFlags: string[];
  raw: Record<string, unknown>;
};

const text = (value: unknown, max = 500) =>
  (typeof value === 'string' || typeof value === 'number' ? `${value}` : '')
    .trim()
    .slice(0, max);

function host(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function source(raw: Record<string, unknown>, fallbackReferrer: string) {
  const utmSource = text(raw.utm_source, 120).toLowerCase();
  const utmMedium = text(raw.utm_medium, 120).toLowerCase();
  const referrer = text(raw.referrer || fallbackReferrer, 1000);
  const referrerHost = host(referrer).toLowerCase();
  const paid =
    /cpc|ppc|paid|display|banner|retarget/.test(utmMedium) ||
    Boolean(
      [
        'gclid',
        'gbraid',
        'wbraid',
        'dclid',
        'fbclid',
        'msclkid',
        'ttclid',
        'n_query',
        'n_ad',
        'kakao_ad',
      ].some((key) => text(raw[key])),
    );

  if (paid) {
    if (
      text(raw.gclid) ||
      text(raw.gbraid) ||
      text(raw.wbraid) ||
      text(raw.dclid) ||
      utmSource.includes('google')
    )
      return { type: 'Ads', name: '구글 광고' };
    if (text(raw.fbclid) || /facebook|instagram|meta/.test(utmSource))
      return { type: 'Ads', name: '메타 광고' };
    if (text(raw.n_query) || /naver/.test(utmSource))
      return { type: 'Ads', name: '네이버 검색광고' };
    if (text(raw.msclkid) || /bing|microsoft/.test(utmSource))
      return { type: 'Ads', name: '마이크로소프트 광고' };
    if (text(raw.ttclid) || /tiktok/.test(utmSource))
      return { type: 'Ads', name: '틱톡 광고' };
    if (text(raw.kakao_ad) || /kakao|daum/.test(utmSource))
      return { type: 'Ads', name: '카카오 광고' };
    return { type: 'Ads', name: text(raw.utm_source, 120) || '기타 광고' };
  }
  if (/chatgpt|openai/.test(referrerHost))
    return { type: 'Organic', name: 'AI 검색 · ChatGPT' };
  if (/perplexity/.test(referrerHost))
    return { type: 'Organic', name: 'AI 검색 · Perplexity' };
  if (/gemini|bard/.test(referrerHost))
    return { type: 'Organic', name: 'AI 검색 · Gemini' };
  if (/google\./.test(referrerHost))
    return { type: 'Organic', name: '구글 검색' };
  if (/naver\./.test(referrerHost))
    return { type: 'Organic', name: '네이버 검색' };
  if (/daum\.|bing\./.test(referrerHost))
    return {
      type: 'Organic',
      name: referrerHost.includes('bing') ? '빙 검색' : '다음 검색',
    };
  if (/youtube\./.test(referrerHost))
    return { type: 'Organic', name: '유튜브' };
  if (/instagram\./.test(referrerHost))
    return { type: 'Organic', name: '인스타그램' };
  if (/facebook\./.test(referrerHost))
    return { type: 'Organic', name: '페이스북' };
  if (utmSource) return { type: 'Referral', name: text(raw.utm_source, 120) };
  if (referrerHost) return { type: 'Referral', name: referrerHost };
  return { type: 'Direct', name: '직접 연결' };
}

export function normalizeAttribution(
  value: unknown,
  fallback: { referrer?: string; userAgent?: string } = {},
): InquiryAttribution {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const nestedFirst =
    raw.firstTouch &&
    typeof raw.firstTouch === 'object' &&
    !Array.isArray(raw.firstTouch)
      ? (raw.firstTouch as Record<string, unknown>)
      : null;
  const nestedLast =
    raw.lastTouch &&
    typeof raw.lastTouch === 'object' &&
    !Array.isArray(raw.lastTouch)
      ? (raw.lastTouch as Record<string, unknown>)
      : null;
  const first = nestedFirst ?? raw;
  const last = nestedLast ?? first;
  const identified = source(
    first,
    nestedFirst ? '' : (fallback.referrer ?? ''),
  );
  const lastIdentified = source(last, '');
  const userAgent = text(
    raw.userAgent || fallback.userAgent,
    500,
  ).toLowerCase();
  const deviceType = /ipad|tablet/.test(userAgent)
    ? '태블릿'
    : /mobile|iphone|android/.test(userAgent)
      ? '모바일'
      : 'PC';
  const campaign = text(first.utm_campaign, 200);
  const landingPage = text(first.landingPage, 1000);
  const qualityFlags: string[] = [];
  if (identified.type === 'Ads' && !campaign)
    qualityFlags.push('광고 유입인데 캠페인 값이 없습니다.');
  if (!landingPage) qualityFlags.push('최초 랜딩 페이지가 없습니다.');
  if (identified.type === 'Unknown')
    qualityFlags.push('유입경로를 판정하지 못했습니다.');
  const pages = Array.isArray(raw.pages) ? raw.pages.slice(-100) : [];
  const events = Array.isArray(raw.events) ? raw.events.slice(-100) : [];
  return {
    inquiryChannel: '상담신청 폼',
    sourceType: identified.type,
    sourceName: identified.name,
    campaign,
    adGroup: text(first.ad_group || first.n_ad_group, 200),
    keyword: text(first.utm_term || first.n_keyword || first.n_query, 200),
    content: text(first.utm_content || first.n_ad, 200),
    landingPage,
    submittedPage: text(raw.submittedPage, 1000),
    referrer: text(
      first.referrer || (nestedFirst ? '' : fallback.referrer),
      1000,
    ),
    deviceType,
    pageViewCount: Math.max(1, Math.min(10000, Number(raw.pageViewCount) || 1)),
    firstVisitedAt: text(raw.firstVisitedAt, 60),
    elapsedSeconds: Math.max(
      0,
      Math.min(31_536_000, Number(raw.elapsedSeconds) || 0),
    ),
    lastSourceType: lastIdentified.type,
    lastSourceName: lastIdentified.name,
    lastCampaign: text(last.utm_campaign, 200),
    lastAdGroup: text(last.ad_group || last.n_ad_group, 200),
    lastKeyword: text(last.utm_term || last.n_keyword || last.n_query, 200),
    lastContent: text(last.utm_content || last.n_ad, 200),
    lastLandingPage: text(last.landingPage, 1000),
    lastReferrer: text(last.referrer, 1000),
    sessionCount: Math.max(1, Math.min(1000, Number(raw.sessionCount) || 1)),
    sessionPageViewCount: Math.max(
      1,
      Math.min(10000, Number(raw.sessionPageViewCount) || 1),
    ),
    lastVisitedAt: text(raw.lastVisitedAt, 60),
    journey: { pages, events },
    qualityFlags,
    raw,
  };
}
