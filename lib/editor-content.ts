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
      return `<img${loading}${decoding}${attributes}>`;
    },
  );
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
