import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { vyntrizeDb } from '@platform/vyntrize-db';

const slugMappings = [
  { email: 'abenezer@vyntrise.com', slug: 'abenezer-tech' },
  { email: 'biniyam@vyntrise.com', slug: 'biniyam-sales' },
  { email: 'mahlet@vyntrise.com', slug: 'mahlet-marketing' },
];

async function main() {
  console.log("=== Setting booking slugs for team members ===");
  
  for (const mapping of slugMappings) {
    const user = await vyntrizeDb.crmUser.findUnique({
      where: { email: mapping.email }
    });

    if (user) {
      await vyntrizeDb.crmUser.update({
        where: { email: mapping.email },
        data: { 
          bookingSlug: mapping.slug
        }
      });
      console.log(`Updated ${user.displayName} (${mapping.email}) with slug: ${mapping.slug}`);
    } else {
      console.log(`User not found: ${mapping.email}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => vyntrizeDb.$disconnect());
