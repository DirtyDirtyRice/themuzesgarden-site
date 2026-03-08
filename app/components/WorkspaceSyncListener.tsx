"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onProjectTracksChanged } from "../../lib/appEvents";
import { supabase } from "../../lib/supabaseClient";

function looksLikeUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type SyncMode = "event-only" | "event+realtime";

function setGlobalSyncDebug(partial: {
  mode?: SyncMode;
  lastRefreshTs?: number;
  lastEventTs?: number;
  lastRealtimeTs?: number;
  projectId?: string;
}) {
  if (typeof window === "undefined") return;
  const w = window as any;
  const prev = w.__muzesSync ?? {};
  w.__muzesSync = { ...prev, ...partial };
}

export default function WorkspaceSyncListener() {
  const pathname = usePathname();
  const router = useRouter();

  const refreshTimerRef = useRef<number | null>(null);
  const realtimeCleanupRef = useRef<null | (() => void)>(null);

  const projectId = useMemo(() => {
    if (typeof pathname !== "string") return "";
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("projects");
    const id = idx >= 0 ? parts[idx + 1] ?? "" : "";
    return String(id);
  }, [pathname]);

  useEffect(() => {
    const isProjectPage =
      typeof pathname === "string" && pathname.includes("/workspace/projects/");
    if (!isProjectPage) return;
    if (!looksLikeUuid(projectId)) return;

    setGlobalSyncDebug({ projectId });

    const scheduleRefresh = (source: "event" | "realtime") => {
      const now = Date.now();
      if (source === "event") setGlobalSyncDebug({ lastEventTs: now });
      if (source === "realtime") setGlobalSyncDebug({ lastRealtimeTs: now });

      if (refreshTimerRef.current) return;

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        setGlobalSyncDebug({ lastRefreshTs: Date.now() });
        router.refresh();
      }, 75);
    };

    // 1) App-level event (QuickLinkHelper emits this)
    const offEvent = onProjectTracksChanged((detail) => {
      if (detail?.projectId && detail.projectId !== projectId) return;

      const stillOnProjectPage =
        typeof window !== "undefined" &&
        typeof window.location?.pathname === "string" &&
        window.location.pathname.includes("/workspace/projects/");

      if (!stillOnProjectPage) return;

      scheduleRefresh("event");
    });

    // 2) Realtime subscription (covers mega-file changes like Unlink)
    let mode: SyncMode = "event-only";
    try {
      if (supabase?.channel) {
        const channelName = `muzes-project-tracks-${projectId}`;
        const channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "project_tracks",
              filter: `project_id=eq.${projectId}`,
            },
            () => {
              scheduleRefresh("realtime");
            }
          )
          .subscribe();

        realtimeCleanupRef.current = () => {
          try {
            supabase.removeChannel(channel);
          } catch {
            // ignore
          }
        };

        mode = "event+realtime";
      }
    } catch {
      mode = "event-only";
    }

    setGlobalSyncDebug({ mode });

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      offEvent();
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current();
        realtimeCleanupRef.current = null;
      }
    };
  }, [pathname, projectId, router]);

  return null;
}