import type { ProjectPlayerBridgeState } from "./projectDetailsTypes";

export const PROJECT_PLAYER_BRIDGE_KEY = "muzesgarden:project-player-bridge";
export const PROJECT_PLAYER_BRIDGE_EVENT = "muzesgarden:project-player-bridge-changed";

export function writeProjectPlayerBridge(state: ProjectPlayerBridgeState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PROJECT_PLAYER_BRIDGE_KEY, JSON.stringify(state));
    window.dispatchEvent(
      new CustomEvent(PROJECT_PLAYER_BRIDGE_EVENT, {
        detail: state,
      })
    );
  } catch {
    // ignore storage/event bridge errors
  }
}

export function readProjectPlayerBridge(): ProjectPlayerBridgeState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROJECT_PLAYER_BRIDGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ProjectPlayerBridgeState> | null;
    if (!parsed) return null;

    const projectId = String(parsed.projectId ?? "").trim();
    const projectTitle = String(parsed.projectTitle ?? "").trim();
    const updatedAt = String(parsed.updatedAt ?? "").trim();
    const source = parsed.source === "project-page" ? "project-page" : null;

    if (!projectId || !projectTitle || !updatedAt || !source) return null;

    const trackIds = Array.isArray(parsed.trackIds)
      ? parsed.trackIds.map((x) => String(x ?? "")).filter(Boolean)
      : [];

    return {
      projectId,
      projectTitle,
      trackIds,
      trackCount: Number(parsed.trackCount ?? trackIds.length) || trackIds.length,
      updatedAt,
      source,
    };
  } catch {
    return null;
  }
}

export function clearProjectPlayerBridge() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PROJECT_PLAYER_BRIDGE_KEY);
    window.dispatchEvent(
      new CustomEvent(PROJECT_PLAYER_BRIDGE_EVENT, {
        detail: null,
      })
    );
  } catch {
    // ignore storage/event bridge errors
  }
}