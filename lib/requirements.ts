export type RequirementSpan = {
  text: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  code?: boolean;
  color?: string;
};

export type RequirementBlock = {
  id: string;
  type: string;
  richText: RequirementSpan[];
  checked?: boolean;
  asset?: { name: string; url: string };
  aspectRatio?: number;
  children?: RequirementBlock[];
};

export type Requirement = {
  id: number;
  source_id: string;
  title: string;
  creator: string;
  category: string;
  due_date: string;
  status: string;
  content: RequirementBlock[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const blockTypes = new Set([
  'text',
  'quote',
  'divider',
  'header',
  'sub_header',
  'sub_sub_header',
  'bulleted_list',
  'numbered_list',
  'to_do',
  'image',
  'file',
  'column_list',
  'column',
]);

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function safeHref(value: unknown) {
  const href = text(value, 2000);
  if (!href) return undefined;
  if (href.startsWith('/api/admin/requirement-assets/')) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? href
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeBlocks(value: unknown, depth = 0): RequirementBlock[] {
  if (!Array.isArray(value) || depth > 4) return [];
  return value.slice(0, 1000).map((item, index) => {
    const source =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const sourceAsset =
      source.asset && typeof source.asset === 'object'
        ? (source.asset as Record<string, unknown>)
        : null;
    const url = sourceAsset ? safeHref(sourceAsset.url) : undefined;
    const type = text(source.type, 40);
    return {
      id: text(source.id, 100) || crypto.randomUUID() || String(index),
      type: blockTypes.has(type) ? type : 'text',
      richText: Array.isArray(source.richText)
        ? source.richText.slice(0, 300).map((span) => {
            const rich =
              span && typeof span === 'object'
                ? (span as Record<string, unknown>)
                : {};
            return {
              text: text(rich.text, 10000),
              href: safeHref(rich.href),
              bold: rich.bold === true || undefined,
              italic: rich.italic === true || undefined,
              strike: rich.strike === true || undefined,
              code: rich.code === true || undefined,
              color: text(rich.color, 30) || undefined,
            };
          })
        : [],
      checked: source.checked === true || undefined,
      asset:
        sourceAsset && url
          ? { name: text(sourceAsset.name, 300), url }
          : undefined,
      aspectRatio:
        typeof source.aspectRatio === 'number' &&
        Number.isFinite(source.aspectRatio) &&
        source.aspectRatio > 0 &&
        source.aspectRatio < 10
          ? source.aspectRatio
          : undefined,
      children: normalizeBlocks(source.children, depth + 1),
    };
  });
}

export function normalizeRequirement(row: Record<string, unknown>) {
  let content: unknown = row.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      content = [];
    }
  }
  return {
    ...row,
    id: Number(row.id),
    sort_order: Number(row.sort_order) || 0,
    content: normalizeBlocks(content),
  } as Requirement;
}

export function requirementPayload(value: unknown) {
  const source =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  const title = text(source.title, 300).trim();
  if (!title) throw new Error('요구사항 이름을 입력해 주세요.');
  return {
    title,
    creator: text(source.creator, 100),
    category: text(source.category, 100),
    dueDate: text(source.due_date, 10),
    status: text(source.status, 100) || '시작 전',
    content: normalizeBlocks(source.content),
  };
}
