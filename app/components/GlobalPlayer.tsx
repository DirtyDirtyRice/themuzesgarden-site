"use client";

import { useEffect, useState } from "react";
import type { PlayerTab } from "./player/playerTypes";
import { useAllTracks } from "./player/useAllTracks";
import { useProjectContext } from "./player/useProjectContext";
import { useProjectSetlist } from "./player/useProjectSetlist";
import { useAudioEngine } from "./player/useAudioEngine";
import PlayerPanel from "./player/PlayerPanel";

export default function GlobalPlayer() {
  const [tab, setTab] = useState<PlayerTab>("search");
  const [q, setQ] = useState("");

  const { allTracks } = useAllTracks();
  const { onProjectPage, projectId } = useProjectContext();

  const {
    projectTracks,
    loadingProject,
    projectErr,
    refreshProjectIds,
    moveUp,
    moveDown,
    moveToIndex,
    resetOrderToLinkedTruth,
    jumpToNow,
    listRef,
  } = useProjectSetlist({
    onProjectPage,
    projectId,
    allTracks,
  });

  const engine = useAudioEngine({
    tab,
    setTab,
    onProjectPage,
    projectId,
    allTracks,
    projectTracks,
  });

  useEffect(() => {
    if (!onProjectPage) return;
    if (!engine.nowId) return;

    const t = window.setTimeout(() => {
      jumpToNow(engine.nowId);
    }, 0);

    return () => window.clearTimeout(t);
  }, [onProjectPage, engine.nowId, jumpToNow]);

  useEffect(() => {
    function onSearchTag(event: Event) {
      const custom = event as CustomEvent<{ tag?: string }>;
      const nextTag = String(custom.detail?.tag ?? "").trim();
      if (!nextTag) return;

      setTab("search");
      setQ(nextTag);
    }

    window.addEventListener(
      "muzesgarden-search-tag",
      onSearchTag as EventListener
    );

    return () => {
      window.removeEventListener(
        "muzesgarden-search-tag",
        onSearchTag as EventListener
      );
    };
  }, []);

  const jumpIfPossible = () => {
    if (!engine.nowId) return;
    jumpToNow(engine.nowId);
  };

  return (
    <PlayerPanel
      open={engine.open}
      setOpen={engine.setOpen}
      tab={tab}
      setTab={setTab}
      onProjectPage={onProjectPage}
      nowLabel={engine.nowLabel}
      audioEl={
        <audio
          ref={engine.audioRef}
          preload="metadata"
          controls
          className="w-full"
        />
      }
      onPrev={engine.prev}
      onToggle={engine.togglePlayPause}
      onStop={engine.stop}
      onNext={engine.next}
      onResume={engine.resumeLastSession}
      onPlayAll={engine.playAll}
      onClearNow={engine.clearNow}
      statusTime={engine.statusTime}
      statusVolPct={engine.statusVolPct}
      projectTracks={projectTracks}
      loadingProject={loadingProject}
      projectErr={projectErr}
      onRefreshProject={refreshProjectIds}
      nowId={engine.nowId}
      shuffle={engine.shuffle}
      setShuffle={engine.setShuffle}
      loop={engine.loop}
      setLoop={engine.setLoop}
      onMoveUp={moveUp}
      onMoveDown={moveDown}
      onMoveToIndex={moveToIndex}
      onResetOrder={resetOrderToLinkedTruth}
      onJumpToNow={jumpIfPossible}
      listRef={listRef}
      onPlayFromHere={engine.playFromHere}
      q={q}
      setQ={setQ}
      allTracks={allTracks}
      onPlayTrack={engine.playTrack}
    />
  );
}