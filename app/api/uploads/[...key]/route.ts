import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deleteUpload, uploadResponse } from '@/lib/object-storage';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  if (key[0] === 'private')
    return Response.json({ message: '접근할 수 없습니다.' }, { status: 403 });
  return uploadResponse(key.join('/'), false);
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  const { key } = await params;
  await deleteUpload(key.join('/'));
  return Response.json({ ok: true });
}
