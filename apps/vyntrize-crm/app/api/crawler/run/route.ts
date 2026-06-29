import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { CrawlerService } from "@/lib/services/crawler.service";

export async function POST(req: Request) {
  try {
    // Only allow authenticated CRM admins
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const crawler = new CrawlerService();
    const result = await crawler.run();

    return NextResponse.json({ success: true, saved: result.saved });
  } catch (error: any) {
    console.error("Crawler API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
