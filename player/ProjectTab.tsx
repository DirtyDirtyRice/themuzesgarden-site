"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import { getDiscoveryTagBreakdown, isTypingTarget } from "./playerUtils";
import ProjectSelectedTrackPanel from "./ProjectSelectedTrackPanel";
import ProjectTabHeader from "./ProjectTabHeader";
import ProjectTrackRow from "./ProjectTrackRow";
import {
  emitProjectMomentPlaybackTarget,
  getSortedTrackSections,
} from "./projectTabHelpers";

export default function ProjectTab(props: {
  onProjectPage: boolean;
  projectTracks: AnyTrack[];
  loadingProject: boolean;
  projectErr: string | null;

  nowId: string | null;

  shuffle: boolean;
  setShuffle: (v: (prev: boolean) => boolean) => void;

  loop: boolean;
  setLoop: (v: (prev: boolean) => boolean) => void;

  onRefresh: () => void;

  onPlay: (t: AnyTrack) => void;
  onPlayFromHere: (t: AnyTrack) => void;

  onMoveUp: (trackId: string) => void;
  onMoveDown: (trackId: string) => void;
  onMoveToIndex: (trackId: string, toIndex: number) => void;
  onResetOrder: () => void;
  onJumpToNow: () => void;

  listRef: React.RefObject<HTMLDivElement | null>;

  navPrevTick: number;
  navNextTick: number;
}) {
  const {
    onProjectPage,
    projectTracks,
    loadingProject,
    projectErr,
    nowId,
    shuffle,
    setShuffle,
    loop,
    setLoop,
    onRefresh,
    onPlay,
    onPlayFromHere,
    onMoveUp,
    onMoveDown,
    onMoveToIndex,
    onResetOrder,
    onJumpToNow,
    listRef,
    navPrevTick,
    navNextTick,
  } = props;

  const [hidePlayed, setHidePlayed] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [flashTrackId, setFlashTrackId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string>("");

  const bannerTimerRef = useRef<number | null>(null);

  function showBanner(message: string, ms = 1500) {
    setBanner(message);

    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
    }

    bannerTimerRef.current = window.setTimeout(() => {
      setBanner("");
      bannerTimerRef.current = null;
    }, ms);
  }

  const nowIdx = useMemo(() => {
    if (!nowId) return -1;
    return projectTracks.findIndex((t) => String(t.id) === String(nowId));
  }, [projectTracks, nowId]);

  const visibleTracks = useMemo(() => {
    if (!hidePlayed) return projectTracks;
    if (nowIdx < 0) return projectTracks;
    return projectTracks.slice(nowIdx);
  }, [hidePlayed, projectTracks, nowIdx]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        window.clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  if (!onProjectPage) {
    return (
      <div className="text-sm text-white">
        Open a project workspace page to use Project mode.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ProjectTabHeader
        projectTrackCount={projectTracks.length}
        shuffle={shuffle}
        setShuffle={setShuffle}
        loop={loop}
        setLoop={setLoop}
        onJumpToNow={onJumpToNow}
        nowId={nowId}
        handleResetOrder={onResetOrder}
        onRefresh={onRefresh}
        loadingProject={loadingProject}
        totalIndexedMoments={0}
        visibleTrackCount={visibleTracks.length}
        visibleIndexedMoments={0}
        denseTrackCount={0}
        highDensityTrackCount={0}
        nowIdx={nowIdx}
        upNextIdx={-1}
        remainingCount={visibleTracks.length}
        showingLabel={`Showing: ${visibleTracks.length}`}
        selectedVisibleIdx={0}
        scrollToUpNext={() => {}}
        hidePlayed={hidePlayed}
        setHidePlayed={setHidePlayed}
      />

      {banner ? (
        <div className="rounded-lg border border-white bg-black px-3 py-2 text-[11px] text-white">
          {banner}
        </div>
      ) : null}

      {projectErr ? (
        <div className="text-xs text-white">{projectErr}</div>
      ) : null}

      {loadingProject ? (
        <div className="text-xs text-white">Loading setlist…</div>
      ) : projectTracks.length === 0 ? (
        <div className="rounded-lg border border-white px-3 py-3 text-xs text-white">
          This project does not have any linked tracks yet.
        </div>
      ) : (
        <div ref={listRef} className="max-h-52 overflow-y-auto space-y-1">
          {visibleTracks.map((track, idx) => (
            <ProjectTrackRow
              key={String(track.id)}
              track={track}
              realIdx={idx}
              nowId={nowId}
              selectedTrackId={selectedTrackId}
              flashTrackId={flashTrackId}
              draggingTrackId={null}
              dropTargetTrackId={null}
              loadingProject={loadingProject}
              projectTrackCount={projectTracks.length}
              onPlay={onPlay}
              onPlayFromHere={onPlayFromHere}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onSelectTrack={setSelectedTrackId}
              onDragStart={() => {}}
              onDragOverTrack={() => {}}
              onDropOnTrack={() => {}}
              onClearDragState={() => {}}
            />
          ))}
        </div>
      )}

      <div className="text-[11px] text-white">
        Hotkeys: Space play • ← prev • → next
      </div>
    </div>
  );
}