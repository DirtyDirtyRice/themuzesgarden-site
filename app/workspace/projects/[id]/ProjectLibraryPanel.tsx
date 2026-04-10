"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getProjectTrackSourceLabel,
  getProjectTrackVisibilityLabel,
} from "./projectTrackDecorators";

type AnyTrack = {
  id: string;
  title?: string;
  artist?: string;
  path?: string;
  url?: string;
  storage_path?: string;
  file_path?: string;
  mp3?: string;
  tags?: string[];
  visibility?: "private" | "shared" | "public";
};

type FilterMode = "all" | "linked" | "unlinked";

function getTrackTags(t: AnyTrack): string[] {
  const raw = (t as any)?.tags;
  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(
      raw
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
    )
  );
}

function scoreTrack(t: AnyTrack, query: string, isLinked: boolean) {
  const title = String(t?.title ?? "").toLowerCase();
  const artist = String(t?.artist ?? "").toLowerCase();
  const path = String(t?.path ?? "").toLowerCase();
  const tid = String(t?.id ?? "").toLowerCase();
  const tags = getTrackTags(t).map((x) => x.toLowerCase());

  let score = 0;

  if (!query) score += isLinked ? 5 : 10;

  if (query) {
    if (title === query) score += 100;
    else if (title.startsWith(query)) score += 70;
    else if (title.includes(query)) score += 35;

    if (artist === query) score += 20;
    else if (artist.startsWith(query)) score += 14;
    else if (artist.includes(query)) score += 8;

    for (const tag of tags) {
      if (tag === query) score += 24;
      else if (tag.startsWith(query)) score += 16;
      else if (tag.includes(query)) score += 10;
    }

    if (path.includes(query)) score += 4;
    if (tid.includes(query)) score += 2;
  }

  if (!isLinked) score += 10;

  return score;
}

function hasPlayableSource(track: AnyTrack | null | undefined) {
  if (!track) return false;

  return Boolean(
    String(track.path ?? "").trim() ||
      String(track.url ?? "").trim() ||
      String(track.storage_path ?? "").trim() ||
      String(track.file_path ?? "").trim() ||
      String(track.mp3 ?? "").trim()
  );
}

export default function ProjectLibraryPanel(props: {
  allTracks: AnyTrack[];
  linkedTrackIds: Set<string>;

  loadingLibrary: boolean;
  linkBusyId: string | null;

  linkTrack: (trackId: string) => void;
  unlinkTrack: (trackId: string) => void;

  onPlayTrackById: (trackId: string) => void;
}) {
  const {
    allTracks,
    linkedTrackIds,
    loadingLibrary,
    linkBusyId,
    linkTrack,
    unlinkTrack,
    onPlayTrackById,
  } = props;

  const [q, setQ] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);

  const visibleTracks = useMemo(() => {
    return (Array.isArray(allTracks) ? allTracks : []).filter(
      (t) => t.visibility !== "private"
    );
  }, [allTracks]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = visibleTracks;

    if (mode === "linked") {
      list = list.filter((t) => linkedTrackIds.has(String(t?.id)));
    } else if (mode === "unlinked") {
      list = list.filter((t) => !linkedTrackIds.has(String(t?.id)));
    }

    const mapped = list
      .map((t) => {
        const isLinked = linkedTrackIds.has(String(t?.id));

        if (!query) {
          return {
            t,
            score: scoreTrack(t, query, isLinked),
          };
        }

        const title = String(t?.title ?? "").toLowerCase();
        const artist = String(t?.artist ?? "").toLowerCase();
        const path = String(t?.path ?? "").toLowerCase();
        const tid = String(t?.id ?? "").toLowerCase();
        const tags = getTrackTags(t).map((x) => x.toLowerCase());

        const matches =
          title.includes(query) ||
          artist.includes(query) ||
          path.includes(query) ||
          tid.includes(query) ||
          tags.some((tag) => tag.includes(query));

        if (!matches) return null;

        return {
          t,
          score: scoreTrack(t, query, isLinked),
        };
      })
      .filter(Boolean) as { t: AnyTrack; score: number }[];

    return mapped
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const aTitle = String(a.t?.title ?? "");
        const bTitle = String(b.t?.title ?? "");
        const byTitle = aTitle.localeCompare(bTitle, undefined, {
          sensitivity: "base",
        });
        if (byTitle !== 0) return byTitle;

        return String(a.t?.id ?? "").localeCompare(
          String(b.t?.id ?? ""),
          undefined,
          {
            sensitivity: "base",
          }
        );
      })
      .map((x) => x.t);
  }, [visibleTracks, linkedTrackIds, q, mode]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [q, mode]);

  useEffect(() => {
    setSelectedIdx((prev) => {
      if (!filtered.length) return 0;
      return Math.max(0, Math.min(prev, filtered.length - 1));
    });
  }, [filtered]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const row = listEl.children[selectedIdx] as HTMLElement | undefined;
    if (!row) return;

    row.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIdx, filtered]);

  const linkedCount = linkedTrackIds.size;
  const showingCount = filtered.length;

  const chip = (label: string, active: boolean) =>
    [
      "text-xs px-2 py-1 rounded border",
      active ? "bg-black text-white" : "bg-white",
    ].join(" ");

  function handlePrimaryAction(trackId: string) {
    if (!trackId) return;
    const isLinked = linkedTrackIds.has(trackId);
    if (isLinked) {
      unlinkTrack(trackId);
    } else {
      linkTrack(trackId);
    }
  }

  function handlePlayTrack(track: AnyTrack | null | undefined) {
    if (!track) return;
    if (!hasPlayableSource(track)) return;

    const tid = String(track?.id ?? "");
    if (!tid) return;

    onPlayTrackById(tid);
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="sticky top-0 z-10 bg-white space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="text-sm font-medium">Library</div>
            <div className="text-xs text-zinc-500">
              Linked: {linkedCount} • Showing: {showingCount}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              className={chip("All", mode === "all")}
              onClick={() => setMode("all")}
            >
              All
            </button>
            <button
              type="button"
              className={chip("Linked", mode === "linked")}
              onClick={() => setMode("linked")}
            >
              Linked
            </button>
            <button
              type="button"
              className={chip("Unlinked", mode === "unlinked")}
              onClick={() => setMode("unlinked")}
            >
              Unlinked
            </button>
          </div>
        </div>

        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Search project library, artist, or tag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (!filtered.length) {
              if (e.key === "Escape" && q.trim()) {
                e.preventDefault();
                setQ("");
              }
              return;
            }

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelectedIdx((prev) =>
                filtered.length <= 0 ? 0 : (prev + 1) % filtered.length
              );
              return;
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelectedIdx((prev) =>
                filtered.length <= 0
                  ? 0
                  : (prev - 1 + filtered.length) % filtered.length
              );
              return;
            }

            if (e.key === "Enter") {
              e.preventDefault();
              const picked = filtered[selectedIdx];
              const tid = String(picked?.id ?? "");
              handlePrimaryAction(tid);
              return;
            }

            if (e.key.toLowerCase() === "p") {
              e.preventDefault();
              const picked = filtered[selectedIdx];
              handlePlayTrack(picked);
              return;
            }

            if (e.key === "Escape" && q.trim()) {
              e.preventDefault();
              setQ("");
            }
          }}
        />

        <div className="text-[11px] text-zinc-500">
          Keys: ↑ ↓ select • Enter link/unlink • P play selected • Esc clear
          search
        </div>
      </div>

      {loadingLibrary && visibleTracks.length === 0 ? (
        <div className="text-sm text-zinc-600">Loading…</div>
      ) : visibleTracks.length === 0 ? (
        <div className="text-sm text-zinc-600">No tracks found in Library.</div>
      ) : showingCount === 0 ? (
        <div className="text-sm text-zinc-600">
          No matches{mode !== "all" ? ` for ${mode}` : ""}. Try a different
          search.
        </div>
      ) : (
        <div
          ref={listRef}
          className="space-y-2 max-h-[420px] overflow-y-auto pr-1"
        >
          {filtered.map((t, idx) => {
            const tid = String(t.id);
            const isLinked = linkedTrackIds.has(tid);
            const isSelected = idx === selectedIdx;
            const tags = getTrackTags(t);
            const playable = hasPlayableSource(t);

            return (
              <div
                key={tid}
                className={[
                  "rounded border p-3 flex items-center justify-between gap-3",
                  isSelected
                    ? "ring-2 ring-blue-200 border-blue-300 bg-blue-50/40"
                    : "",
                ].join(" ")}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handlePrimaryAction(tid)}
                  title={isLinked ? "Click row to unlink" : "Click row to link"}
                >
                  <div className="text-sm font-medium truncate">
                    {isSelected ? "↵ " : ""}
                    {t.title ?? "Untitled"}
                  </div>

                  {t.artist ? (
                    <div className="text-xs text-zinc-500 truncate">
                      {t.artist}
                    </div>
                  ) : null}

                  <div className="mt-1 text-[10px] text-zinc-400">
                    Source: {getProjectTrackSourceLabel(t)} • Visibility:{" "}
                    {getProjectTrackVisibilityLabel(t)}
                  </div>

                  {tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.slice(0, 6).map((tag) => (
                        <button
                          key={`${tid}:${tag}`}
                          type="button"
                          className="rounded border bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQ(tag);
                          }}
                          title={`Search tag: ${tag}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="rounded border px-3 py-2 text-xs disabled:opacity-50"
                    onClick={() => handlePlayTrack(t)}
                    disabled={!playable}
                    title={
                      playable
                        ? "Play in Global Player"
                        : "This track has no playable source"
                    }
                  >
                    Play
                  </button>

                  {isLinked ? (
                    <>
                      <div className="text-xs text-green-700">
                        {linkBusyId === tid ? "..." : "Linked"}
                      </div>
                      <button
                        type="button"
                        className="rounded border px-3 py-2 text-xs disabled:opacity-60"
                        onClick={() => unlinkTrack(tid)}
                        disabled={linkBusyId === tid}
                        title="Remove from this project"
                      >
                        {linkBusyId === tid ? "..." : "Unlink"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded bg-black px-3 py-2 text-xs text-white disabled:opacity-60"
                      onClick={() => linkTrack(tid)}
                      disabled={linkBusyId === tid}
                      title="Link into this project"
                    >
                      {linkBusyId === tid ? "..." : "Link"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}