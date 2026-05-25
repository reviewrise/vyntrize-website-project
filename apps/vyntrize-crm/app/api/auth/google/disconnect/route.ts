import { NextRequest, NextResponse } from 'next/server';
import { vyntrizeDb } from '@platform/vyntrize-db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  await vyntrizeDb.connectedAccount.deleteMany({
    where: {
      userId: session.userId,
      provider: 'google',
    },
  });

  return NextResponse.redirect(new URL('/settings/integrations', request.url));
}
