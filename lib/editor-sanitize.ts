import sanitizeHtml from 'sanitize-html';

const oldUploadOrigin = /https?:\/\/domob\.ddns\.net:8080\/api\/uploads\//gi;

export function sanitizeEditorHtml(value: string) {
  const normalized = value.replace(oldUploadOrigin, '/api/uploads/');
  return sanitizeHtml(normalized, {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'img',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'div',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attributes) => ({
        tagName: 'a',
        attribs: {
          ...attributes,
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      }),
    },
  });
}

export function normalizeEditorPayload(value: unknown) {
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  const data =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : {};
  if (record.type === 'product' || record.type === 'case')
    return {
      ...record,
      data: {
        ...data,
        body: sanitizeEditorHtml(
          typeof data.body === 'string' ? data.body : '',
        ),
        thumbnail:
          typeof data.thumbnail === 'string' ? data.thumbnail.trim() : '',
        modelIds: Array.isArray(data.modelIds)
          ? data.modelIds.map(Number).filter(Number.isInteger)
          : [],
      },
    };
  if (record.type === 'faq')
    return {
      ...record,
      data: {
        ...data,
        details: sanitizeEditorHtml(
          typeof data.details === 'string' ? data.details : '',
        ),
      },
    };
  return value;
}
