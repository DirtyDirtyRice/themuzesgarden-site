import { requireProjectSupabase } from "./projectSupabase";
import type { DawSession, DawSessionAction, DawSnapshot } from "./projectDawTypes";

async function accessToken(): Promise<string> {
  const { data, error } = await requireProjectSupabase().auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Your member session expired. Sign in again to use Studio.");
  return token;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Studio request failed.");
  return body as T;
}

export function loadDawSnapshot(projectId: string): Promise<DawSnapshot> {
  return request(`/api/timeline/daw-workspaces?projectId=${encodeURIComponent(projectId)}`);
}

export async function openDawSession(input: {
  projectId: string;
  songId: string;
  name: string;
  expectedWorkspaceRevision: number;
}) {
  return request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
    "/api/timeline/daw-workspaces",
    { method: "POST", body: JSON.stringify({ action: "open", ...input }) },
  );
}

export async function changeDawSession(input: {
  action: DawSessionAction;
  sessionId: string;
  expectedSessionRevision: number;
  expectedWorkspaceRevision: number;
}) {
  return request<{ receipt: { workspaceRevision: number; session: DawSession } }>(
    "/api/timeline/daw-workspaces",
    { method: "POST", body: JSON.stringify(input) },
  );
}
