import type { MetadataRoute } from 'next';
import { env } from '@/config/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.APP_URL.replace(/\/$/, '');
  const staticPages = ['', '/pricing', '/privacy', '/terms', '/sign-in'].map((path) => ({
    url: `${baseUrl}${path}`,
  }));

  return staticPages;
}
