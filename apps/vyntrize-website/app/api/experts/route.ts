import { NextResponse } from "next/server";
import { vyntrizeDb } from "@platform/vyntrize-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const experts = await vyntrizeDb.crmUser.findMany({
      where: {
        bookingSlug: {
          not: null,
        },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        bookingSlug: true,
        role: true,
      },
    });

    return NextResponse.json({ experts });
  } catch (error: any) {
    console.error("Error fetching experts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
