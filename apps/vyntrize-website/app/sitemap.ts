import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.vyntrise.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                          lastModified: new Date('2026-05-27'), changeFrequency: 'weekly',  priority: 1.0  },
    { url: `${BASE_URL}/about`,                               lastModified: new Date('2026-05-20'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services`,                            lastModified: new Date('2026-05-27'), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/services/ai-search`,                  lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/intelligent-automation`,     lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/custom-software`,            lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/data-architecture`,          lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/digital-marketing`,          lastModified: new Date('2026-05-15'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/solutions`,                           lastModified: new Date('2026-05-20'), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/pricing`,                             lastModified: new Date('2026-05-27'), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/contact`,                             lastModified: new Date('2026-05-10'), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/faq`,                                 lastModified: new Date('2026-05-10'), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/support`,                             lastModified: new Date('2026-05-10'), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/privacy`,                             lastModified: new Date('2026-01-01'), changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${BASE_URL}/terms`,                               lastModified: new Date('2026-01-01'), changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${BASE_URL}/cookies`,                             lastModified: new Date('2026-01-01'), changeFrequency: 'yearly',  priority: 0.3  },
  ]; 

  return routes;
}
