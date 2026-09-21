import { dbApi } from '@/lib/db-api';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { normalizeEditorPayload } from '@/lib/editor-content';
import { notifyContentIndexNow } from '@/lib/indexnow';

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get('type');
  try {
    const data = await dbApi(`/content${type ? `?type=${encodeURIComponent(type)}` : ''}`);
    return Response.json(data);
  } catch (error) {
    return Response.json({ message:error instanceof Error ? error.message : '콘텐츠를 불러오지 못했습니다.' }, { status:503 });
  }
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated(request)) return Response.json({ message:'관리자 로그인이 필요합니다.' }, { status:401 });
  try {
    const result=await dbApi('/content', { method:'POST', body:JSON.stringify(normalizeEditorPayload(await request.json())) });
    await notifyContentIndexNow(result);
    return Response.json(result, { status:201 });
  } catch (error) {
    return Response.json({ message:error instanceof Error ? error.message : '콘텐츠를 저장하지 못했습니다.' }, { status:400 });
  }
}
