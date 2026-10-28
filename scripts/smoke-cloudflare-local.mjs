import sharp from 'sharp';

try {
  process.loadEnvFile?.('.env.local');
} catch (error) {
  if (!(error && typeof error === 'object' && error.code === 'ENOENT'))
    throw error;
}

const origin = process.env.LOCAL_ORIGIN || 'http://localhost:3000';
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const json = async (response) => {
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || `${response.status} 요청 실패`);
  return data;
};

const home = await fetch(origin);
assert(home.ok, '메인 페이지를 열 수 없습니다.');

const content = await json(await fetch(`${origin}/api/content`));
assert(Array.isArray(content.items), '콘텐츠 응답이 올바르지 않습니다.');
const contentResponse = await fetch(`${origin}/api/content?type=site`);
assert(
  contentResponse.headers.get('cache-control')?.includes('no-store'),
  '콘텐츠 API의 캐시 방지 헤더가 없습니다.',
);

const login = await fetch(`${origin}/api/admin/session`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    id: process.env.ADMIN_LOGIN_ID,
    password: process.env.ADMIN_LOGIN_PASSWORD,
  }),
});
assert(login.ok, '관리자 로그인에 실패했습니다.');
const cookie = login.headers.get('set-cookie')?.split(';')[0];
assert(cookie, '관리자 로그인 쿠키가 없습니다.');
const authHeaders = { cookie };

const session = await json(
  await fetch(`${origin}/api/admin/session`, { headers: authHeaders }),
);
assert(session.authenticated, '관리자 세션 확인에 실패했습니다.');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const webp = await sharp(png).webp().toBuffer();
const form = new FormData();
form.set(
  'file',
  new File([png], 'cloudflare-local-smoke.png', { type: 'image/png' }),
);
form.set(
  'variant_480',
  new File([webp], 'cloudflare-local-smoke-480.webp', {
    type: 'image/webp',
  }),
);
const uploaded = await json(
  await fetch(`${origin}/api/uploads`, {
    method: 'POST',
    headers: authHeaders,
    body: form,
  }),
);
const image = await fetch(`${origin}${uploaded.url}`);
assert(
  image.ok && image.headers.get('content-type') === 'image/png',
  'R2 이미지 조회에 실패했습니다.',
);
const responsiveImage = await fetch(`${origin}${uploaded.url}?w=480`);
assert(
  responsiveImage.ok &&
    responsiveImage.headers.get('content-type') === 'image/webp' &&
    responsiveImage.headers.get('x-oic-image-source') === 'w480',
  'R2 반응형 이미지 조회에 실패했습니다.',
);
const fallbackImage = await fetch(`${origin}${uploaded.url}?w=960`);
assert(
  fallbackImage.ok &&
    fallbackImage.headers.get('content-type') === 'image/png' &&
    fallbackImage.headers.get('x-oic-image-source') === 'original',
  '파생 이미지가 없을 때 원본 대체 표시에 실패했습니다.',
);
const profileMarker = `로컬 검증 담당자 ${Date.now()}`;
const createdProfile = await json(
  await fetch(`${origin}/api/content`, {
    method: 'POST',
    headers: { ...authHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'site',
      slug: `cloudflare-local-profile-${Date.now()}`,
      title: '로컬 담당자 검증',
      sort_order: -999,
      published: true,
      data: {
        consultantName: profileMarker,
        consultantImage: uploaded.url,
      },
    }),
  }),
);
const updatedProfile = await json(
  await fetch(`${origin}/api/content/${createdProfile.id}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      ...createdProfile,
      data: {
        ...createdProfile.data,
        consultantRole: '로컬 수정 검증',
      },
    }),
  }),
);
const profilePage = await fetch(`${origin}/people/shin-jaehoon`);
const profileHtml = await profilePage.text();
assert(
  profilePage.ok &&
    profileHtml.includes(profileMarker) &&
    profileHtml.includes('로컬 수정 검증') &&
    profileHtml.includes(uploaded.url) &&
    profileHtml.includes('?w=480'),
  '담당자 정보 수정 또는 공개 페이지 반영에 실패했습니다.',
);
const refreshedHome = await fetch(origin);
assert(
  refreshedHome.ok && (await refreshedHome.text()).includes(profileMarker),
  '담당자 정보가 메인 페이지 서버 렌더링에 반영되지 않았습니다.',
);
assert(
  (
    await fetch(`${origin}/api/content/${updatedProfile.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    })
  ).ok,
  '담당자 정보 테스트 데이터 정리에 실패했습니다.',
);
const removedImage = await fetch(`${origin}${uploaded.url}`, {
  method: 'DELETE',
  headers: authHeaders,
});
assert(removedImage.ok, 'R2 테스트 이미지 정리에 실패했습니다.');
assert(
  (await fetch(`${origin}${uploaded.url}?w=480`)).status === 404,
  'R2 반응형 테스트 이미지 정리에 실패했습니다.',
);

const marker = `cloudflare-local-${Date.now()}`;
const rejectedInquiry = await fetch(`${origin}/api/inquiries`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: '동의 누락 검증',
    organization: 'OIC 테스트',
    contact: marker,
    inquiryCategory: '행정홍보안내',
    message: '개인정보 동의가 없으면 저장되면 안 됩니다.',
    attribution: '{}',
  }),
});
assert(
  rejectedInquiry.status === 400,
  '개인정보 동의 누락 요청이 거부되지 않았습니다.',
);
const inquiry = await fetch(`${origin}/api/inquiries`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: '로컬 검증',
    organization: 'OIC 테스트',
    contact: marker,
    inquiryCategory: '교육환경개선',
    message: 'D1 문의 저장 검증용 데이터입니다.',
    privacyConsent: 'agreed',
    attribution: '{}',
  }),
});
assert(inquiry.ok, 'D1 문의 저장에 실패했습니다.');

const inquiries = await json(
  await fetch(`${origin}/api/inquiries`, { headers: authHeaders }),
);
const testInquiry = inquiries.inquiries.find((item) => item.contact === marker);
assert(testInquiry, '저장한 D1 문의를 다시 찾지 못했습니다.');
assert(
  testInquiry.inquiry_category === '교육환경개선',
  '문의 카테고리가 D1에 저장되지 않았습니다.',
);

const exported = await fetch(`${origin}/api/inquiries/export`, {
  headers: authHeaders,
});
assert(
  exported.ok &&
    exported.headers.get('content-type')?.includes('spreadsheetml') &&
    (await exported.arrayBuffer()).byteLength > 0,
  '문의 엑셀 생성에 실패했습니다.',
);

const removedInquiry = await fetch(
  `${origin}/api/inquiries?id=${testInquiry.id}`,
  { method: 'DELETE', headers: authHeaders },
);
assert(removedInquiry.ok, 'D1 테스트 문의 정리에 실패했습니다.');

console.log(
  JSON.stringify({
    home: home.status,
    content_items: content.items.length,
    migrated_inquiries: inquiries.inquiries.length - 1,
    admin_login: true,
    r2_upload_read_delete: true,
    r2_responsive_variant_and_fallback: true,
    profile_create_update_render_delete: true,
    d1_inquiry_create_read_delete: true,
    privacy_consent_required: true,
    excel_export: true,
  }),
);
