import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  // Require the service after env is loaded
  const { CrawlerService } = require('../lib/services/crawler.service');
  
  console.log("Triggering the Content Crawler Pipeline...");
  
  const crawler = new CrawlerService();
  const result = await crawler.run();
  
  console.log(`Crawler finished successfully. Saved ${result.saved} articles.`);
  process.exit(0);
}

main().catch(console.error);
