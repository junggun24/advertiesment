import { env } from 'cloudflare:workers';
import { createInquiriesTable, createInquiryStatusIndex } from '@/db/schema';

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

  const db = env.DB;
  await db.batch([
    db.prepare(createInquiriesTable),
    db.prepare(createInquiryStatusIndex),
  ]);
  await db.prepare(
    'INSERT INTO inquiries (name, organization, contact, message) VALUES (?, ?, ?, ?)'
  ).bind(name, organization, contact, message).run();

  return Response.json({ ok:true });
}
