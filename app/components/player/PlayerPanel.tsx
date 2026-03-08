"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack, PlayerTab } from "./playerTypes";
import { getSectionTags, getTrackTags, isTypingTarget } from "./playerUtils";
import ProjectTab from "./ProjectTab";
import SearchTab from "./SearchTab";

const LS_COMPACT_KEY = "muzes.globalPlayer.compact.v1";

function fmtTime(sec: number): string {
  const s = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function emitTagSearch(tag: string) {
  const clean = String(tag).trim();
  if (!clean) return;

  window.dispatchEvent(
    new CustomEvent("muzesgarden-search-tag", {
      detail: { tag: clean },
    })
  );
}

function getTagOriginLabel(trackCount: number, sectionCount: number): string {
  if (trackCount > 0 && sectionCount > 0) return "Track + Moment";
  if (sectionCount > 0) return "Moment";
  return "Track";
}

export default function PlayerPanel(props: {
  open: boolean;
  setOpen: (v: boolean) => void;

  tab: PlayerTab;
  setTab: (t: PlayerTab) => void;

  onProjectPage: boolean;

  nowLabel: string;

  audioEl: React.ReactNode;

  onPrev: () => void;
  onToggle: () => void;
  onStop: () => void;
  onNext: () => void;
  onResume: () => void;

  onPlayAll: () => void;
  onClearNow: () => void;
  statusTime: string;
  statusVolPct: number;

  projectTracks: AnyTrack[];
  loadingProject: boolean;
  projectErr: string | null;
  onRefreshProject: () => void;

  nowId: string | null;
  shuffle: boolean;
  setShuffle: (v: (prev: boolean) => boolean) => void;
  loop: boolean;
  setLoop: (v: (prev: boolean) => boolean) => void;

  onMoveUp: (trackId: string) => void;
  onMoveDown: (trackId: string) => void;
  onMoveToIndex: (trackId: string, toIndex: number) => void;
  onResetOrder: () => void;
  onJumpToNow: () => void;
  listRef: React.RefObject<HTMLDivElement | null>;

  onPlayFromHere: (t: AnyTrack) => void;

  q: string;
  setQ: (v: string) => void;
  allTracks: AnyTrack[];
  onPlayTrack: (t: AnyTrack) => void;
}) {
  const {
    open,
    setOpen,
    tab,
    setTab,
    onProjectPage,

    nowLabel,
    audioEl,

    onPrev,
    onToggle,
    onStop,
    onNext,
    onResume,

    onPlayAll,
    onClearNow,
    statusTime,
    statusVolPct,

    projectTracks,
    loadingProject,
    projectErr,
    onRefreshProject,

    nowId,
    shuffle,
    setShuffle,
    loop,
    setLoop,

    onMoveUp,
    onMoveDown,
    onMoveToIndex,
    onResetOrder,
    onJumpToNow,
    listRef,

    onPlayFromHere,

    q,
    setQ,
    allTracks,
    onPlayTrack,
  } = props;

  const trackCount = tab === "project" ? projectTracks.length : allTracks.length;
  const trackCountLabel = tab === "project" ? `Setlist ${trackCount}` : `Library ${trackCount}`;

  const hasNow = Boolean(nowId);
  const isProjectTab = tab === "project";
  const canUseProject = isProjectTab && onProjectPage;
  const hasProjectTracks = projectTracks.length > 0;

  const nowIdx = useMemo(() => {
    if (!nowId) return -1;
    const needle = String(nowId);
    return projectTracks.findIndex((t) => String(t.id) === needle);
  }, [projectTracks, nowId]);

  const upNextIdx = nowIdx >= 0 ? nowIdx + 1 : -1;
  const remainingCount =
    nowIdx >= 0 ? Math.max(0, projectTracks.length - (nowIdx + 1)) : projectTracks.length;

  const atProjectStart = isProjectTab && hasNow && nowIdx === 0 && !shuffle;
  const atProjectEnd =
    isProjectTab &&
    hasNow &&
    projectTracks.length > 0 &&
    nowIdx === projectTracks.length - 1 &&
    !shuffle &&
    !loop;

  const topTags = useMemo(() => {
    const counts = new Map<
      string,
      {
        total: number;
        trackCount: number;
        sectionCount: number;
      }
    >();

    for (const track of allTracks) {
      for (const tag of getTrackTags(track)) {
        const key = String(tag).trim();
        if (!key) continue;

        const prev = counts.get(key) ?? {
          total: 0,
          trackCount: 0,
          sectionCount: 0,
        };

        counts.set(key, {
          total: prev.total + 1,
          trackCount: prev.trackCount + 1,
          sectionCount: prev.sectionCount,
        });
      }

      for (const tag of getSectionTags(track)) {
        const key = String(tag).trim();
        if (!key) continue;

        const prev = counts.get(key) ?? {
          total: 0,
          trackCount: 0,
          sectionCount: 0,
        };

        counts.set(key, {
          total: prev.total + 1,
          trackCount: prev.trackCount,
          sectionCount: prev.sectionCount + 1,
        });
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => {
        if (b[1].total !== a[1].total) return b[1].total - a[1].total;
        if (b[1].sectionCount !== a[1].sectionCount) {
          return b[1].sectionCount - a[1].sectionCount;
        }
        return a[0].localeCompare(b[0], undefined, { sensitivity: "base" });
      })
      .slice(0, 18)
      .map(([tag, meta]) => ({
        tag,
        total: meta.total,
        trackCount: meta.trackCount,
        sectionCount: meta.sectionCount,
        originLabel: getTagOriginLabel(meta.trackCount, meta.sectionCount),
      }));
  }, [allTracks]);

  const [navTick, setNavTick] = useState<{ prev: number; next: number }>({
    prev: 0,
    next: 0,
  });

  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_COMPACT_KEY);
      setCompact(raw === "1");
    } catch {
      // ignore
    }
  }, []);

  function toggleCompact() {
    setCompact((v) => {
      const next = !v;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LS_COMPACT_KEY, next ? "1" : "0");
        } catch {
          // ignore
        }
      }
      return next;
    });
  }

  const audioHostRef = useRef<HTMLDivElement | null>(null);
  const audioDomRef = useRef<HTMLAudioElement | null>(null);

  const [durSec, setDurSec] = useState<number>(0);
  const [curSec, setCurSec] = useState<number>(0);

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekSec, setSeekSec] = useState<number>(0);

  useEffect(() => {
    const host = audioHostRef.current;
    if (!host) return;

    const el = host.querySelector("audio") as HTMLAudioElement | null;
    audioDomRef.current = el;

    if (!el) {
      setDurSec(0);
      setCurSec(0);
      return;
    }

    function pull() {
      const d = Number.isFinite(el.duration) ? el.duration : 0;
      const c = Number.isFinite(el.currentTime) ? el.currentTime : 0;
      setDurSec(d > 0 ? d : 0);

      if (!isSeeking) setCurSec(c >= 0 ? c : 0);
    }

    pull();

    el.addEventListener("loadedmetadata", pull);
    el.addEventListener("durationchange", pull);
    el.addEventListener("timeupdate", pull);

    return () => {
      el.removeEventListener("loadedmetadata", pull);
      el.removeEventListener("durationchange", pull);
      el.removeEventListener("timeupdate", pull);
    };
  }, [audioEl, open, isSeeking]);

  function commitSeek(sec: number) {
    const el = audioDomRef.current;
    if (!el) return;

    const d = Number.isFinite(el.duration) ? el.duration : 0;
    const clamped = Math.max(0, Math.min(d > 0 ? d : sec, sec));

    try {
      el.currentTime = clamped;
      setCurSec(clamped);
    } catch {
      // ignore
    }
  }

  function finishSeek() {
    if (!isSeeking) return;
    commitSeek(seekSec);
    setIsSeeking(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (tab !== "project") return;
      if (isTypingTarget(e.target)) return;

      if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        onJumpToNow();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, tab, onJumpToNow]);

  if (!open) {
    return (
      <div className="fixed bottom-6 right-6 z-[80]">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-black text-white px-4 py-2 shadow"
          title="Open Global Player"
        >
          ▶ Global Player
        </button>
      </div>
    );
  }

  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-[80] max-w-[92vw]",
        compact ? "w-[320px]" : "w-[420px]",
      ].join(" ")}
    >
      <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Global Player</div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs px-2 py-1 rounded border"
              onClick={toggleCompact}
              title={compact ? "Switch to full mode" : "Switch to mini mode"}
            >
              {compact ? "Full" : "Mini"}
            </button>

            {!compact && (
              <>
                <button
                  className={[
                    "text-xs px-2 py-1 rounded border",
                    tab === "project" ? "bg-black text-white" : "bg-white",
                    !onProjectPage ? "opacity-50" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (!onProjectPage) return;
                    setTab("project");
                  }}
                  disabled={!onProjectPage}
                  title={onProjectPage ? "Project setlist" : "Open a project page to enable Project tab"}
                >
                  Project
                </button>
                <button
                  className={[
                    "text-xs px-2 py-1 rounded border",
                    tab === "search" ? "bg-black text-white" : "bg-white",
                  ].join(" ")}
                  onClick={() => setTab("search")}
                  title="Search library"
                >
                  Search
                </button>
              </>
            )}

            <button
              onClick={() => setOpen(false)}
              className="text-xs px-2 py-1 rounded border"
              title="Close Global Player"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-zinc-50 px-3 py-2">
            <div className="text-[11px] text-zinc-700">
              <span className="font-medium">{tab === "project" ? "Project Mode" : "Search Mode"}</span>
              {" • "}
              <span>Shuffle: {shuffle ? "On" : "Off"}</span>
              {" • "}
              <span>Loop: {loop ? "On" : "Off"}</span>
            </div>

            <div className="text-[11px] text-zinc-700">
              <span>Vol {statusVolPct}%</span>
              {" • "}
              <span>{statusTime}</span>
              {" • "}
              <span>{trackCountLabel}</span>
            </div>
          </div>

          {!compact && !onProjectPage && tab === "project" && (
            <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
              Project mode becomes available when you open a project workspace page.
            </div>
          )}

          {!compact && canUseProject && hasProjectTracks && (
            <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
              Rehearsal keys: <span className="font-medium">↑ ↓</span> select row •{" "}
              <span className="font-medium">Enter</span> play from selected •{" "}
              <span className="font-medium">Space</span> play selected
            </div>
          )}

          {!compact && tab === "search" && topTags.length > 0 && (
            <div className="rounded-xl border bg-zinc-50 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium text-zinc-700">
                  Top Tag Intelligence
                </div>
                <div className="text-[10px] text-zinc-500">
                  Track + moment tag frequency
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {topTags.map(({ tag, total, trackCount, sectionCount, originLabel }) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded border bg-white px-2 py-1 text-[10px] text-zinc-700 hover:bg-zinc-100"
                    onClick={() => {
                      setTab("search");
                      setQ(tag);
                      emitTagSearch(tag);
                    }}
                    title={`Search tag: ${tag} • source: ${originLabel} • track tags: ${trackCount} • moment tags: ${sectionCount}`}
                  >
                    {tag} ({total})
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                {topTags.slice(0, 6).map(({ tag, originLabel }) => (
                  <div
                    key={`${tag}:${originLabel}`}
                    className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500"
                    title={`${tag} source`}
                  >
                    {tag}: {originLabel}
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-zinc-500">
                Counts include both whole-track tags and indexed sound-moment tags.
              </div>
            </div>
          )}

          <div
            className={[
              "rounded-2xl border px-3 py-3",
              nowLabel ? "bg-white text-zinc-900" : "bg-zinc-50 text-zinc-600",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-zinc-600">NOW PLAYING</div>
              {nowLabel ? (
                <div className="text-[11px] px-2 py-0.5 rounded-full border bg-zinc-50 text-zinc-700">
                  LIVE
                </div>
              ) : (
                <div className="text-[11px] px-2 py-0.5 rounded-full border bg-white text-zinc-600">
                  IDLE
                </div>
              )}
            </div>

            <div className="mt-1 text-sm">
              <span className={nowLabel ? "font-semibold" : ""}>{nowLabel || "(none)"}</span>
            </div>

            {compact && (
              <div className="mt-2 text-[11px] text-zinc-600">
                <span>{tab === "project" ? "Project" : "Search"}</span>
                {" • "}
                <span>{trackCountLabel}</span>
              </div>
            )}

            {canUseProject && hasProjectTracks && (
              <div className="mt-2 text-[11px] text-zinc-600">
                <span className="font-medium">
                  Now: {nowIdx >= 0 ? String(nowIdx + 1).padStart(2, "0") : "--"}
                </span>
                {" • "}
                <span>
                  Up Next:{" "}
                  {upNextIdx >= 0 && upNextIdx < projectTracks.length
                    ? String(upNextIdx + 1).padStart(2, "0")
                    : "--"}
                </span>
                {" • "}
                <span>Remaining: {remainingCount}</span>
              </div>
            )}

            {!compact && canUseProject && hasProjectTracks && !hasNow && (
              <div className="mt-2 text-[11px] text-zinc-600">
                Tip: Press <span className="font-medium">Play All</span> to start the setlist.
              </div>
            )}

            {!compact && tab === "search" && !hasNow && (
              <div className="mt-2 text-[11px] text-zinc-600">
                Tip: Search for a track below, click a tag, then press <span className="font-medium">Enter</span> or click <span className="font-medium">Play</span>.
              </div>
            )}
          </div>

          <div ref={audioHostRef}>{audioEl}</div>

          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={Math.max(0, durSec)}
              step={0.01}
              value={isSeeking ? seekSec : curSec}
              disabled={!durSec || durSec <= 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setIsSeeking(true);
                setSeekSec(Number.isFinite(v) ? v : 0);
              }}
              onMouseUp={finishSeek}
              onTouchEnd={finishSeek}
              onPointerUp={finishSeek}
              onBlur={finishSeek}
              onKeyUp={(e) => {
                if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                  finishSeek();
                }
              }}
              className="w-full"
              title="Scrub / seek"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-600">
              <span>{fmtTime(isSeeking ? seekSec : curSec)}</span>
              <span>{durSec > 0 ? fmtTime(durSec) : "--:--"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-50"
              onClick={() => {
                if (tab === "project") setNavTick((s) => ({ ...s, prev: s.prev + 1 }));
                onPrev();
              }}
              disabled={(isProjectTab && !hasNow) || atProjectStart}
              title={
                atProjectStart
                  ? "Already at start of setlist"
                  : isProjectTab && !hasNow
                  ? "Start playback first"
                  : "Previous track"
              }
            >
              Prev
            </button>

            <button
              className="rounded border px-3 py-2 text-sm"
              onClick={onToggle}
              title="Play / Pause (Space)"
            >
              Play/Pause
            </button>

            <button className="rounded border px-3 py-2 text-sm" onClick={onStop} title="Stop playback">
              Stop
            </button>

            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-50"
              onClick={() => {
                if (tab === "project") setNavTick((s) => ({ ...s, next: s.next + 1 }));
                onNext();
              }}
              disabled={(isProjectTab && !hasNow) || atProjectEnd}
              title={
                atProjectEnd
                  ? "Already at end of setlist"
                  : isProjectTab && !hasNow
                  ? "Start playback first"
                  : "Next track"
              }
            >
              Next
            </button>

            {!compact && (
              <button className="rounded border px-3 py-2 text-sm" onClick={onResume} title="Resume last session (R)">
                Resume
              </button>
            )}

            {!compact && (
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={onPlayAll}
                disabled={tab !== "project" || projectTracks.length === 0}
                title="Start setlist playback"
              >
                Play All
              </button>
            )}

            <button
              className="rounded border px-3 py-2 text-sm"
              onClick={onJumpToNow}
              disabled={tab !== "project" || !nowId}
              title="Jump to Now (J)"
            >
              Jump (J)
            </button>

            {!compact && (
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={onClearNow}
                title="Stop and clear NOW"
              >
                Clear Now
              </button>
            )}
          </div>

          {!compact &&
            (tab === "project" ? (
              <ProjectTab
                onProjectPage={onProjectPage}
                projectTracks={projectTracks}
                loadingProject={loadingProject}
                projectErr={projectErr}
                nowId={nowId}
                shuffle={shuffle}
                setShuffle={setShuffle}
                loop={loop}
                setLoop={setLoop}
                onRefresh={onRefreshProject}
                onPlay={onPlayTrack}
                onPlayFromHere={onPlayFromHere}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onMoveToIndex={onMoveToIndex}
                onResetOrder={onResetOrder}
                onJumpToNow={onJumpToNow}
                listRef={listRef}
                navPrevTick={navTick.prev}
                navNextTick={navTick.next}
              />
            ) : (
              <SearchTab q={q} setQ={setQ} allTracks={allTracks} onPlay={onPlayTrack} />
            ))}
        </div>
      </div>
    </div>
  );
}