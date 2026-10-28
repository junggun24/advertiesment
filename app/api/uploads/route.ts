import { isAdminAuthenticated } from '@/lib/admin-auth';
import { saveUpload } from '@/lib/object-storage';
import {
  IMAGE_VARIANT_WIDTHS,
  type ImageVariantWidth,
} from '@/lib/responsive-images';

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated(request)))
    return Response.json(
      { message: '관리자 로그인이 필요합니다.' },
      { status: 401 },
    );
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File))
    return Response.json(
      { message: '이미지를 선택해 주세요.' },
      { status: 400 },
    );
  if (!file.type.startsWith('image/'))
    return Response.json(
      { message: '이미지 파일만 업로드할 수 있습니다.' },
      { status: 400 },
    );
  const variants: Partial<Record<ImageVariantWidth, File>> = {};
  for (const width of IMAGE_VARIANT_WIDTHS) {
    const variant = form.get(`variant_${width}`);
    if (variant == null) continue;
    if (!(variant instanceof File) || variant.type !== 'image/webp')
      return Response.json(
        { message: `${width}px 변형 이미지가 올바르지 않습니다.` },
        { status: 400 },
      );
    variants[width] = variant;
  }
  try {
    return Response.json(await saveUpload(file, 'content', null, variants), {
      status: 201,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : '이미지를 업로드하지 못했습니다.',
      },
      { status: 400 },
    );
  }
}
