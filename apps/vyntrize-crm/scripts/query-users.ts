import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { vyntrizeDb } from '@platform/vyntrize-db';

async function main() {
    const users = await vyntrizeDb.crmUser.findMany({
        select: {
            id: true,
            email: true,
            displayName: true,
            bookingSlug: true
        }
    });

    console.log("=== CRM Users in Database ===");
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => vyntrizeDb.$disconnect());
