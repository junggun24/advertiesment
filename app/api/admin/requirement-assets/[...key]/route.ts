import { isAdminAuthenticated } from '@/lib/admin-auth';
import { uploadResponse } from '@/lib/object-storage';

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
  if (key.length !== 1 || !/^[a-f0-9-]+\.[a-z0-9]+$/i.test(key[0]))
    return Response.json(
      { message: '올바르지 않은 파일입니다.' },
      { status: 400 },
    );
  return uploadResponse(`private/requirements/${key[0]}`, true);
}
