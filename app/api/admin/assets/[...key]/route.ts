import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deleteUpload, uploadResponse } from '@/lib/object-storage';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  const { key } = await params;
  if (key[0] !== 'private')
    return Response.json(
      { message: '올바르지 않은 파일입니다.' },
      { status: 400 },
    );
  return uploadResponse(key.join('/'), true);
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
  if (key[0] !== 'private')
    return Response.json(
      { message: '올바르지 않은 파일입니다.' },
      { status: 400 },
    );
  await deleteUpload(key.join('/'));
  return Response.json({ ok: true });
}
