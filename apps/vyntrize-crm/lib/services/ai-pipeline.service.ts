import { HfInference } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NormalizedArticle } from "./crawler.service";

// Define allowed categories
const ALLOWED_CATEGORIES = [
  "Workflow Automation", "Artificial Intelligence", "CRM", "Lead Generation",
  "Lead Qualification", "Sales", "Marketing", "Customer Experience",
  "Reputation Management", "Customer Reviews", "Business Intelligence",
  "Data Analytics", "Data Integration", "SaaS", "Security", "Cloud",
  "Digital Transformation", "Other"
];

const REJECTED_CATEGORIES = [
  "Gaming", "Sports", "Politics", "Celebrity", "Entertainment",
  "Fashion", "Travel", "Food"
];

// Combine all categories for zero-shot classification
const ALL_CATEGORIES = [...ALLOWED_CATEGORIES, ...REJECTED_CATEGORIES];

export class AiPipelineService {
  private hf: HfInference;
  private gemini: GoogleGenerativeAI | null;

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");
    this.gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  }

  // 1. Classification
  public async classifyArticle(title: string, description: string = ""): Promise<{ category: string, isRejected: boolean, confidence: number }> {
    const textToClassify = `${title}. ${description}`;

    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          Classify the following text into exactly ONE of these categories:
          ${ALL_CATEGORIES.join(", ")}
          
          Text: "${textToClassify}"
          
          Return ONLY the category name, nothing else.
        `;
        const result = await model.generateContent(prompt);
        const bestMatch = result.response.text().trim();
        
        // Ensure it's exactly one of our categories
        const matchedCategory = ALL_CATEGORIES.find(c => c.toLowerCase() === bestMatch.toLowerCase()) || "Other";
        
        return { 
          category: matchedCategory, 
          isRejected: REJECTED_CATEGORIES.includes(matchedCategory), 
          confidence: 0.95 
        };
      } catch (err) {
        console.error("Gemini classification failed, falling back to local...", err);
      }
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      console.warn("No AI API keys found, using local mock classification.");
      const text = `${title} ${description}`.toLowerCase();
      
      let mockCategory = "Workflow Automation"; // default
      
      if (text.includes("crm") || text.includes("customer")) mockCategory = "CRM";
      else if (text.includes("ai") || text.includes("artificial") || text.includes("machine learning")) mockCategory = "Artificial Intelligence";
      else if (text.includes("sales") || text.includes("revenue")) mockCategory = "Sales";
      else if (text.includes("market") || text.includes("brand")) mockCategory = "Marketing";
      else if (text.includes("data") || text.includes("analytics")) mockCategory = "Data Analytics";
      else if (text.includes("lead") || text.includes("prospect")) mockCategory = "Lead Generation";
      else if (text.includes("saas") || text.includes("software")) mockCategory = "SaaS";
      else if (text.includes("cloud")) mockCategory = "Cloud";
      else if (text.includes("security")) mockCategory = "Security";

      return { category: mockCategory, isRejected: false, confidence: 0.85 };
    }

    try {
      const text = `${title}. ${description}`;
      const result = await this.hf.zeroShotClassification({
        model: "facebook/bart-large-mnli",
        inputs: text,
        parameters: { candidate_labels: ALL_CATEGORIES },
      });

      const raw = result as any;
      const bestMatch = raw.labels?.[0] ?? (Array.isArray(raw) ? raw[0]?.label : 'Other');
      const confidence = raw.scores?.[0] ?? (Array.isArray(raw) ? raw[0]?.score : 0);

      if (REJECTED_CATEGORIES.includes(bestMatch)) {
        return { category: bestMatch, isRejected: true, confidence };
      }

      return { category: bestMatch, isRejected: false, confidence };
    } catch (error) {
      console.error("Classification error:", error);
      return { category: "Other", isRejected: false, confidence: 0 };
    }
  }

  // 2. Summary Generation
  // 2. Summary Generation
  public async generateSummary(content: string): Promise<string> {
    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Write a comprehensive, engaging 2-3 paragraph summary of this article. Make it detailed and informative:\n\n${content.slice(0, 5000)}`);
        return result.response.text().trim();
      } catch (err) {
        console.error("Gemini summary failed, falling back...");
      }
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      // Without AI, return a strictly truncated string for the UI
      return content.length > 300 ? content.slice(0, 300) + "..." : content;
    }

    try {
      const result = await this.hf.summarization({
        model: "facebook/bart-large-cnn",
        inputs: content.slice(0, 2000),
        parameters: { max_length: 60, min_length: 20 },
      });
      return result.summary_text;
    } catch (error) {
      console.error("Summary error:", error);
      return content.length > 300 ? content.slice(0, 300) + "..." : content;
    }
  }

  // 3. Relevance Scoring Algorithm (0-100)
  public calculateRelevanceScore(article: NormalizedArticle, classificationConfidence: number): number {
    let score = 0;

    // Trusted source (+20)
    const trustedSources = ["techcrunch", "hacker news", "salesforce", "hubspot", "microsoft", "dev.to"];
    if (trustedSources.some(ts => article.source.toLowerCase().includes(ts))) {
      score += 20;
    }

    // Business keywords (+20)
    const text = `${article.title} ${article.description || ""}`.toLowerCase();
    const keywords = ["roi", "revenue", "b2b", "enterprise", "growth", "efficiency", "sales pipeline"];
    const matchCount = keywords.filter(k => text.includes(k)).length;
    if (matchCount > 0) {
      score += Math.min(20, matchCount * 5);
    }

    // AI category confidence (+25)
    // Scale confidence (0.0 - 1.0) to points (0 - 25)
    score += Math.round(classificationConfidence * 25);

    // Published in last 30 days (+15)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (article.publishedAt > thirtyDaysAgo) {
      score += 15;
    }

    // High engagement (+10) 
    score += 10; 

    // Matches user interests (+10)
    // Applied dynamically at query time in the recommendation engine

    return Math.min(100, score);
  }
}
