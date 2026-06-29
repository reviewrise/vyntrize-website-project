import { prisma } from "@/lib/prisma";
import { AiPipelineService } from "./ai-pipeline.service";

export interface NormalizedArticle {
  source: string;
  sourceType: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  image?: string;
  author?: string;
  publishedAt: Date;
  language?: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
}

export interface SourceAdapter {
  fetchArticles(config: any, apiKey?: string): Promise<NormalizedArticle[]>;
}

// Example Mock Adapter for Development/Testing
export class MockSourceAdapter implements SourceAdapter {
  async fetchArticles(config: any, apiKey?: string): Promise<NormalizedArticle[]> {
    return [
      {
        source: "TechCrunch",
        sourceType: "Business News",
        title: "How AI is transforming modern CRMs",
        description: "A deep dive into AI features being built into Salesforce and Hubspot.",
        url: "https://example.com/ai-crm-" + Date.now(),
        publishedAt: new Date(),
        language: "en",
      },
      {
        source: "Dev.to",
        sourceType: "Community",
        title: "Building an automated workflow with Node.js",
        description: "Step by step guide to workflow automation.",
        url: "https://example.com/node-workflow-" + Date.now(),
        publishedAt: new Date(),
        language: "en",
      }
    ];
  }
}

export class CrawlerService {
  private async getActiveSources() {
    return await prisma.sourceIntegration.findMany({
      where: { isActive: true },
    });
  }

  private async detectDuplicate(article: NormalizedArticle): Promise<boolean> {
    // Check exact URL
    const existingUrl = await prisma.article.findUnique({
      where: { url: article.url },
    });
    if (existingUrl) return true;

    // Check title similarity (basic exact/fuzzy approach)
    // A robust fuzzy match requires pg_trgm, but for simplicity we check exact title match
    const existingTitle = await prisma.article.findFirst({
      where: { title: article.title },
    });
    if (existingTitle) return true;

    return false;
  }

  public async run() {
    const { DevToAdapter, NewsAPIAdapter, HackerNewsAdapter, RSSFeedAdapter } = await import("./crawler.adapters");
    const sources = await this.getActiveSources();
    let totalSaved = 0;
    const ai = new AiPipelineService();

    // Providers that use a generic RSS feed
    const RSS_PROVIDERS = ["HubSpot Blog", "TechCrunch Enterprise", "Salesforce Blog", "SaaStr"];

    for (const source of sources) {
      let adapter: SourceAdapter;

      if (source.provider === "Dev.to") {
        adapter = new DevToAdapter();
      } else if (source.provider === "NewsAPI") {
        adapter = new NewsAPIAdapter();
      } else if (source.provider === "Hacker News") {
        adapter = new HackerNewsAdapter();
      } else if (RSS_PROVIDERS.includes(source.provider)) {
        adapter = new RSSFeedAdapter(source.provider);
      } else {
        console.log(`Skipping ${source.provider}: No adapter available yet.`);
        continue;
      }

      try {
        const articles = await adapter.fetchArticles(source.config, source.apiKey || undefined);
        console.log(`Fetched ${articles.length} articles from ${source.provider}`);
        
        for (const article of articles) {
          if (!article.title || !article.url) continue;
          const isDuplicate = await this.detectDuplicate(article);
          
          if (!isDuplicate) {
            // AI Classification & Scoring
            const aiResult = await ai.classifyArticle(article.title, article.description);
            if (aiResult.isRejected) continue; // Skip rejected categories (Gaming, Sports, etc)

            const summary = await ai.generateSummary(article.content || article.description || "");
            const score = ai.calculateRelevanceScore(article, aiResult.confidence);

            // Only save if relevance score is above 60 threshold
            if (score >= 60) {
              await prisma.article.create({
                data: {
                  ...article,
                  category: aiResult.category,
                  aiSummary: summary,
                  score: score,
                  tags: article.tags || [],
                }
              });
              totalSaved++;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to crawl source ${source.provider}:`, error);
      }
    }
    
    return { success: true, saved: totalSaved };
  }
}
