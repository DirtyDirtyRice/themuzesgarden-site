import { NextRequest, NextResponse } from "next/server";

import {
  readWorkspaceProjectRegistry,
  registerWorkspaceProject,
  selectWorkspaceProject,
} from "@/lib/developer-workspace/workspaceProjectRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function localDevelopment(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

export async function GET(request: NextRequest) {
  if (!localDevelopment(request)) {
    return NextResponse.json(
      { error: "Workspace projects are available only from the local development server." },
      { status: 403 }
    );
  }
  try {
    const registry = await readWorkspaceProjectRegistry();
    const projects = Object.values(registry.projects).sort(
      (left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt) || left.name.localeCompare(right.name)
    );
    return NextResponse.json(
      {
        activeProjectId: registry.activeProjectId,
        projects,
        count: projects.length,
        updatedAt: registry.updatedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workspace projects could not be read." },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!localDevelopment(request)) {
    return NextResponse.json(
      { error: "Workspace project changes are available only from the local development server." },
      { status: 403 }
    );
  }
  try {
    const payload: unknown = await request.json();
    if (typeof payload !== "object" || payload === null) throw new Error("Workspace project request is required.");
    const candidate = payload as Record<string, unknown>;
    const action = requiredString(candidate.action, "Workspace project action");
    if (action === "register") {
      return NextResponse.json(await registerWorkspaceProject(requiredString(candidate.path, "Project directory")));
    }
    if (action === "select") {
      const project = await selectWorkspaceProject(requiredString(candidate.projectId, "Project id"));
      return NextResponse.json({ project, activeProjectId: project.id });
    }
    throw new Error("Workspace project action must be register or select.");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workspace project request failed." },
      { status: 400 }
    );
  }
}
