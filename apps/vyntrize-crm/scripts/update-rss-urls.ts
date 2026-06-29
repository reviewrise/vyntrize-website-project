import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  const { vyntrizeDb } = require('@platform/vyntrize-db');

  const rssUpdates = [
    { provider: 'HubSpot Blog',         rssUrl: 'https://blog.hubspot.com/marketing/rss.xml' },
    { provider: 'TechCrunch Enterprise', rssUrl: 'https://techcrunch.com/category/enterprise/feed/' },
    { provider: 'Salesforce Blog',       rssUrl: 'https://www.salesforce.com/blog/feed/' },
    { provider: 'SaaStr',               rssUrl: 'https://www.saastr.com/feed/' },
  ];

  for (const update of rssUpdates) {
    const source = await vyntrizeDb.sourceIntegration.findFirst({ where: { provider: update.provider } });
    if (source) {
      await vyntrizeDb.sourceIntegration.update({
        where: { id: source.id },
        data: { config: { rssUrl: update.rssUrl, type: 'rss' } },
      });
      console.log(`Updated RSS URL for: ${update.provider}`);
    } else {
      console.log(`Not found: ${update.provider}`);
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
