import type { ContentItem, ContentType } from './content-types';
import { dbApi } from './db-api';
import { resolveContentImage } from './editor-content';

export async function getContentRecords<T>(
  type: ContentType,
): Promise<ContentItem<T>[]> {
  try {
    const data = (await dbApi(`/content?type=${type}`)) as {
      items: ContentItem<T>[];
    };
    return data.items.filter((item) => item.published);
  } catch {
    return [];
  }
}

export async function getContentItems<T>(type: ContentType): Promise<T[]> {
  const records = await getContentRecords<T>(type);
  return records.map((item) => {
    const content = { ...(item.data as object), slug: item.slug } as Record<
      string,
      unknown
    >;
    if (type === 'product' || type === 'case')
      content.image = resolveContentImage(content);
    return content as T;
  });
}

export function mergeBySlug<T extends { slug: string }>(
  fallback: T[],
  saved: T[],
): T[] {
  const merged = new Map(fallback.map((item) => [item.slug, item]));
  for (const item of saved) merged.set(item.slug, item);
  return [...merged.values()];
}
