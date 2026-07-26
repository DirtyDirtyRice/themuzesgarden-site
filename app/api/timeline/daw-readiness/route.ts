import { NextResponse } from "next/server";
import { timelineDawSystemIntegrationEngine } from "@/lib/timeline/TimelineDawSystemIntegrationEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const report = timelineDawSystemIntegrationEngine.report();
  return NextResponse.json({ report }, { status: report.ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
