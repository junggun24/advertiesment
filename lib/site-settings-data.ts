import { getContentItems } from './content-data';
import { mergeSiteSettings, type SiteSettings } from './content-types';

export async function getSiteSettings() {
  const [saved] = await getContentItems<Partial<SiteSettings>>('site');
  return mergeSiteSettings(saved);
}
