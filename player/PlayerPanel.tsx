"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack, PlayerTab } from "./playerTypes";
import {
  findMatchedMoments,
  getSectionTags,
  getTrackTags,
  isTypingTarget,
  scoreTrack,
} from "./playerUtils";
import MomentInspector from "./MomentInspector";
import ProjectTab from "./ProjectTab";
import SearchTab from "./SearchTab";
import PlayerNowPlayingPanel from "./PlayerNowPlayingPanel";
import PlayerTimeline from "./PlayerTimeline";
import PlayerTransportControls from "./PlayerTransportControls";
import PlayerStatusBadges from "./PlayerStatusBadges";
import PlayerModeSummary from "./PlayerModeSummary";
import PlayerSearchStatusPanel from "./PlayerSearchStatusPanel";
import PlayerTagIntelligencePanel from "./PlayerTagIntelligencePanel";
import PlayerHeaderBar from "./PlayerHeaderBar";
import PlayerSearchHelpPanel from "./PlayerSearchHelpPanel";
import PlayerProjectHelpPanels from "./PlayerProjectHelpPanels";

const LS_COMPACT_KEY = "muzes.globalPlayer.compact.v1";
const ENABLE_Q_TRACE = process.env.NODE_ENV !== "production";

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

function getHeatBucket(
  score: number,
  matchedMomentCount: number
): "hot" | "warm" | "none" {
  if (matchedMomentCount <= 0) return "none";
  if (score >= 220) return "hot";
  if (score >= 140) return "warm";
  return "none";
}

function getSearchModeLabel(query: string): string {
  if (!query) return "Idle";
  return "Heat Ranked";
}

function formatTraceTime(): string {
  const now = new Date();
  return (
    now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + `.${String(now.getMilliseconds()).padStart(3, "0")}`
  );
}

function logQTrace(source: string, prevValue: string, nextValue: string) {
  if (!ENABLE_Q_TRACE) return;
  console.log(
    `[Q TRACE ${formatTraceTime()}] ${source} | prev=${JSON.stringify(prevValue)} | next=${JSON.stringify(nextValue)}`
  );
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

  const lastQRef = useRef(q);

  function tracedSetQ(source: string, nextValue: string) {
    const clean = String(nextValue ?? "");

    if (clean === lastQRef.current) {
      return;
    }

    logQTrace(source, lastQRef.current, clean);
    lastQRef.current = clean;
    setQ(clean);
  }

  useEffect(() => {
    if (lastQRef.current !== q) {
      logQTrace("prop:q observed", lastQRef.current, q);
      lastQRef.current = q;
    }
  }, [q]);

  const trackCount =
    tab === "project" ? projectTracks.length : allTracks.length;
  const trackCountLabel =
    tab === "project" ? `Setlist ${trackCount}` : `Library ${trackCount}`;

  const hasNow = Boolean(nowId);
  const isProjectTab = tab === "project";
  const isSearchTab = tab === "search";
  const canUseProject = isProjectTab && onProjectPage;
  const hasProjectTracks = projectTracks.length > 0;

  const trimmedQuery = q.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const searchInsights = useMemo(() => {
    if (!normalizedQuery) {
      return {
        rankedCount: 0,
        hotCount: 0,
        warmCount: 0,
        bestScore: 0,
      };
    }

    let rankedCount = 0;
    let hotCount = 0;
    let warmCount = 0;
    let bestScore = 0;

    for (const track of allTracks) {
      const matchedMoments = findMatchedMoments(track, normalizedQuery);
      const score = scoreTrack(track, normalizedQuery, matchedMoments.length);

      if (score <= 0) continue;

      rankedCount += 1;
      if (score > bestScore) bestScore = score;

      const heatBucket = getHeatBucket(score, matchedMoments.length);
      if (heatBucket === "hot") hotCount += 1;
      else if (heatBucket === "warm") warmCount += 1;
    }

    return {
      rankedCount,
      hotCount,
      warmCount,
      bestScore,
    };
  }, [allTracks, normalizedQuery]);

  const searchResultCount = searchInsights.rankedCount;

  const nowIdx = useMemo(() => {
    if (!nowId) return -1;
    const needle = String(nowId);
    return projectTracks.findIndex((t) => String(t.id) === needle);
  }, [projectTracks, nowId]);

  const upNextIdx = nowIdx >= 0 ? nowIdx + 1 : -1;
  const remainingCount =
    nowIdx >= 0
      ? Math.max(0, projectTracks.length - (nowIdx + 1))
      : projectTracks.length;

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
        return a[0].localeCompare(b[0], undefined, {
          sensitivity: "base",
        });
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

    const audio = el;

    function pull() {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      const c = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      setDurSec(d > 0 ? d : 0);

      if (!isSeeking) setCurSec(c >= 0 ? c : 0);
    }

    pull();

    audio.addEventListener("loadedmetadata", pull);
    audio.addEventListener("durationchange", pull);
    audio.addEventListener("timeupdate", pull);

    return () => {
      audio.removeEventListener("loadedmetadata", pull);
      audio.removeEventListener("durationchange", pull);
      audio.removeEventListener("timeupdate", pull);
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
          className="rounded-xl bg-black px-4 py-2 text-white shadow"
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
      <div className="flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-xl">
        <PlayerHeaderBar
          compact={compact}
          toggleCompact={toggleCompact}
          tab={tab}
          setTab={setTab}
          onProjectPage={onProjectPage}
          setOpen={setOpen}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            {isSearchTab && !compact ? (
              <SearchTab
                q={q}
                setQ={(nextValue) => tracedSetQ("SearchTab:setQ", nextValue)}
                allTracks={allTracks}
                onPlay={onPlayTrack}
              />
            ) : null}

            <PlayerStatusBadges
              isSearchTab={isSearchTab}
              isProjectTab={isProjectTab}
              hasNow={hasNow}
              compact={compact}
              trimmedQuery={trimmedQuery}
              getSearchModeLabel={getSearchModeLabel}
            />

            <PlayerModeSummary
              tab={tab}
              shuffle={shuffle}
              loop={loop}
              statusVolPct={statusVolPct}
              statusTime={statusTime}
              trackCountLabel={trackCountLabel}
            />

            <PlayerSearchStatusPanel
              compact={compact}
              isSearchTab={isSearchTab}
              trimmedQuery={trimmedQuery}
              searchResultCount={searchResultCount}
              searchInsights={searchInsights}
            />

            <PlayerSearchHelpPanel compact={compact} isSearchTab={isSearchTab} />

            <PlayerProjectHelpPanels
              compact={compact}
              tab={tab}
              onProjectPage={onProjectPage}
              canUseProject={canUseProject}
              hasProjectTracks={hasProjectTracks}
            />

            <PlayerTagIntelligencePanel
              compact={compact}
              tab={tab}
              topTags={topTags}
              onTagClick={(tag) => {
                setTab("search");
                tracedSetQ("PlayerTagIntelligencePanel:onTagClick", tag);
              }}
            />

            {!compact && isSearchTab ? (
              <MomentInspector allTracks={allTracks} />
            ) : null}

            <PlayerNowPlayingPanel
              nowLabel={nowLabel}
              nowId={nowId}
              compact={compact}
              tab={tab}
              trackCountLabel={trackCountLabel}
              hasNow={hasNow}
              canUseProject={canUseProject}
              hasProjectTracks={hasProjectTracks}
              nowIdx={nowIdx}
              upNextIdx={upNextIdx}
              projectTracksLength={projectTracks.length}
              remainingCount={remainingCount}
              trimmedQuery={trimmedQuery}
            />

            <div ref={audioHostRef}>{audioEl}</div>

            <PlayerTimeline
              durSec={durSec}
              curSec={curSec}
              isSeeking={isSeeking}
              seekSec={seekSec}
              setIsSeeking={setIsSeeking}
              setSeekSec={setSeekSec}
              finishSeek={finishSeek}
            />

            <PlayerTransportControls
              tab={tab}
              hasNow={hasNow}
              atProjectStart={atProjectStart}
              atProjectEnd={atProjectEnd}
              compact={compact}
              projectTracksLength={projectTracks.length}
              nowId={nowId}
              onPrevWrapped={() => {
                if (tab === "project") {
                  setNavTick((s) => ({ ...s, prev: s.prev + 1 }));
                }
                onPrev();
              }}
              onToggle={onToggle}
              onStop={onStop}
              onNextWrapped={() => {
                if (tab === "project") {
                  setNavTick((s) => ({ ...s, next: s.next + 1 }));
                }
                onNext();
              }}
              onResume={onResume}
              onPlayAll={onPlayAll}
              onJumpToNow={onJumpToNow}
              onClearNow={onClearNow}
            />

            {!compact && tab === "project" ? (
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
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}