import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_BASE_URL ?? 'https://mapsiggun.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cart/', '/checkout/', '/login/', '/mypage/'],
    },
    host: SITE_URL,
  };
}
