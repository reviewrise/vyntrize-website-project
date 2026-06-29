import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  const { vyntrizeDb } = require('@platform/vyntrize-db');

  const articles = await vyntrizeDb.article.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      source: true,
      title: true,
      description: true,
      aiSummary: true,
    }
  });

  for (const a of articles) {
    console.log('\n---');
    console.log('SOURCE:', a.source);
    console.log('TITLE:', a.title);
    console.log('DESCRIPTION LENGTH:', a.description?.length ?? 0);
    console.log('DESCRIPTION:', a.description);
    console.log('AI SUMMARY LENGTH:', a.aiSummary?.length ?? 0);
    console.log('AI SUMMARY:', a.aiSummary);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
