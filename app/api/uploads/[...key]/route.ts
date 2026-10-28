import { isAdminAuthenticated } from '@/lib/admin-auth';
import { deleteUpload, uploadResponse } from '@/lib/object-storage';
import { parseImageVariantWidth } from '@/lib/responsive-images';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  if (key[0] === 'private')
    return Response.json({ message: '접근할 수 없습니다.' }, { status: 403 });
  const width = parseImageVariantWidth(
    new URL(request.url).searchParams.get('w'),
  );
  return uploadResponse(key.join('/'), false, width);
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
