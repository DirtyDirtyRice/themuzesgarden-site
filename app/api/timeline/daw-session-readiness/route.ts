import { NextResponse } from "next/server";
import { timelineDawSystemIntegrationEngine } from "@/lib/timeline/TimelineDawSystemIntegrationEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const report = timelineDawSystemIntegrationEngine.report();
  return NextResponse.json({
    ready: report.ready,
    coordinator: "daw-session-coordinator",
    lifecycle: ["draft", "ready", "active", "suspended", "closed"],
    boundEngines: report.stages.map((stage) => stage.engineId),
    completed: report.completed,
    required: report.required,
  }, {
    status: report.ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
