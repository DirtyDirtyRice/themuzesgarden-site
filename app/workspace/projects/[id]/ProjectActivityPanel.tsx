"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  APP_EVENT_ACTIVITY_UPDATED,
  type ActivityItem,
  readProjectActivity,
  emitActivityTrackJump,
} from "../../../../lib/projectActivity";

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "recent";
  }
}

function typeLabel(type: ActivityItem["type"]) {
  switch (type) {
    case "play":
      return "Play";
    case "link":
      return "Link";
    case "unlink":
      return "Unlink";
    case "note":
      return "Note";
    default:
      return "Event";
  }
}

function typeClasses(type: ActivityItem["type"]) {
  switch (type) {
    case "play":
      return "bg-black text-white border-black";
    case "link":
      return "bg-zinc-100 text-zinc-900 border-zinc-300";
    case "unlink":
      return "bg-zinc-100 text-zinc-900 border-zinc-300";
    case "note":
      return "bg-zinc-100 text-zinc-900 border-zinc-300";
    default:
      return "bg-zinc-100 text-zinc-900 border-zinc-300";
  }
}

function getProjectIdFromPathname(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("projects");
  const id = idx >= 0 ? parts[idx + 1] ?? "" : "";
  return id ? String(id) : null;
}

export default function ProjectActivityPanel() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = getProjectIdFromPathname(window.location.pathname);
    if (!id) {
      setProjectId(null);
      setItems([]);
      return;
    }

    const activeProjectId = String(id);
    setProjectId(activeProjectId);

    function loadActivity(markUpdated = false) {
      setItems(readProjectActivity(activeProjectId));
      if (markUpdated) {
        setLastUpdatedAt(Date.now());
      }
    }

    function onActivityUpdated(event: Event) {
      const custom = event as CustomEvent<{ projectId?: string }>;
      if (custom.detail?.projectId === activeProjectId) {
        loadActivity(true);
      }
    }

    loadActivity(false);

    window.addEventListener(
      APP_EVENT_ACTIVITY_UPDATED,
      onActivityUpdated as EventListener
    );

    return () => {
      window.removeEventListener(
        APP_EVENT_ACTIVITY_UPDATED,
        onActivityUpdated as EventListener
      );
    };
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.time - a.time);
  }, [items]);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    if (!listRef.current) return;
    if (sortedItems.length === 0) return;

    listRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [lastUpdatedAt, sortedItems.length]);

  function clearActivity() {
    if (!projectId) return;

    localStorage.removeItem(`muzesgarden:activity:${projectId}`);
    setItems([]);
    setLastUpdatedAt(0);
  }

  function jumpToTrack(item: ActivityItem) {
    if (!projectId) return;
    if (!item.trackId) return;

    emitActivityTrackJump(projectId, item.trackId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium">Activity Timeline</div>
          <div className="text-xs text-zinc-500">Events: {sortedItems.length}</div>
        </div>

        <button
          className="rounded border px-2 py-1 text-xs"
          onClick={clearActivity}
        >
          Clear
        </button>
      </div>

      <div className="text-sm text-zinc-600">
        Timeline of changes, sessions, and playback events for this project.
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-zinc-500">
          No activity yet. Play a track, link or unlink a track, or edit a note and it
          will appear here automatically.
        </div>
      ) : (
        <div ref={listRef} className="max-h-[28rem] overflow-y-auto space-y-2 pr-1">
          {sortedItems.map((item, idx) => {
            const canJump = !!item.trackId;
            const isNewest = idx === 0;

            return (
              <div
                key={item.id}
                className={[
                  "rounded-lg border p-3 space-y-2",
                  canJump ? "cursor-pointer hover:bg-zinc-50" : "opacity-90",
                  isNewest ? "border-black bg-zinc-50" : "",
                ].join(" ")}
                onClick={canJump ? () => jumpToTrack(item) : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium ${typeClasses(
                          item.type
                        )}`}
                      >
                        {typeLabel(item.type)}
                      </span>

                      {isNewest ? (
                        <span className="text-[10px] rounded border bg-white px-2 py-0.5 font-medium text-zinc-700">
                          NEWEST
                        </span>
                      ) : null}

                      {canJump ? (
                        <span className="text-[10px] text-green-600 font-medium">
                          Click to jump
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Older event</span>
                      )}
                    </div>

                    <div className="text-sm break-words">{item.label}</div>
                  </div>

                  <div className="shrink-0 text-xs text-zinc-500">
                    {formatTime(item.time)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-zinc-500">
        Activity automatically logs important project actions.
      </div>
    </div>
  );
}
