import { uploadResponse } from '@/lib/object-storage';
import { HOME_SEARCH_IMAGE } from '@/lib/search-assets';

export async function GET() {
  return uploadResponse(HOME_SEARCH_IMAGE.objectKey, false);
}
