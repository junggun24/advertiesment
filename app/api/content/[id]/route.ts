import { dbApi } from '@/lib/db-api';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { normalizeEditorPayload } from '@/lib/editor-content';
import { notifyContentIndexNow } from '@/lib/indexnow';

export async function PUT(request: Request, { params }:{ params:Promise<{id:string}> }) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  const { id } = await params;
  try {
    const result=await dbApi(`/content/${id}`, { method:'PUT', body:JSON.stringify(normalizeEditorPayload(await request.json())) });
    await notifyContentIndexNow(result);
    return Response.json(result);
  } catch (error) {
    return Response.json({ message:error instanceof Error ? error.message : '콘텐츠를 수정하지 못했습니다.' }, { status:400 });
  }
}

export async function DELETE(request: Request, { params }:{ params:Promise<{id:string}> }) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  const { id } = await params;
  try {
    const all=await dbApi('/content') as {items?:Array<{id:number;type?:unknown;slug?:unknown}>};
    const target=all.items?.find(item=>item.id===Number(id));
    const result=await dbApi(`/content/${id}`, { method:'DELETE' });
    if(target)await notifyContentIndexNow(target);
    return Response.json(result);
  } catch (error) {
    return Response.json({ message:error instanceof Error ? error.message : '콘텐츠를 삭제하지 못했습니다.' }, { status:400 });
  }
}
