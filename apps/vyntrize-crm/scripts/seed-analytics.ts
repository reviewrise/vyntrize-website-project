import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock analytics data...');
  
  const sources = ['google', 'direct', 'twitter', 'linkedin'];
  const pages = ['/', '/pricing', '/about', '/contact', '/blog/intro'];
  const devices = ['desktop', 'mobile', 'tablet'];

  // Delete existing analytics
  await prisma.pageView.deleteMany();
  await prisma.contactSubmission.deleteMany();

  const now = new Date();
  
  // Generate data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Random number of sessions per day (10 to 50)
    const sessionsToday = Math.floor(Math.random() * 40) + 10;
    
    for (let s = 0; s < sessionsToday; s++) {
      const sessionId = `session-${i}-${s}`;
      const source = sources[Math.floor(Math.random() * sources.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      
      // Random number of page views per session (1 to 5)
      const viewsCount = Math.floor(Math.random() * 5) + 1;
      
      let baseTime = new Date(date);
      baseTime.setHours(Math.floor(Math.random() * 24));
      
      for (let v = 0; v < viewsCount; v++) {
        baseTime = new Date(baseTime.getTime() + (Math.floor(Math.random() * 60) + 10) * 1000);
        
        await prisma.pageView.create({
          data: {
            path: pages[Math.floor(Math.random() * pages.length)],
            source,
            sessionId,
            device,
            createdAt: baseTime,
          }
        });
      }
      
      // 5% chance of conversion
      if (Math.random() < 0.05) {
        await prisma.contactSubmission.create({
          data: {
            firstName: 'Mock',
            lastName: 'User',
            email: `mock${i}-${s}@example.com`,
            intent: 'inquiry',
            message: 'Mock contact submission',
            createdAt: baseTime,
            source,
          }
        });
      }
    }
  }

  console.log('Successfully seeded mock analytics data.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
