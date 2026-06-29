import { prisma } from "./prisma";

export async function getTrendingArticles(page: number = 1, limit: number = 6) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where: { score: { gt: 60 } },
      orderBy: [
        { score: 'desc' },
        { publishedAt: 'desc' }
      ],
      skip,
      take: limit,
    }),
    prisma.article.count({ where: { score: { gt: 60 } } }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}

export async function getRecentArticles() {
  return await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });
}

export async function getArticlesByCategory(category: string) {
  return await prisma.article.findMany({
    where: { category },
    orderBy: { publishedAt: 'desc' },
    take: 5,
  });
}

export async function getRecommendedForYou(page: number = 1, limit: number = 4) {
  // Mock personalization. In a full system, we query Organization interests.
  // We'll return highly scored, recent AI/Workflow content.
  const skip = (page - 1) * limit;
  const where = { 
    score: { gt: 60 },
    category: { in: ['Artificial Intelligence', 'Workflow Automation', 'CRM'] }
  };

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.article.count({ where })
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
}
