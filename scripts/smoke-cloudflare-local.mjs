process.loadEnvFile?.('.env.local');

const origin = process.env.LOCAL_ORIGIN || 'http://localhost:3000';
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const json = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `${response.status} 요청 실패`);
  return data;
};

const home = await fetch(origin);
assert(home.ok, '메인 페이지를 열 수 없습니다.');

const content = await json(await fetch(`${origin}/api/content`));
assert(Array.isArray(content.items), '콘텐츠 응답이 올바르지 않습니다.');

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
const form = new FormData();
form.set('file', new File([png], 'cloudflare-local-smoke.png', { type: 'image/png' }));
const uploaded = await json(
  await fetch(`${origin}/api/uploads`, {
    method: 'POST',
    headers: authHeaders,
    body: form,
  }),
);
const image = await fetch(`${origin}${uploaded.url}`);
assert(image.ok && image.headers.get('content-type') === 'image/png', 'R2 이미지 조회에 실패했습니다.');
const removedImage = await fetch(`${origin}${uploaded.url}`, {
  method: 'DELETE',
  headers: authHeaders,
});
assert(removedImage.ok, 'R2 테스트 이미지 정리에 실패했습니다.');

const marker = `cloudflare-local-${Date.now()}`;
const inquiry = await fetch(`${origin}/api/inquiries`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: '로컬 검증',
    organization: 'OIC 테스트',
    contact: marker,
    message: 'D1 문의 저장 검증용 데이터입니다.',
    attribution: '{}',
  }),
});
assert(inquiry.ok, 'D1 문의 저장에 실패했습니다.');

const inquiries = await json(
  await fetch(`${origin}/api/inquiries`, { headers: authHeaders }),
);
const testInquiry = inquiries.inquiries.find((item) => item.contact === marker);
assert(testInquiry, '저장한 D1 문의를 다시 찾지 못했습니다.');

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
    d1_inquiry_create_read_delete: true,
    excel_export: true,
  }),
);
