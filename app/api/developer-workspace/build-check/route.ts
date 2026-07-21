import { updateBuildEventLedger } from "@/lib/developer-workspace/buildEventLedger";

import { NextRequest, NextResponse } from "next/server";

import { enqueueVerification } from "@/lib/developer-workspace/verificationCoordinator";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BuildAction = "typecheck" | "build";

function isLocalDevelopmentRequest(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  const localHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  return process.env.NODE_ENV !== "production" && localHost;
}

function readAction(value: unknown): BuildAction {
  if (
    typeof value !== "object" ||
    value === null ||
    !("action" in value) ||
    (value.action !== "typecheck" && value.action !== "build")
  ) {
    throw new Error("action must be either typecheck or build.");
  }
  return value.action;
}

export async function POST(request: NextRequest) {
  if (!isLocalDevelopmentRequest(request)) {
    return NextResponse.json(
      { error: "Build checks are available only from the local development server." },
      { status: 403 }
    );
  }

  try {
    const context = await resolveWorkspaceRequestContext(request);
    const action = readAction(await request.json());
    const job = await enqueueVerification(action, "build-workspace", { projectId: context.projectId, root: context.root });
    if (!job.result) throw new Error("Verification completed without a result.");
    const result = job.result;
    const ledger = await updateBuildEventLedger(result, context.root);
    return NextResponse.json({ ...result, ledger, project: context.project }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Build check failed to start.";
    return NextResponse.json({ error: message }, { status: 400 });
}
}
