import { isAdminAuthenticated } from '@/lib/admin-auth';
import { dbApi } from '@/lib/db-api';

export async function POST(request: Request) {
  const isMultipart=request.headers.get('content-type')?.includes('multipart/form-data');
  const form=isMultipart?await request.formData():null;
  const body=form?Object.fromEntries(form.entries()):await request.json() as Record<string, unknown>;
  const files=form?form.getAll('files').filter((value):value is File=>value instanceof File&&value.size>0):[];
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
  const allowed=['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'];
  if(files.length>5)return Response.json({message:'첨부파일은 최대 5개까지 가능합니다.'},{status:400});
  if(files.some(file=>file.size>10*1024*1024))return Response.json({message:'파일 한 개당 최대 크기는 10MB입니다.'},{status:400});
  if(files.some(file=>!allowed.includes(file.type)))return Response.json({message:'지원하지 않는 첨부파일 형식입니다.'},{status:400});

  try {
    const inquiry=await dbApi('/inquiries', { method:'POST', body:JSON.stringify({ name, organization, contact, message }) }) as {id:number};
    for(const file of files){const response=await fetch(`http://127.0.0.1:3101/uploads?scope=inquiry&inquiryId=${inquiry.id}&filename=${encodeURIComponent(file.name)}`,{method:'POST',headers:{'content-type':file.type},body:await file.arrayBuffer()});if(!response.ok){await dbApi(`/inquiries/${inquiry.id}`,{method:'DELETE'});throw new Error((await response.json() as {message?:string}).message??'첨부파일 업로드에 실패했습니다.')}}
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
  const status = String(body.status ?? '');
  const assignee = String(body.assignee ?? '').trim().slice(0,80);
  const memo = String(body.memo ?? '').trim().slice(0,2000);
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
