import { cloudflareEnv } from './cloudflare-env';
import {
  IMAGE_VARIANT_WIDTHS,
  imageVariantKey,
  type ImageVariantWidth,
} from './responsive-images';

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export type UploadScope = 'content' | 'inquiry';
export type UploadImageVariants = Partial<Record<ImageVariantWidth, File>>;

function extension(name: string) {
  return (name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '').toLowerCase();
}

export async function saveUpload(
  file: File,
  scope: UploadScope,
  inquiryId: number | null = null,
  imageVariants: UploadImageVariants = {},
) {
  if (!allowedTypes.has(file.type))
    throw new Error('허용되지 않는 파일 형식입니다.');
  if (scope === 'content' && !file.type.startsWith('image/')) {
    throw new Error('콘텐츠에는 이미지 파일만 업로드할 수 있습니다.');
  }
  if (scope === 'inquiry' && file.size > 10 * 1024 * 1024) {
    throw new Error('문의 첨부파일은 파일당 10MB 이하만 업로드할 수 있습니다.');
  }
  if (scope === 'inquiry' && !Number.isInteger(inquiryId)) {
    throw new Error('문의 정보가 올바르지 않습니다.');
  }

  const { DB, FILES } = cloudflareEnv();
  const prefix = scope === 'inquiry' ? 'private/inquiries' : 'uploads';
  const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension(file.name)}`;
  const variants =
    scope === 'content'
      ? IMAGE_VARIANT_WIDTHS.flatMap((width) => {
          const variant = imageVariants[width];
          return variant ? [{ width, file: variant }] : [];
        })
      : [];
  const storedKeys = [
    key,
    ...variants.map(({ width }) => imageVariantKey(key, width)),
  ];
  try {
    await FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
      customMetadata: { originalName: encodeURIComponent(file.name) },
    });
    for (const variant of variants) {
      const variantKey = imageVariantKey(key, variant.width);
      await FILES.put(variantKey, variant.file.stream(), {
        httpMetadata: { contentType: 'image/webp' },
        customMetadata: {
          originalName: encodeURIComponent(variant.file.name),
          variantOf: key,
          width: String(variant.width),
        },
      });
    }
    const result = await DB.prepare(
      `INSERT INTO content_assets
       (object_key,original_name,content_type,size_bytes,inquiry_id)
       VALUES (?,?,?,?,?)`,
    )
      .bind(
        key,
        file.name,
        file.type || 'application/octet-stream',
        file.size,
        inquiryId,
      )
      .run();
    return {
      id: result.meta.last_row_id,
      object_key: key,
      original_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      inquiry_id: inquiryId,
      url:
        scope === 'inquiry'
          ? `/api/admin/assets/${key}`
          : `/api/uploads/${key}`,
      variant_widths: variants.map(({ width }) => width),
    };
  } catch (error) {
    await Promise.all(storedKeys.map((storedKey) => FILES.delete(storedKey)));
    throw error;
  }
}

export async function deleteUpload(key: string) {
  const { DB, FILES } = cloudflareEnv();
  await Promise.all([
    FILES.delete(key),
    ...IMAGE_VARIANT_WIDTHS.map((width) =>
      FILES.delete(imageVariantKey(key, width)),
    ),
  ]);
  await DB.prepare('DELETE FROM content_assets WHERE object_key=?')
    .bind(key)
    .run();
}

export async function uploadResponse(
  key: string,
  isPrivate: boolean,
  width: ImageVariantWidth | null = null,
) {
  const files = cloudflareEnv().FILES;
  const variantKey = width ? imageVariantKey(key, width) : null;
  const variant = variantKey ? await files.get(variantKey) : null;
  const object = variant ?? (await files.get(key));
  if (!object) return new Response('파일이 없습니다.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set(
    'cache-control',
    isPrivate ? 'private, no-store' : 'public, max-age=31536000, immutable',
  );
  if (isPrivate) headers.set('content-disposition', 'inline');
  if (!isPrivate)
    headers.set('x-oic-image-source', variant ? `w${width}` : 'original');
  return new Response(object.body, { headers });
}
