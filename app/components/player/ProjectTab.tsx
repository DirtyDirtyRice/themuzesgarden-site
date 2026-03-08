"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import {
  emitTagSearch,
  getDiscoveryTagBreakdown,
  getSectionDescriptions,
  getTagSourceSummary,
  getTrackSections,
  isTypingTarget,
} from "./playerUtils";

function getSectionDescriptionSummary(t: AnyTrack): string | null {
  const descriptions = getSectionDescriptions(t);
  return descriptions[0] ?? null;
}

function getOriginUiLabel(originLabel: "track" | "moment" | "track+moment" | "none"): string {
  if (originLabel === "track+moment") return "TRACK+MOMENT";
  if (originLabel === "moment") return "MOMENT";
  if (originLabel === "track") return "TRACK";
  return "TAG";
}

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
  const autoFollowTimerRef = useRef<number | null>(null);
  const lastAutoFollowNowIdRef = useRef<string | null>(null);

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

  const atStart = nowIdx === 0;
  const atEnd = nowIdx >= 0 && nowIdx === projectTracks.length - 1;

  const remainingCount =
    nowIdx >= 0 ? Math.max(0, projectTracks.length - (nowIdx + 1)) : projectTracks.length;

  const showingLabel = useMemo(() => {
    if (!hidePlayed) return `Showing: ${projectTracks.length}`;
    const hidden = nowIdx > 0 ? nowIdx : 0;
    return `Showing: ${visibleTracks.length} (hidden above NOW: ${hidden})`;
  }, [hidePlayed, nowIdx, projectTracks.length, visibleTracks.length]);

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

  function handleDropOnTrack(targetTrackId: string) {
    if (!draggingTrackId) return;

    const fromIndex = projectTracks.findIndex(
      (t) => String(t.id) === String(draggingTrackId)
    );
    const toIndex = projectTracks.findIndex(
      (t) => String(t.id) === String(targetTrackId)
    );

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
    if (!onProjectPage) return;
    if (!nowId) return;

    const t = window.setTimeout(() => {
      onJumpToNow();
    }, 0);

    return () => window.clearTimeout(t);
  }, [onJumpToNow, onProjectPage, nowId]);

  useEffect(() => {
    if (!onProjectPage) return;
    if (!nowId) {
      lastAutoFollowNowIdRef.current = null;
      return;
    }

    const normalizedNowId = String(nowId);
    const nowExists = projectTracks.some((t) => String(t.id) === normalizedNowId);
    if (!nowExists) return;

    const changed = lastAutoFollowNowIdRef.current !== normalizedNowId;
    if (!changed) return;

    lastAutoFollowNowIdRef.current = normalizedNowId;
    setSelectedTrackId(normalizedNowId);

    if (autoFollowTimerRef.current) {
      window.clearTimeout(autoFollowTimerRef.current);
    }

    autoFollowTimerRef.current = window.setTimeout(() => {
      scrollToTrackId(normalizedNowId);
      autoFollowTimerRef.current = null;
    }, 120);

    return () => {
      if (autoFollowTimerRef.current) {
        window.clearTimeout(autoFollowTimerRef.current);
        autoFollowTimerRef.current = null;
      }
    };
  }, [onProjectPage, nowId, projectTracks, hidePlayed]);

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
    if (!selectedTrackId) return;

    const exists = visibleTracks.some((t) => String(t.id) === String(selectedTrackId));
    if (!exists) return;

    const t = window.setTimeout(() => {
      scrollToTrackId(selectedTrackId);
    }, 0);

    return () => window.clearTimeout(t);
  }, [selectedTrackId, visibleTracks, onProjectPage]);

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
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        const last = visibleTracks[visibleTracks.length - 1];
        if (!last) return;
        setSelectedTrackId(String(last.id));
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
      if (autoFollowTimerRef.current) {
        window.clearTimeout(autoFollowTimerRef.current);
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">
            Project Setlist ({projectTracks.length})
          </div>
          <div className="text-[11px] text-zinc-500">
            Playback follows this order. Reordering persists automatically per project.
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            className={[
              "text-xs px-2 py-1 rounded border",
              shuffle ? "bg-black text-white" : "bg-white",
            ].join(" ")}
            onClick={() => setShuffle((v) => !v)}
            title="Shuffle (Hotkey: S)"
          >
            Shuffle
          </button>

          <button
            className={[
              "text-xs px-2 py-1 rounded border",
              loop ? "bg-black text-white" : "bg-white",
            ].join(" ")}
            onClick={() => setLoop((v) => !v)}
            title="Loop current (Hotkey: L)"
          >
            Loop
          </button>

          <button
            className="text-xs px-2 py-1 rounded border"
            onClick={onJumpToNow}
            disabled={!nowId}
            title="Jump to Now (Hotkey: J)"
          >
            Jump (J)
          </button>

          <button
            className="text-xs px-2 py-1 rounded border"
            onClick={handleResetOrder}
            disabled={loadingProject}
            title="Reset setlist order to linked-track truth"
          >
            Reset Order
          </button>

          <button
            className="text-xs px-2 py-1 rounded border"
            onClick={onRefresh}
            disabled={loadingProject}
            title="Manual refresh (usually not needed)"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-zinc-700">
            <span className="font-medium">
              Playing: {nowIdx >= 0 ? String(nowIdx + 1).padStart(2, "0") : "--"}
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

          <div className="flex items-center gap-2">
            <button
              className="rounded border px-2 py-1"
              onClick={onJumpToNow}
              disabled={!nowId}
              title="Scroll to NOW"
            >
              Back to Now
            </button>

            <button
              className="rounded border px-2 py-1"
              onClick={() => scrollToIndex(upNextIdx)}
              disabled={upNextIdx < 0 || upNextIdx >= projectTracks.length}
              title="Scroll to UP NEXT"
            >
              Go Up Next
            </button>

            <button
              className={[
                "rounded border px-2 py-1",
                hidePlayed ? "bg-black text-white" : "bg-white",
              ].join(" ")}
              onClick={() => setHidePlayed((v) => !v)}
              title="Hide tracks above NOW"
            >
              {hidePlayed ? "Show Played" : "Hide Played"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-zinc-600">
          <div>{showingLabel}</div>
          <div>
            Selected:{" "}
            <span className="font-medium">
              {selectedVisibleIdx >= 0
                ? String(selectedVisibleIdx + 1).padStart(2, "0")
                : "--"}
            </span>
          </div>
        </div>
      </div>

      {banner && (
        <div className="text-[11px] rounded-lg border bg-zinc-50 px-3 py-2 text-zinc-700">
          {banner}
        </div>
      )}

      {projectErr && <div className="text-xs text-red-600">{projectErr}</div>}

      {loadingProject ? (
        <div className="text-xs text-zinc-500">Loading setlist…</div>
      ) : projectTracks.length === 0 ? (
        <div className="rounded-lg border border-dashed px-3 py-3 text-xs text-zinc-500">
          This project does not have any linked tracks yet. Link tracks in the project
          library to build the setlist and playback order.
        </div>
      ) : (
        <div ref={listRef} className="max-h-52 overflow-y-auto space-y-1">
          {visibleTracks.map((t, idx) => {
            const realIdx = hidePlayed && nowIdx >= 0 ? nowIdx + idx : idx;

            const tid = String(t.id);
            const isNow = tid === String(nowId ?? "");
            const isUpNext = nowIdx >= 0 && realIdx === nowIdx + 1;
            const isSelected = tid === String(selectedTrackId ?? "");
            const isFlashing = tid === String(flashTrackId ?? "");
            const isDragging = tid === String(draggingTrackId ?? "");
            const isDropTarget =
              tid === String(dropTargetTrackId ?? "") && !isDragging;

            const atTop = realIdx === 0;
            const atBottom = realIdx === projectTracks.length - 1;

            const { trackTags, sectionTags, combinedTags } = getDiscoveryTagBreakdown(t);
            const firstSectionDescription = getSectionDescriptionSummary(t);
            const sectionCount = getTrackSections(t).length;

            return (
              <div
                key={tid}
                data-trackid={tid}
                className={[
                  "rounded border px-2 py-2 cursor-pointer transition-all duration-300",
                  isNow ? "border-black bg-zinc-50 ring-2 ring-black/25" : "",
                  !isNow && isUpNext ? "border-zinc-400 bg-zinc-50/70" : "",
                  isSelected && !isNow ? "ring-2 ring-blue-200 border-blue-300" : "",
                  isFlashing ? "ring-2 ring-amber-300 border-amber-400 bg-amber-50" : "",
                  isDragging ? "opacity-60 ring-2 ring-dashed ring-black/20" : "",
                  isDropTarget ? "ring-2 ring-green-300 border-green-400 bg-green-50" : "",
                ].join(" ")}
                onClick={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target && (target.tagName === "BUTTON" || target.closest("button"))) {
                    return;
                  }
                  setSelectedTrackId(tid);
                }}
                onDoubleClick={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target && (target.tagName === "BUTTON" || target.closest("button"))) {
                    return;
                  }
                  setSelectedTrackId(tid);
                  onPlayFromHere(t);
                }}
                onMouseEnter={() => setSelectedTrackId(tid)}
                onDragOver={(e) => {
                  if (!draggingTrackId) return;
                  if (draggingTrackId === tid) return;
                  e.preventDefault();
                  setDropTargetTrackId(tid);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnTrack(tid);
                }}
                onDragEnd={clearDragState}
                title="Click to select • Double-click to Play From Here"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(tid);
                        }}
                        onDragEnd={(e) => {
                          e.stopPropagation();
                          clearDragState();
                        }}
                        onClick={(e) => e.preventDefault()}
                        className="shrink-0 rounded border px-2 py-1 text-[11px] cursor-grab active:cursor-grabbing bg-white"
                        title="Drag to reorder"
                        aria-label={`Drag ${t.title ?? "track"} to reorder`}
                      >
                        ☰
                      </button>

                      <div className="text-[11px] text-zinc-500 tabular-nums shrink-0">
                        {String(realIdx + 1).padStart(2, "0")}
                      </div>

                      {isNow && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                          NOW
                        </span>
                      )}

                      {!isNow && isUpNext && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                          UP NEXT
                        </span>
                      )}

                      {isSelected && !isNow && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                          SELECTED
                        </span>
                      )}

                      {isFlashing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-100">
                          JUMPED
                        </span>
                      )}

                      {isDragging && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                          DRAGGING
                        </span>
                      )}

                      {isDropTarget && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-100">
                          DROP
                        </span>
                      )}

                      <div
                        className={[
                          "text-sm truncate",
                          isNow ? "font-semibold" : "font-medium",
                        ].join(" ")}
                      >
                        {t.title ?? "Untitled"}
                      </div>
                    </div>

                    <div className="text-xs text-zinc-500 truncate">
                      {t.artist ?? "Supabase"}
                    </div>

                    {firstSectionDescription ? (
                      <div className="mt-1 text-[11px] text-zinc-600 truncate">
                        Moment: {firstSectionDescription}
                      </div>
                    ) : null}

                    {sectionCount > 0 ? (
                      <div className="mt-1 text-[11px] text-zinc-500 truncate">
                        Indexed moments: {sectionCount}
                      </div>
                    ) : null}

                    {combinedTags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {combinedTags.slice(0, 6).map((tag) => {
                          const source = getTagSourceSummary(t, tag);
                          const originLabel = getOriginUiLabel(source.originLabel);

                          return (
                            <button
                              key={`${tid}:combined:${tag}`}
                              type="button"
                              className={[
                                "rounded border px-2 py-0.5 text-[10px] hover:bg-zinc-100",
                                source.originLabel === "track+moment"
                                  ? "bg-zinc-100 text-zinc-700"
                                  : source.originLabel === "moment"
                                  ? "bg-white text-zinc-500"
                                  : "bg-zinc-50 text-zinc-600",
                              ].join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                emitTagSearch(tag);
                              }}
                              title={`Search tag: ${tag} • source: ${originLabel}`}
                            >
                              {source.originLabel === "moment" ? "#" : ""}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {(trackTags.length > 0 || sectionTags.length > 0) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {trackTags.length > 0 && (
                          <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                            Track tags: {trackTags.length}
                          </span>
                        )}
                        {sectionTags.length > 0 && (
                          <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                            Moment tags: {sectionTags.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col gap-1">
                      <button
                        className="rounded border px-2 py-1 text-[11px] disabled:opacity-50"
                        onClick={() => handleMoveUp(tid)}
                        disabled={loadingProject || atTop}
                        title={atTop ? "Already at top of setlist" : "Move up"}
                      >
                        ↑
                      </button>
                      <button
                        className="rounded border px-2 py-1 text-[11px] disabled:opacity-50"
                        onClick={() => handleMoveDown(tid)}
                        disabled={loadingProject || atBottom}
                        title={atBottom ? "Already at bottom of setlist" : "Move down"}
                      >
                        ↓
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        className="rounded bg-black text-white px-3 py-1 text-[11px]"
                        onClick={() => onPlay(t)}
                        title="Play this track"
                      >
                        Play
                      </button>

                      <button
                        className="rounded border px-3 py-1 text-[11px]"
                        onClick={() => onPlayFromHere(t)}
                        title="Play From Here (forces Project tab + disables Shuffle so it continues in order)"
                      >
                        From Here
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-zinc-500">
        Hotkeys: Space play selected • ← prev • → next • R resume • J jump • S shuffle • L
        loop • ↑ ↓ select • Home/End top/bottom • Enter play from here
      </div>
    </div>
  );
}