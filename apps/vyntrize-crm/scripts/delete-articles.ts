import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  const { vyntrizeDb } = require('@platform/vyntrize-db');

  const result = await vyntrizeDb.article.deleteMany({});
  console.log(`✓ Deleted ${result.count} articles.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
