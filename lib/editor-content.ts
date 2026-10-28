import { responsiveImageSrcSet } from './responsive-images.ts';

type ImageContent = { thumbnail?: unknown; body?: unknown; image?: unknown };
export function extractFirstImage(html?: string) {
  const src = html
    ?.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]
    ?.trim();
  return src && isSafeImageUrl(src) ? src : '';
}
export function resolveContentImage(content: ImageContent) {
  return (
    safeImage(content.thumbnail) ||
    extractFirstImage(text(content.body)) ||
    safeImage(content.image)
  );
}
export function prepareEditorHtml(value?: string) {
  return (value ?? '').replace(
    /<img\b([^>]*)>/gi,
    (_tag, attributes: string) => {
      const loading = /\bloading\s*=/i.test(attributes)
        ? ''
        : ' loading="lazy"';
      const decoding = /\bdecoding\s*=/i.test(attributes)
        ? ''
        : ' decoding="async"';
      const source = attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      const srcSet = source ? responsiveImageSrcSet(source) : '';
      const responsive =
        srcSet && !/\bsrcset\s*=/i.test(attributes)
          ? ` srcset="${escapeAttribute(srcSet)}"${/\bsizes\s*=/i.test(attributes) ? '' : ' sizes="(max-width: 800px) 100vw, 800px"'}`
          : '';
      return `<img${loading}${decoding}${responsive}${attributes}>`;
    },
  );
}
function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function safeImage(value?: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return isSafeImageUrl(normalized) ? normalized : '';
}
function text(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}
function isSafeImageUrl(value: string) {
  return value.startsWith('/') || /^https?:\/\//i.test(value);
}
