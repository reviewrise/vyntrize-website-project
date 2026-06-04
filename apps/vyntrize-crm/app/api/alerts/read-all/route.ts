import { NextResponse } from 'next/server';
// Mark all read — stored client-side for simplicity (no new DB table)
export async function POST() {
  return NextResponse.json({ success: true });
}
