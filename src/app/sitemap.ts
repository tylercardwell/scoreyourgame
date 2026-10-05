import type { MetadataRoute } from 'next';
import { PAGES, SITE_URL } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority,
  }));
}
