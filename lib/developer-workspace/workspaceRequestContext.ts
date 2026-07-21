import "server-only";

import type { NextRequest } from "next/server";

import {
  resolveActiveWorkspaceProject,
  resolveWorkspaceProject,
  type WorkspaceProjectRecord,
} from "./workspaceProjectRegistry";

export type WorkspaceRequestContext = {
  project: WorkspaceProjectRecord;
  projectId: string;
  root: string;
  explicit: boolean;
};

export function isLocalDevelopmentWorkspaceRequest(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" &&
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function requestedProjectId(request: NextRequest): string | null {
  const header = request.headers.get("x-workspace-project-id")?.trim();
  const query = request.nextUrl.searchParams.get("projectId")?.trim();
  if (header && query && header !== query) {
    throw new Error("Workspace project header and query identities do not match.");
  }
  return header || query || null;
}

export async function resolveWorkspaceRequestContext(
  request: NextRequest,
  hostRoot = process.cwd()
): Promise<WorkspaceRequestContext> {
  if (!isLocalDevelopmentWorkspaceRequest(request)) {
    throw new Error("Developer Workspace project access is available only from the local development server.");
  }
  const requested = requestedProjectId(request);
  const project = requested
    ? await resolveWorkspaceProject(requested, hostRoot)
    : await resolveActiveWorkspaceProject(hostRoot);
  return {
    project,
    projectId: project.id,
    root: project.rootPath,
    explicit: Boolean(requested),
  };
}
