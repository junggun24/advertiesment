'use client';

import {
  imageVariantWidthsFor,
  type ImageVariantWidth,
} from './responsive-images';

const MAX_IMAGE_DIMENSION = 2400;
const WEBP_QUALITY = 0.86;

export type PreparedImageUpload = {
  original: File;
  variants: Partial<Record<ImageVariantWidth, File>>;
};

async function renderWebp(
  bitmap: ImageBitmap,
  width: number,
  name: string,
  lastModified: number,
) {
  const scale = Math.min(1, width / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
  );
  return blob
    ? new File([blob], `${name}.webp`, {
        type: 'image/webp',
        lastModified,
      })
    : null;
}

export async function prepareImageUpload(
  file: File,
): Promise<PreparedImageUpload> {
  if (file.type === 'image/gif' || !file.type.startsWith('image/'))
    return { original: file, variants: {} };
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const name = file.name.replace(/\.[^.]+$/, '');
    const originalWebp = await renderWebp(
      bitmap,
      Math.min(MAX_IMAGE_DIMENSION, bitmap.width),
      name,
      file.lastModified,
    );
    const variants: PreparedImageUpload['variants'] = {};
    for (const width of imageVariantWidthsFor(bitmap.width)) {
      const variant = await renderWebp(
        bitmap,
        width,
        `${name}-${width}`,
        file.lastModified,
      );
      if (variant) variants[width] = variant;
    }
    return {
      original:
        originalWebp && originalWebp.size < file.size ? originalWebp : file,
      variants,
    };
  } catch {
    return { original: file, variants: {} };
  } finally {
    bitmap?.close();
  }
}

export function imageUploadFormData(prepared: PreparedImageUpload) {
  const form = new FormData();
  form.set('file', prepared.original);
  for (const [width, file] of Object.entries(prepared.variants))
    if (file) form.set(`variant_${width}`, file);
  return form;
}
