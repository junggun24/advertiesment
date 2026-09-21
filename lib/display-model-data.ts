import { cloudflareEnv } from './cloudflare-env';
import { normalizeDisplayModel } from './display-models';

export async function getDisplayModels(publishedOnly = true) {
  const where = publishedOnly ? 'WHERE published=1' : '';
  const result = await cloudflareEnv()
    .DB.prepare(`SELECT * FROM display_models ${where} ORDER BY sort_order, id`)
    .all<Record<string, unknown>>();
  return result.results.map(normalizeDisplayModel);
}
