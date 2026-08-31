import { env } from 'cloudflare:workers';
import { createInquiriesTable, createInquiryStatusIndex } from '@/db/schema';

async function ensureSchema() {
  const db = env.DB;
  await db.batch([db.prepare(createInquiriesTable), db.prepare(createInquiryStatusIndex)]);
  const info = await db.prepare('PRAGMA table_info(inquiries)').all<{ name:string }>();
  const columns = new Set(info.results.map(row=>row.name));
  if (!columns.has('assignee')) await db.prepare("ALTER TABLE inquiries ADD COLUMN assignee TEXT NOT NULL DEFAULT ''").run();
  if (!columns.has('memo')) await db.prepare("ALTER TABLE inquiries ADD COLUMN memo TEXT NOT NULL DEFAULT ''").run();
  if (!columns.has('updated_at')) await db.prepare("ALTER TABLE inquiries ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''").run();
}

function canManage(request:Request) {
  const url = new URL(request.url);
  return url.hostname === 'localhost' || Boolean(request.headers.get('oai-authenticated-user-id'));
}

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const name = String(body.name ?? '').trim();
  const organization = String(body.organization ?? '').trim();
  const contact = String(body.contact ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || !organization || !contact || !message) {
    return Response.json({ ok:false, message:'필수 정보를 모두 입력해 주세요.' }, { status:400 });
  }
  if (name.length > 40 || organization.length > 100 || contact.length > 40 || message.length > 2000) {
    return Response.json({ ok:false, message:'입력 가능한 글자 수를 초과했습니다.' }, { status:400 });
  }

  await ensureSchema();
  await env.DB.prepare(
    'INSERT INTO inquiries (name, organization, contact, message) VALUES (?, ?, ?, ?)'
  ).bind(name, organization, contact, message).run();

  return Response.json({ ok:true });
}

export async function GET(request:Request) {
  if (!canManage(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  await ensureSchema();
  const rows = await env.DB.prepare(
    'SELECT id, name, organization, contact, message, status, assignee, memo, created_at, updated_at FROM inquiries ORDER BY created_at DESC'
  ).all();
  return Response.json({ inquiries:rows.results });
}

export async function PATCH(request:Request) {
  if (!canManage(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  const body = await request.json() as Record<string,unknown>;
  const id = Number(body.id);
  const status = String(body.status ?? '');
  const assignee = String(body.assignee ?? '').trim().slice(0,80);
  const memo = String(body.memo ?? '').trim().slice(0,2000);
  if (!Number.isInteger(id) || !['new','contacting','quoted','contracted','closed'].includes(status)) {
    return Response.json({ message:'올바르지 않은 요청입니다.' }, { status:400 });
  }
  await ensureSchema();
  await env.DB.prepare(
    "UPDATE inquiries SET status = ?, assignee = ?, memo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(status, assignee, memo, id).run();
  return Response.json({ ok:true });
}
