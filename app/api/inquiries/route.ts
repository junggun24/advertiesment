import { isAdminAuthenticated } from '@/lib/admin-auth';
import { dbApi } from '@/lib/db-api';
import { normalizeAttribution } from '@/lib/inquiry-attribution';
import { saveUpload } from '@/lib/object-storage';

export async function POST(request: Request) {
  const isMultipart=request.headers.get('content-type')?.includes('multipart/form-data');
  const form=isMultipart?await request.formData():null;
  const body=form?Object.fromEntries(form.entries()):await request.json() as Record<string, unknown>;
  const files=form?form.getAll('files').filter((value):value is File=>value instanceof File&&value.size>0):[];
  const asText=(value:unknown)=>typeof value==='string'?value:'';
  const name = asText(body.name).trim();
  const organization = asText(body.organization).trim();
  const contact = asText(body.contact).trim();
  const message = asText(body.message).trim();
  let rawAttribution:unknown = {};
  try { rawAttribution=JSON.parse(asText(body.attribution)||'{}'); } catch { rawAttribution={}; }
  const attribution=normalizeAttribution(rawAttribution,{referrer:request.headers.get('referer')??'',userAgent:request.headers.get('user-agent')??''});

  if (!name || !organization || !contact || !message) {
    return Response.json({ ok:false, message:'필수 정보를 모두 입력해 주세요.' }, { status:400 });
  }
  if (name.length > 40 || organization.length > 100 || contact.length > 40 || message.length > 2000) {
    return Response.json({ ok:false, message:'입력 가능한 글자 수를 초과했습니다.' }, { status:400 });
  }
  const allowed=['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'];
  if(files.length>5)return Response.json({message:'첨부파일은 최대 5개까지 가능합니다.'},{status:400});
  if(files.some(file=>file.size>10*1024*1024))return Response.json({message:'파일 한 개당 최대 크기는 10MB입니다.'},{status:400});
  if(files.some(file=>!allowed.includes(file.type)))return Response.json({message:'지원하지 않는 첨부파일 형식입니다.'},{status:400});

  try {
    const inquiry=await dbApi('/inquiries', { method:'POST', body:JSON.stringify({ name, organization, contact, message, attribution }) }) as {id:number};
    try{for(const file of files)await saveUpload(file,'inquiry',inquiry.id)}
    catch(error){await dbApi(`/inquiries/${inquiry.id}`,{method:'DELETE'});throw error}
    return Response.json({ ok:true });
  } catch (error) {
    return Response.json({ message:error instanceof Error ? error.message : '문의 접수에 실패했습니다.' }, { status:503 });
  }
}

export async function GET(request:Request) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  try { return Response.json(await dbApi('/inquiries')); }
  catch (error) { return Response.json({ message:error instanceof Error ? error.message : '문의를 불러오지 못했습니다.' }, { status:503 }); }
}

export async function PATCH(request:Request) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  const body = await request.json() as Record<string,unknown>;
  const id = Number(body.id);
  const status = typeof body.status==='string'?body.status:'';
  const assignee = (typeof body.assignee==='string'?body.assignee:'').trim().slice(0,80);
  const memo = (typeof body.memo==='string'?body.memo:'').trim().slice(0,2000);
  if (!Number.isInteger(id) || !['new','contacting','quoted','contracted','closed'].includes(status)) {
    return Response.json({ message:'올바르지 않은 요청입니다.' }, { status:400 });
  }
  try {
    await dbApi(`/inquiries/${id}`, { method:'PATCH', body:JSON.stringify({ status, assignee, memo }) });
    return Response.json({ ok:true });
  } catch (error) {
    return Response.json({ message:error instanceof Error ? error.message : '문의를 수정하지 못했습니다.' }, { status:503 });
  }
}

export async function DELETE(request:Request) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return Response.json({ message:'올바르지 않은 문의입니다.' }, { status:400 });
  try { await dbApi(`/inquiries/${id}`, { method:'DELETE' }); return Response.json({ ok:true }); }
  catch (error) { return Response.json({ message:error instanceof Error ? error.message : '문의를 삭제하지 못했습니다.' }, { status:503 }); }
}
