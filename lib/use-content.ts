'use client';
import { useEffect, useState } from 'react';
import type { ContentItem, ContentType } from './content-types';
import { resolveContentImage } from './editor-content';
export function useContent<T>(type:ContentType,fallback:T[]){const [items,setItems]=useState<T[]>(fallback);useEffect(()=>{void fetch(`/api/content?type=${type}`).then(async response=>{if(!response.ok)return;const data=await response.json() as {items:ContentItem<T>[]};setItems(data.items.filter(item=>item.published).map(item=>{const content={...(item.data as object),slug:item.slug} as Record<string,unknown>;if(type==='product'||type==='case')content.image=resolveContentImage(content);return content as T}))}).catch(()=>undefined)},[type]);return items}
