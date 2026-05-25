import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { vyntrizeDb } from '@platform/vyntrize-db';

async function main() {
    const events = await vyntrizeDb.calendarEvent.findMany({
        select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            userId: true,
            user: {
                select: {
                    email: true,
                    displayName: true
                }
            }
        }
    });

    console.log("=== Calendar Events in Database ===");
    console.log(JSON.stringify(events, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => vyntrizeDb.$disconnect());
