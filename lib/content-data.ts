import type { ContentItem, ContentType } from './content-types';
import { dbApi } from './db-api';
import { resolveContentImage } from './editor-content';
export async function getContentItems<T>(type:ContentType):Promise<T[]>{try{const data=await dbApi(`/content?type=${type}`) as {items:ContentItem<T>[]};return data.items.filter(item=>item.published).map(item=>{const content={...(item.data as object),slug:item.slug} as Record<string,unknown>;if(type==='product'||type==='case')content.image=resolveContentImage(content);return content as T})}catch{return []}}
