'use client';
import { useEffect, useState } from 'react';
import type { ContentItem, ContentType } from './content-types';
import { resolveContentImage } from './editor-content';

const CONTENT_UPDATED_EVENT = 'oic:content-updated';
const CONTENT_UPDATED_STORAGE_KEY = 'oic:content-updated';

export function notifyContentUpdated(type: ContentType) {
  window.dispatchEvent(
    new CustomEvent(CONTENT_UPDATED_EVENT, { detail: { type } }),
  );
  try {
    localStorage.setItem(
      CONTENT_UPDATED_STORAGE_KEY,
      JSON.stringify({ type, updatedAt: Date.now() }),
    );
  } catch {
    // The same-tab event above still refreshes content when storage is disabled.
  }
}

export function useContent<T>(type: ContentType, fallback: T[]) {
  const [items, setItems] = useState<T[]>(fallback);
  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch(`/api/content?type=${type}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = (await response.json()) as { items: ContentItem<T>[] };
        if (!active) return;
        setItems(
          data.items
            .filter((item) => item.published)
            .map((item) => {
              const content = {
                ...(item.data as object),
                slug: item.slug,
              } as Record<string, unknown>;
              if (type === 'product' || type === 'case')
                content.image = resolveContentImage(content);
              return content as T;
            }),
        );
      } catch {
        // Keep the server-rendered fallback when the refresh is unavailable.
      }
    }

    function refreshChangedContent(event: Event) {
      const changedType = (event as CustomEvent<{ type?: ContentType }>).detail
        ?.type;
      if (!changedType || changedType === type) void refresh();
    }

    function refreshStoredContent(event: StorageEvent) {
      if (event.key !== CONTENT_UPDATED_STORAGE_KEY || !event.newValue) return;
      try {
        const changed = JSON.parse(event.newValue) as { type?: ContentType };
        if (!changed.type || changed.type === type) void refresh();
      } catch {
        void refresh();
      }
    }

    function refreshVisibleContent() {
      if (document.visibilityState === 'visible') void refresh();
    }

    void refresh();
    window.addEventListener(CONTENT_UPDATED_EVENT, refreshChangedContent);
    window.addEventListener('storage', refreshStoredContent);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshVisibleContent);
    return () => {
      active = false;
      window.removeEventListener(CONTENT_UPDATED_EVENT, refreshChangedContent);
      window.removeEventListener('storage', refreshStoredContent);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshVisibleContent);
    };
  }, [type]);
  return items;
}
