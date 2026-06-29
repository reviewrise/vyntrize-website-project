import { NormalizedArticle, SourceAdapter } from "./crawler.service";

/**
 * Decode common HTML entities and strip any remaining HTML tags.
 * Keeps the full text — no truncation.
 */
function cleanText(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8230;/g, '…')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#\d+;/g, '') // strip remaining numeric entities
    .replace(/&[a-z]+;/gi, '') // strip remaining named entities
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

// ==========================================
// Dev.to Adapter
// ==========================================
export class DevToAdapter implements SourceAdapter {
  async fetchArticles(config: any, apiKey?: string): Promise<NormalizedArticle[]> {
    const tags: string[] = config?.tags || ['automation'];
    const results: NormalizedArticle[] = [];

    // Fetch articles per tag so we cover more topics
    for (const tag of tags.slice(0, 4)) {
      try {
        const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&top=7&per_page=10`;
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.forem.api-v1+json',
        };
        if (apiKey) headers['api-key'] = apiKey;

        const response = await fetch(url, { headers });
        if (!response.ok) continue;

        const data = await response.json();
        for (const item of data) {
          let content;
          try {
            // Dev.to API lists don't include the full body, so we fetch it individually
            const detailRes = await fetch(`https://dev.to/api/articles/${item.id}`, { headers });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              content = detail.body_markdown;
            }
          } catch (e) {
            console.error(`Failed to fetch dev.to article ${item.id} details`, e);
          }

          results.push({
            source: "Dev.to",
            sourceType: "Community",
            title: cleanText(item.title),
            description: cleanText(item.description),
            content: content || undefined,
            url: item.url,
            image: item.cover_image || item.social_image,
            author: item.user?.name,
            publishedAt: new Date(item.published_timestamp),
            language: "en",
            tags: item.tag_list,
            readingTime: item.reading_time_minutes,
          });
        }
      } catch (err) {
        console.error(`Dev.to tag "${tag}" failed:`, err);
      }
    }

    return results;
  }
}

// ==========================================
// NewsAPI Adapter
// ==========================================
export class NewsAPIAdapter implements SourceAdapter {
  async fetchArticles(config: any, apiKey?: string): Promise<NormalizedArticle[]> {
    if (!apiKey) {
      console.warn("NewsAPI requires an API key.");
      return [];
    }

    const keywords = config?.keywords?.join(' OR ') || 'CRM OR Salesforce';
    const language = config?.language || 'en';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&language=${language}&sortBy=relevancy&pageSize=20`;

    try {
      const response = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
      if (!response.ok) throw new Error(`NewsAPI error: ${response.statusText}`);

      const data = await response.json();
      return (data.articles || [])
        .filter((item: any) => item.title && item.title !== '[Removed]' && item.url)
        .map((item: any) => ({
          source: item.source?.name || "NewsAPI",
          sourceType: "News",
          title: cleanText(item.title),
          description: cleanText(item.description),
          content: item.content
            ? cleanText(item.content.replace(/\s*\[\+\d+ chars\]$/, ''))
            : undefined,
          url: item.url,
          image: item.urlToImage,
          author: item.author,
          publishedAt: new Date(item.publishedAt),
          language: language,
        }));
    } catch (error) {
      console.error("NewsAPI adapter failed:", error);
      return [];
    }
  }
}

// ==========================================
// Hacker News Adapter (free, no key needed)
// ==========================================
export class HackerNewsAdapter implements SourceAdapter {
  async fetchArticles(config: any, _apiKey?: string): Promise<NormalizedArticle[]> {
    const type = config?.type || 'beststories';
    const limit = config?.limit || 30;
    // Business keywords we care about
    const KEYWORDS = ['crm', 'saas', 'ai', 'automation', 'workflow', 'analytics', 'startup', 'business', 'data', 'api', 'integration'];

    try {
      const idsResponse = await fetch(`https://hacker-news.firebaseio.com/v0/${type}.json`);
      const ids: number[] = await idsResponse.json();

      const articles: NormalizedArticle[] = [];

      // Fetch details for the first `limit` stories concurrently in batches
      const batchSize = 10;
      for (let i = 0; i < Math.min(limit, ids.length) && articles.length < 15; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const fetched = await Promise.all(
          batch.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()).catch(() => null))
        );

        for (const item of fetched) {
          if (!item || !item.url || !item.title) continue;
          // Only include articles relevant to our topics
          const titleLower = item.title.toLowerCase();
          const isRelevant = KEYWORDS.some(kw => titleLower.includes(kw));
          if (!isRelevant) continue;

          articles.push({
            source: "Hacker News",
            sourceType: "Community",
            title: item.title,
            description: `${item.score} points · ${item.descendants ?? 0} comments`,
            url: item.url,
            author: item.by,
            publishedAt: new Date(item.time * 1000),
            language: "en",
            tags: ['hacker-news'],
          });
        }
      }

      return articles;
    } catch (error) {
      console.error("Hacker News adapter failed:", error);
      return [];
    }
  }
}

// ==========================================
// Generic RSS Feed Adapter (HubSpot, Salesforce, SaaStr, TechCrunch, etc.)
// Parses RSS/Atom XML directly — no third-party service needed.
// ==========================================
export class RSSFeedAdapter implements SourceAdapter {
  private providerName: string;

  constructor(providerName: string) {
    this.providerName = providerName;
  }

  private extractText(xml: string, tag: string): string {
    // Handles both <tag>text</tag> and CDATA <tag><![CDATA[text]]></tag>
    const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'si');
    const match = xml.match(re);
    return match ? match[1].trim().replace(/<[^>]+>/g, '') : '';
  }

  private extractAttr(xml: string, tag: string, attr: string): string {
    const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
    const match = xml.match(re);
    return match ? match[1].trim() : '';
  }

  async fetchArticles(config: any, _apiKey?: string): Promise<NormalizedArticle[]> {
    const feedUrl = config?.rssUrl || config?.url;
    if (!feedUrl) {
      console.warn(`RSSFeedAdapter: No rssUrl/url in config for ${this.providerName}`);
      return [];
    }

    try {
      const response = await fetch(feedUrl, {
        headers: { 'User-Agent': 'VyntRise-ContentBot/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();

      // Split into <item> (RSS) or <entry> (Atom) blocks
      const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
      const articles: NormalizedArticle[] = [];
      let match;

      while ((match = itemRegex.exec(xml)) !== null && articles.length < 15) {
        const block = match[1] || match[2];

        const title = this.extractText(block, 'title');
        // RSS uses <link>, Atom uses <link href="..."/>
        const link = this.extractText(block, 'link') || this.extractAttr(block, 'link', 'href');
        if (!title || !link) continue;

        const rawDescription = this.extractText(block, 'description') || this.extractText(block, 'summary') || '';
        
        // Prioritize full content tags like <content:encoded> or <content>
        const rawContent = this.extractText(block, 'content:encoded') || this.extractText(block, 'content') || rawDescription;

        const pubDate = this.extractText(block, 'pubDate') ||
          this.extractText(block, 'published') ||
          this.extractText(block, 'updated');

        const author = this.extractText(block, 'author') ||
          this.extractText(block, 'dc:creator') ||
          this.extractText(block, 'name');

        // Extract image from enclosure or media:thumbnail
        const imageUrl = this.extractAttr(block, 'enclosure', 'url') ||
          this.extractAttr(block, 'media:thumbnail', 'url') ||
          this.extractAttr(block, 'media:content', 'url');

        // Extract tags from <category> elements
        const categoryMatches = block.match(/<category[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\/category>/gi) || [];
        const tags = categoryMatches.map((c: string) => this.extractText(c, 'category')).filter(Boolean);

        const rssDescription = cleanText(rawDescription);
        const rssContent = cleanText(rawContent);
        
        // We use the short RSS description for the list view,
        // and save the full article text in the 'content' field.
        const finalDescription = rssDescription.slice(0, 300) + (rssDescription.length > 300 ? '...' : '');

        articles.push({
          source: this.providerName,
          sourceType: "Blog",
          title: cleanText(title).slice(0, 300),
          description: finalDescription,
          content: rssContent || undefined,
          url: link.trim(),
          image: imageUrl || undefined,
          author: cleanText(author) || undefined,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
          language: "en",
          tags,
        });
      }

      return articles;
    } catch (error) {
      console.error(`RSS adapter (${this.providerName}) failed:`, error);
      return [];
    }
  }
}

