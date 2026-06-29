"use server";

import { vyntrizeDb } from "@platform/vyntrize-db";

export async function getArticles(page: number = 1, limit: number = 20) {
  try {
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      vyntrizeDb.article.findMany({
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          source: true,
          title: true,
          category: true,
          score: true,
          publishedAt: true,
          url: true,
        },
      }),
      vyntrizeDb.article.count(),
    ]);

    return { 
      success: true, 
      data: articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error("Error fetching articles:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteArticle(id: string) {
  try {
    await vyntrizeDb.article.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting article:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteArticles(ids: string[]) {
  try {
    const result = await vyntrizeDb.article.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Error deleting articles:", error);
    return { success: false, error: error.message };
  }
}

export async function updateArticle(id: string, data: { title?: string; category?: string; score?: number }) {
  try {
    const updated = await vyntrizeDb.article.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        score: data.score,
      },
    });
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating article:", error);
    return { success: false, error: error.message };
  }
}
