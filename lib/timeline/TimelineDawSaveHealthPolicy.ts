export type TimelineDawSaveHealth = "saved" | "saving" | "stale" | "conflicted";

export function createTimelineDawSaveHealthView(state: TimelineDawSaveHealth, workspaceRevision: number) {
  const revision = Math.max(0, Math.floor(workspaceRevision));
  if (state === "saving") return { tone: "working", label: "Saving…", detail: `Updating durable workspace revision ${revision}.`, canRefresh: false } as const;
  if (state === "conflicted") return { tone: "danger", label: "Newer changes found", detail: "Refresh authoritative session state before making another revision-safe change.", canRefresh: true } as const;
  if (state === "stale") return { tone: "warning", label: "Save state needs checking", detail: "The last workspace request did not complete. Refresh before relying on this status.", canRefresh: true } as const;
  return { tone: "safe", label: "Saved", detail: `Durable workspace revision ${revision} is current.`, canRefresh: false } as const;
}
