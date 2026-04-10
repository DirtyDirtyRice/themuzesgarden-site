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
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [dropTargetTrackId, setDropTargetTrackId] = useState<string | null>(null);

  const bannerTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

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
    const needle = String(nowId);
    return projectTracks.findIndex((t) => String(t.id) === needle);
  }, [projectTracks, nowId]);

  const upNextIdx = nowIdx >= 0 ? nowIdx + 1 : -1;

  const visibleTracks = useMemo(() => {
    if (!hidePlayed) return projectTracks;
    if (nowIdx < 0) return projectTracks;
    return projectTracks.slice(nowIdx);
  }, [hidePlayed, projectTracks, nowIdx]);

  const selectedVisibleIdx = useMemo(() => {
    if (!selectedTrackId) return -1;
    return visibleTracks.findIndex((t) => String(t.id) === String(selectedTrackId));
  }, [selectedTrackId, visibleTracks]);

  const selectedTrack = useMemo(() => {
    if (!selectedTrackId) return null;
    return projectTracks.find((t) => String(t.id) === String(selectedTrackId)) ?? null;
  }, [projectTracks, selectedTrackId]);

  const selectedTrackSections = useMemo(() => {
    if (!selectedTrack) return [];
    return getSortedTrackSections(selectedTrack);
  }, [selectedTrack]);

  const selectedTrackBreakdown = useMemo(() => {
    if (!selectedTrack) {
      return {
        trackTags: [],
        sectionTags: [],
        combinedTags: [],
      };
    }
    return getDiscoveryTagBreakdown(selectedTrack);
  }, [selectedTrack]);

  const atStart = nowIdx === 0;
  const atEnd = nowIdx >= 0 && nowIdx === projectTracks.length - 1;

  const remainingCount =
    nowIdx >= 0 ? Math.max(0, projectTracks.length - (nowIdx + 1)) : projectTracks.length;

  const showingLabel = useMemo(() => {
    if (!hidePlayed) return `Showing: ${projectTracks.length}`;
    const hidden = nowIdx > 0 ? nowIdx : 0;
    return `Showing: ${visibleTracks.length} (hidden above NOW: ${hidden})`;
  }, [hidePlayed, nowIdx, projectTracks.length, visibleTracks.length]);

  const totalIndexedMoments = useMemo(() => {
    return projectTracks.reduce((sum, track) => sum + getSortedTrackSections(track).length, 0);
  }, [projectTracks]);

  const visibleIndexedMoments = useMemo(() => {
    return visibleTracks.reduce((sum, track) => sum + getSortedTrackSections(track).length, 0);
  }, [visibleTracks]);

  const denseTrackStats = useMemo(() => {
    let denseTrackCount = 0;
    let highDensityTrackCount = 0;

    for (const track of projectTracks) {
      const count = getSortedTrackSections(track).length;
      if (count >= 3) denseTrackCount += 1;
      if (count >= 6) highDensityTrackCount += 1;
    }

    return {
      denseTrackCount,
      highDensityTrackCount,
    };
  }, [projectTracks]);

  function scrollToTrackId(trackId: string | null) {
    if (!trackId) return;
    if (!listRef.current) return;

    const selector = `[data-trackid="${String(trackId)}"]`;
    const row = listRef.current.querySelector(selector) as HTMLElement | null;
    if (!row) return;

    row.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function scrollToIndex(i: number) {
    if (i < 0 || i >= projectTracks.length) return;
    const t = projectTracks[i];
    if (!t) return;
    scrollToTrackId(String(t.id));
  }

  function flashTrack(trackId: string) {
    setFlashTrackId(trackId);

    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }

    flashTimerRef.current = window.setTimeout(() => {
      setFlashTrackId((cur) => (cur === trackId ? null : cur));
      flashTimerRef.current = null;
    }, 1600);
  }

  function handleMoveUp(trackId: string) {
    onMoveUp(trackId);
    showBanner("Setlist order updated");
  }

  function handleMoveDown(trackId: string) {
    onMoveDown(trackId);
    showBanner("Setlist order updated");
  }

  function handleResetOrder() {
    onResetOrder();
    showBanner("Setlist order reset to linked-track truth");
  }

  function clearDragState() {
    setDraggingTrackId(null);
    setDropTargetTrackId(null);
  }

  function handleDragStart(trackId: string) {
    setDraggingTrackId(trackId);
    setDropTargetTrackId(trackId);
    setSelectedTrackId(trackId);
  }

  function handleDragOverTrack(trackId: string, e: React.DragEvent<HTMLDivElement>) {
    if (!draggingTrackId) return;
    if (draggingTrackId === trackId) return;
    e.preventDefault();
    setDropTargetTrackId(trackId);
  }

  function handleDropOnTrack(trackId: string, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();

    if (!draggingTrackId) return;

    const fromIndex = projectTracks.findIndex(
      (t) => String(t.id) === String(draggingTrackId)
    );
    const toIndex = projectTracks.findIndex((t) => String(t.id) === String(trackId));

    if (fromIndex < 0 || toIndex < 0) {
      clearDragState();
      return;
    }

    if (fromIndex !== toIndex) {
      onMoveToIndex(draggingTrackId, toIndex);
      showBanner("Track moved in setlist");
      window.setTimeout(() => {
        scrollToTrackId(draggingTrackId);
      }, 60);
    }

    clearDragState();
  }

  useEffect(() => {
    if (visibleTracks.length === 0) {
      setSelectedTrackId(null);
      return;
    }

    const selectedStillVisible = visibleTracks.some(
      (t) => String(t.id) === String(selectedTrackId ?? "")
    );
    if (selectedStillVisible) return;

    const fallback =
      nowId && visibleTracks.some((t) => String(t.id) === String(nowId))
        ? String(nowId)
        : String(visibleTracks[0].id);

    setSelectedTrackId(fallback);
  }, [visibleTracks, selectedTrackId, nowId]);

  useEffect(() => {
    if (!onProjectPage) return;
    if (!nowId) return;

    const nowExists = projectTracks.some((t) => String(t.id) === String(nowId));
    if (!nowExists) return;

    setSelectedTrackId(String(nowId));
  }, [onProjectPage, nowId, projectTracks]);

  useEffect(() => {
    if (!onProjectPage) return;
    if (!nowId) return;
    if (nowIdx < 0) return;

    if (atStart) {
      showBanner("Start of setlist");
    }
  }, [atStart, navPrevTick, nowId, nowIdx, onProjectPage]);

  useEffect(() => {
    if (!onProjectPage) return;
    if (!nowId) return;
    if (nowIdx < 0) return;

    if (atEnd) {
      showBanner("End of setlist");
    }
  }, [atEnd, navNextTick, nowId, nowIdx, onProjectPage]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!onProjectPage) return;
      if (isTypingTarget(e.target)) return;
      if (visibleTracks.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const base = selectedVisibleIdx >= 0 ? selectedVisibleIdx : 0;
        const nextIdx = Math.min(visibleTracks.length - 1, base + 1);
        const nextTrack = visibleTracks[nextIdx];
        if (!nextTrack) return;
        setSelectedTrackId(String(nextTrack.id));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const base = selectedVisibleIdx >= 0 ? selectedVisibleIdx : 0;
        const prevIdx = Math.max(0, base - 1);
        const prevTrack = visibleTracks[prevIdx];
        if (!prevTrack) return;
        setSelectedTrackId(String(prevTrack.id));
        return;
      }

      if (e.key === "Home") {
        e.preventDefault();
        const first = visibleTracks[0];
        if (!first) return;
        setSelectedTrackId(String(first.id));
        scrollToTrackId(String(first.id));
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        const last = visibleTracks[visibleTracks.length - 1];
        if (!last) return;
        setSelectedTrackId(String(last.id));
        scrollToTrackId(String(last.id));
        return;
      }

      if (e.key === "Enter") {
        if (selectedVisibleIdx < 0) return;
        const selected = visibleTracks[selectedVisibleIdx];
        if (!selected) return;
        e.preventDefault();
        onPlayFromHere(selected);
        return;
      }

      if (e.key === " ") {
        if (selectedVisibleIdx < 0) return;
        const selected = visibleTracks[selectedVisibleIdx];
        if (!selected) return;
        e.preventDefault();
        onPlay(selected);
        return;
      }

      if ((e.key === "m" || e.key === "M") && selectedVisibleIdx >= 0) {
        const selected = visibleTracks[selectedVisibleIdx];
        if (!selected) return;

        const firstSection = getSortedTrackSections(selected)[0] ?? null;
        if (!firstSection) return;

        e.preventDefault();
        emitProjectMomentPlaybackTarget(selected, firstSection);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay, onPlayFromHere, onProjectPage, selectedVisibleIdx, visibleTracks]);

  useEffect(() => {
    function onActivityTrackJump(event: Event) {
      const custom = event as CustomEvent<{
        projectId?: string;
        trackId?: string;
      }>;

      const targetTrackId = String(custom.detail?.trackId ?? "").trim();
      if (!targetTrackId) return;
      if (!onProjectPage) return;

      const exists = projectTracks.some((t) => String(t.id) === targetTrackId);
      if (!exists) return;

      setSelectedTrackId(targetTrackId);
      setHidePlayed(false);

      window.setTimeout(() => {
        scrollToTrackId(targetTrackId);
        flashTrack(targetTrackId);
      }, 80);
    }

    window.addEventListener(
      "muzesgarden-activity-track-jump",
      onActivityTrackJump as EventListener
    );

    return () => {
      window.removeEventListener(
        "muzesgarden-activity-track-jump",
        onActivityTrackJump as EventListener
      );
    };
  }, [onProjectPage, projectTracks]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        window.clearTimeout(bannerTimerRef.current);
      }
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  if (!onProjectPage) {
    return (
      <div className="text-sm text-zinc-600">
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
        onJumpToNow={() => {
          onJumpToNow();
          if (nowId) {
            window.setTimeout(() => {
              scrollToTrackId(String(nowId));
            }, 80);
          }
        }}
        nowId={nowId}
        handleResetOrder={handleResetOrder}
        onRefresh={onRefresh}
        loadingProject={loadingProject}
        totalIndexedMoments={totalIndexedMoments}
        visibleTrackCount={visibleTracks.length}
        visibleIndexedMoments={visibleIndexedMoments}
        denseTrackCount={denseTrackStats.denseTrackCount}
        highDensityTrackCount={denseTrackStats.highDensityTrackCount}
        nowIdx={nowIdx}
        upNextIdx={upNextIdx}
        remainingCount={remainingCount}
        showingLabel={showingLabel}
        selectedVisibleIdx={selectedVisibleIdx}
        scrollToUpNext={() => scrollToIndex(upNextIdx)}
        hidePlayed={hidePlayed}
        setHidePlayed={setHidePlayed}
      />

      {selectedTrack ? (
        <ProjectSelectedTrackPanel
          selectedTrack={selectedTrack}
          selectedTrackSectionCount={selectedTrackSections.length}
          trackTagCount={selectedTrackBreakdown.trackTags.length}
          sectionTagCount={selectedTrackBreakdown.sectionTags.length}
        />
      ) : null}

      {banner ? (
        <div className="rounded-lg border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
          {banner}
        </div>
      ) : null}

      {projectErr ? <div className="text-xs text-red-600">{projectErr}</div> : null}

      {loadingProject ? (
        <div className="text-xs text-zinc-500">Loading setlist…</div>
      ) : projectTracks.length === 0 ? (
        <div className="rounded-lg border border-dashed px-3 py-3 text-xs text-zinc-500">
          This project does not have any linked tracks yet. Link tracks in the project
          library to build the setlist and playback order.
        </div>
      ) : (
        <div ref={listRef} className="max-h-52 overflow-y-auto space-y-1">
          {visibleTracks.map((track, idx) => {
            const realIdx = hidePlayed && nowIdx >= 0 ? nowIdx + idx : idx;

            return (
              <ProjectTrackRow
                key={String(track.id)}
                track={track}
                realIdx={realIdx}
                nowId={nowId}
                selectedTrackId={selectedTrackId}
                flashTrackId={flashTrackId}
                draggingTrackId={draggingTrackId}
                dropTargetTrackId={dropTargetTrackId}
                loadingProject={loadingProject}
                projectTrackCount={projectTracks.length}
                onPlay={onPlay}
                onPlayFromHere={onPlayFromHere}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onSelectTrack={setSelectedTrackId}
                onDragStart={handleDragStart}
                onDragOverTrack={handleDragOverTrack}
                onDropOnTrack={handleDropOnTrack}
                onClearDragState={clearDragState}
              />
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-zinc-500">
        Hotkeys: Space play selected • ← prev • → next • R resume • J jump • S
        shuffle • L loop • ↑ ↓ select • Home/End top/bottom • Enter play from here •
        M play first moment
      </div>
    </div>
  );
}