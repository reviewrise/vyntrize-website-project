import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.vyntrise.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0  },
    { url: `${BASE_URL}/about`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services`,                            lastModified: now, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/services/ai-search`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/intelligent-automation`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/custom-software`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/data-architecture`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/services/digital-marketing`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/solutions`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/pricing`,                             lastModified: now, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/contact`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/faq`,                                 lastModified: now, changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/support`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/privacy`,                             lastModified: now, changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${BASE_URL}/terms`,                               lastModified: now, changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${BASE_URL}/cookies`,                             lastModified: now, changeFrequency: 'yearly',  priority: 0.3  },
  ]; 

  return routes;
}
