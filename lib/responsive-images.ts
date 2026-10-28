export const IMAGE_VARIANT_WIDTHS = [480, 960, 1440] as const;

export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];

export function imageVariantKey(key: string, width: ImageVariantWidth) {
  const slash = key.lastIndexOf('/');
  const dot = key.lastIndexOf('.');
  const stem = dot > slash ? key.slice(0, dot) : key;
  return `${stem}@${width}.webp`;
}

export function parseImageVariantWidth(value: string | null) {
  const width = Number(value);
  return IMAGE_VARIANT_WIDTHS.find((candidate) => candidate === width) ?? null;
}

export function imageVariantWidthsFor(sourceWidth: number) {
  return IMAGE_VARIANT_WIDTHS.filter((width) => width < sourceWidth);
}

export function isResponsiveUploadUrl(value: string) {
  if (value.startsWith('/api/uploads/')) return true;
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.pathname.startsWith('/api/uploads/')
    );
  } catch {
    return false;
  }
}

export function responsiveImageSrcSet(value: string) {
  if (!isResponsiveUploadUrl(value)) return '';
  const separator = value.includes('?') ? '&' : '?';
  return IMAGE_VARIANT_WIDTHS.map(
    (width) => `${value}${separator}w=${width} ${width}w`,
  ).join(', ');
}
