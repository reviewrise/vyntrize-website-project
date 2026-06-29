import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root before requiring the db client
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  const { vyntrizeDb } = require('@platform/vyntrize-db');

  console.log("Seeding Content Sources...");

  const sourcesToSeed = [
    {
      provider: "NewsAPI",
      config: { keywords: ["CRM", "Salesforce", "HubSpot", "Workflow Automation"], language: "en" },
      isActive: false, 
    },
    {
      provider: "Dev.to",
      config: { tags: ["programming", "automation", "ai", "webdev"] },
      isActive: true, 
    },
    {
      provider: "Reddit",
      config: { subreddits: ["SaaS", "marketing", "artificialintelligence", "CRM"] },
      isActive: false,
    },
    {
      provider: "Hacker News",
      config: { type: "beststories", limit: 30 },
      isActive: true, 
    },
    {
      provider: "HubSpot Blog",
      config: { url: "https://blog.hubspot.com/", type: "rss", categories: ["Marketing", "Sales", "Service"] },
      isActive: true,
    },
    {
      provider: "TechCrunch Enterprise",
      config: { url: "https://techcrunch.com/category/enterprise/", type: "rss" },
      isActive: true,
    },
    {
      provider: "Medium",
      config: { tags: ["SaaS", "Business Intelligence", "Digital Transformation", "Customer Experience"] },
      isActive: true,
    },
    {
      provider: "Salesforce Blog",
      config: { url: "https://www.salesforce.com/blog/", type: "rss" },
      isActive: true,
    },
    {
      provider: "SaaStr",
      config: { url: "https://www.saastr.com/", type: "rss" },
      isActive: true,
    }
  ];

  for (const source of sourcesToSeed) {
    const existing = await vyntrizeDb.sourceIntegration.findFirst({
      where: { provider: source.provider }
    });

    if (!existing) {
      await vyntrizeDb.sourceIntegration.create({
        data: {
          provider: source.provider,
          config: source.config,
          isActive: source.isActive,
        }
      });
      console.log(`Created source: ${source.provider}`);
    } else {
      console.log(`Source already exists: ${source.provider}`);
    }
  }

  console.log("Seed completed.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
