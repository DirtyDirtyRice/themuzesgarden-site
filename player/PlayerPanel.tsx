"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnyTrack, PlayerTab } from "./playerTypes";
import { isTypingTarget } from "./playerUtils";
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
import {
  buildSearchInsights,
  getSearchModeLabel,
} from "./playerPanelSearch";
import { emitTagSearch, buildTopTags } from "./playerPanelTags";
import { usePlayerPanelLayout } from "./playerPanelLayout";
import { usePlayerPanelTimeline } from "./playerPanelTimeline";

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

  const {
    compact,
    toggleCompact,
    playerPanelWidthPx,
  } = usePlayerPanelLayout(open);

  const {
    audioHostRef,
    durSec,
    curSec,
    isSeeking,
    seekSec,
    setIsSeeking,
    setSeekSec,
    finishSeek,
  } = usePlayerPanelTimeline(audioEl, open);

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
    return buildSearchInsights(allTracks, normalizedQuery);
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
    return buildTopTags(allTracks);
  }, [allTracks]);

  const [navTick, setNavTick] = useState<{ prev: number; next: number }>({
    prev: 0,
    next: 0,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (isTypingTarget(e.target)) return;

      if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        onJumpToNow();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onJumpToNow]);

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
      className="fixed bottom-6 right-6 z-[80]"
      style={{
        width: `${playerPanelWidthPx}px`,
        maxWidth: "92vw",
      }}
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
            <div style={{ display: isSearchTab && !compact ? "block" : "none" }}>
              <SearchTab
                q={q}
                setQ={setQ}
                allTracks={allTracks}
                onPlay={onPlayTrack}
              />
            </div>

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
                emitTagSearch(tag);
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
              nowTrack={
                allTracks.find((t) => String(t.id) === String(nowId)) ?? null
              }
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