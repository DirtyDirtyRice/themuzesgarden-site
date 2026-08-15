"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTimelineDawSafeExitView, TIMELINE_DAW_LOCAL_ACTIVITY_EVENT, type TimelineDawLocalActivity } from "@/lib/timeline/TimelineDawSafeExitPolicy";
import { createTimelineDawSaveHealthView, type TimelineDawSaveHealth } from "@/lib/timeline/TimelineDawSaveHealthPolicy";

export default function TimelineDawSafeExit({ projectId, sessionId, workspaceRevision, saveHealth, onRefresh }: { projectId: string; sessionId: string; workspaceRevision: number; saveHealth: TimelineDawSaveHealth; onRefresh: () => Promise<void> }) {
  const router = useRouter();
  const [activity, setActivity] = useState({ recording: false, uploading: false });
  const view = useMemo(() => createTimelineDawSafeExitView({ workspaceRevision, ...activity }), [activity, workspaceRevision]);
  const health = useMemo(() => createTimelineDawSaveHealthView(saveHealth, workspaceRevision), [saveHealth, workspaceRevision]);

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<TimelineDawLocalActivity>).detail;
      if (detail?.sessionId === sessionId) setActivity({ recording: Boolean(detail.recording), uploading: Boolean(detail.uploading) });
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!activity.recording && !activity.uploading) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener(TIMELINE_DAW_LOCAL_ACTIVITY_EVENT, receive);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener(TIMELINE_DAW_LOCAL_ACTIVITY_EVENT, receive);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [activity.recording, activity.uploading, sessionId]);

  const healthColor = health.tone === "safe" ? "text-emerald-200" : health.tone === "danger" ? "text-red-200" : "text-amber-200";
  return <div className="flex flex-wrap items-center justify-end gap-2 text-right"><div><p className={`text-xs font-black ${healthColor}`}>{health.label}</p><p className="max-w-md text-xs text-white/55">{health.detail}</p>{view.blocker ? <p role="alert" className="text-xs text-amber-200">{view.blocker}</p> : <p className="text-xs text-white/45">Local recording is idle.</p>}</div>{health.canRefresh ? <button type="button" className="rounded-xl border border-sky-300/30 px-3 py-2 text-sm font-black text-sky-100 disabled:opacity-40" disabled={!view.canExit} onClick={() => void onRefresh()}>Refresh save state</button> : null}<button type="button" className="rounded-xl border border-white/25 bg-white px-4 py-2 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40" disabled={!view.canExit || saveHealth !== "saved"} onClick={() => router.push(`/workspace/projects/${encodeURIComponent(projectId)}`)}>Save state and return</button></div>;
}
