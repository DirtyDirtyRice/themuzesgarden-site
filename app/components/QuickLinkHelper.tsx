"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { getSupabaseTracks } from "../../lib/getSupabaseTracks";
import {
  linkProjectTrack,
  listLinkedProjectTrackIds,
} from "../../lib/projectTracksApi";
import { emitProjectTracksChanged } from "../../lib/appEvents";

type AnyTrack = {
  id: string;
  title?: string;
  artist?: string;
  path?: string;
};

function looksLikeUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function scoreTrack(track: AnyTrack, query: string, linkedIds: Set<string>): number {
  const title = String(track?.title ?? "").toLowerCase();
  const artist = String(track?.artist ?? "").toLowerCase();
  const path = String(track?.path ?? "").toLowerCase();
  const tid = String(track?.id ?? "").toLowerCase();

  let score = 0;

  if (title === query) score += 100;
  else if (title.startsWith(query)) score += 70;
  else if (title.includes(query)) score += 40;

  if (artist === query) score += 25;
  else if (artist.startsWith(query)) score += 18;
  else if (artist.includes(query)) score += 10;

  if (path.includes(query)) score += 6;
  if (tid.includes(query)) score += 3;

  if (!linkedIds.has(String(track?.id ?? ""))) score += 20;

  return score;
}

export default function QuickLinkHelper() {
  const pathname = usePathname();
  const params = useParams() as any;

  const isProjectPage =
    typeof pathname === "string" && pathname.includes("/workspace/projects/");
  const projectId = String(params?.id ?? "");

  const [open, setOpen] = useState(false);

  const [allTracks, setAllTracks] = useState<AnyTrack[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [sel, setSel] = useState(0);
  const [status, setStatus] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const refreshSeqRef = useRef(0);
  const statusTimerRef = useRef<number | null>(null);

  const clearStatusTimer = useCallback(() => {
    if (statusTimerRef.current !== null) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const flashStatus = useCallback(
    (msg: string) => {
      setStatus(msg);
      clearStatusTimer();
      statusTimerRef.current = window.setTimeout(() => {
        setStatus("");
        statusTimerRef.current = null;
      }, 1500);
    },
    [clearStatusTimer]
  );

  const refreshLinkedOnly = useCallback(async () => {
    if (!isProjectPage) return;
    if (!looksLikeUuid(projectId)) return;

    const ids = await listLinkedProjectTrackIds(projectId);
    setLinkedIds(ids);
  }, [isProjectPage, projectId]);

  useEffect(() => {
    if (!isProjectPage) return;
    if (!looksLikeUuid(projectId)) return;

    let cancelled = false;
    const seq = ++refreshSeqRef.current;

    async function load() {
      setErr(null);
      setLoading(true);

      try {
        const [tracks, ids] = await Promise.all([
          getSupabaseTracks(),
          listLinkedProjectTrackIds(projectId),
        ]);

        if (cancelled) return;
        if (seq !== refreshSeqRef.current) return;

        const safeTracks = Array.isArray(tracks) ? (tracks as AnyTrack[]) : [];
        setAllTracks(safeTracks);
        setLinkedIds(ids);
      } catch (e: any) {
        if (cancelled) return;
        if (seq !== refreshSeqRef.current) return;
        setErr(e?.message ?? "Failed to load Quick Link helper");
      } finally {
        if (!cancelled && seq === refreshSeqRef.current) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isProjectPage, projectId]);

  useEffect(() => {
    setSel(0);
  }, [q]);

  useEffect(() => {
    function onSync() {
      refreshLinkedOnly().catch(() => {
        // ignore sync refresh errors here
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("muzes:projectTracksChanged", onSync as EventListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "muzes:projectTracksChanged",
          onSync as EventListener
        );
      }
    };
  }, [refreshLinkedOnly]);

  useEffect(() => {
    return () => {
      clearStatusTimer();
    };
  }, [clearStatusTimer]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const list = (Array.isArray(allTracks) ? allTracks : []).filter((t) => {
      const title = String(t?.title ?? "").toLowerCase();
      const artist = String(t?.artist ?? "").toLowerCase();
      const path = String(t?.path ?? "").toLowerCase();
      const tid = String(t?.id ?? "").toLowerCase();

      return (
        title.includes(query) ||
        artist.includes(query) ||
        path.includes(query) ||
        tid.includes(query)
      );
    });

    return list
      .slice()
      .sort((a, b) => {
        const scoreDiff = scoreTrack(b, query, linkedIds) - scoreTrack(a, query, linkedIds);
        if (scoreDiff !== 0) return scoreDiff;

        const aTitle = String(a?.title ?? "");
        const bTitle = String(b?.title ?? "");
        return aTitle.localeCompare(bTitle, undefined, { sensitivity: "base" });
      })
      .slice(0, 6);
  }, [q, allTracks, linkedIds]);

  async function doLink(trackId: string) {
    setErr(null);

    if (!looksLikeUuid(projectId)) {
      setErr("Invalid project id format.");
      return;
    }
    if (!trackId) return;

    if (linkedIds.has(trackId)) {
      flashStatus("Already linked");
      return;
    }

    setBusyId(trackId);

    setLinkedIds((prev) => {
      const next = new Set(prev);
      next.add(trackId);
      return next;
    });

    try {
      await linkProjectTrack(projectId, trackId);

      emitProjectTracksChanged({
        projectId,
        action: "link",
        trackId,
      });

      await refreshLinkedOnly();

      flashStatus("Linked ✓");
      setQ("");
      setSel(0);

      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e: any) {
      setLinkedIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      setErr(e?.message ?? "Link failed");
    } finally {
      setBusyId(null);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key;

    if (key === "ArrowDown") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setSel((prev) => Math.min(suggestions.length - 1, prev + 1));
      return;
    }

    if (key === "ArrowUp") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setSel((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key === "Enter") {
      const picked = suggestions[sel] ?? suggestions[0];
      const tid = String(picked?.id ?? "");
      if (!tid) return;

      e.preventDefault();
      doLink(tid);
      return;
    }

    if (key === "Escape") {
      if (q.trim()) {
        e.preventDefault();
        setQ("");
        setSel(0);
        flashStatus("Cleared");
        return;
      }
      e.preventDefault();
      setOpen(false);
    }
  }

  if (!isProjectPage) return null;

  const hasQuery = Boolean(q.trim());
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="fixed bottom-6 left-6 z-[70]">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-black text-white px-4 py-2 shadow"
          title="Quick Link Helper (Enter to link selected result)"
        >
          ＋ Quick Link
        </button>
      )}

      {open && (
        <div className="rounded-xl border bg-white p-4 shadow-xl space-y-3 w-80">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Quick Link</div>
            <button
              onClick={() => setOpen(false)}
              className="rounded border px-2 py-1 text-xs"
              title="Close (Esc when empty)"
            >
              Close
            </button>
          </div>

          <div className="text-sm text-zinc-600">
            Type part of a track name. Use{" "}
            <span className="font-medium">↑/↓</span> then{" "}
            <span className="font-medium">Enter</span> to link.
          </div>

          <input
            ref={inputRef}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Search tracks to link…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
          />

          {loading && <div className="text-xs text-zinc-500">Loading tracks…</div>}
          {err && <div className="text-xs text-red-600">{err}</div>}

          {status && (
            <div className="text-[11px] rounded-lg border bg-zinc-50 px-3 py-2 text-zinc-700">
              {status}
            </div>
          )}

          {!hasQuery ? (
            <div className="text-xs text-zinc-500">Start typing to see suggestions.</div>
          ) : !hasSuggestions ? (
            <div className="text-xs text-zinc-500">No matches.</div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((t, idx) => {
                const tid = String(t.id);
                const isLinked = linkedIds.has(tid);
                const isSelected = idx === sel;

                return (
                  <div
                    key={tid}
                    className={[
                      "rounded border p-3 flex items-center justify-between gap-3",
                      isSelected ? "ring-2 ring-black/20 bg-zinc-50" : "",
                    ].join(" ")}
                    onMouseEnter={() => setSel(idx)}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {isSelected ? "↵ " : ""}
                        {t.title ?? "Untitled"}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {t.artist ?? "Supabase"}
                      </div>
                    </div>

                    {isLinked ? (
                      <div className="text-[11px] px-2 py-1 rounded-full border bg-white text-zinc-600">
                        Linked
                      </div>
                    ) : (
                      <button
                        className="rounded bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
                        onClick={() => doLink(tid)}
                        disabled={busyId === tid}
                        title="Link into this project"
                      >
                        {busyId === tid ? "..." : "Link"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[11px] text-zinc-500">
            Project:{" "}
            {looksLikeUuid(projectId) ? projectId : "(not detected yet — open a project page)"}
          </div>
        </div>
      )}
    </div>
  );
}