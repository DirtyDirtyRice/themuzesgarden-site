"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerTab } from "../../player/playerTypes";
import { readPersisted, writePersisted } from "../../player/playerStorage";
import { useAllTracks } from "../../player/useAllTracks";
import { useProjectContext } from "../../player/useProjectContext";
import { useProjectSetlist } from "../../player/useProjectSetlist";
import { useAudioEngine } from "../../player/useAudioEngine";
import PlayerPanel from "../../player/PlayerPanel";

let GLOBAL_PLAYER_Q_MEMORY = "";
let GLOBAL_PLAYER_TAB_MEMORY: PlayerTab = "search";

export default function GlobalPlayer() {
  const { onProjectPage, projectId } = useProjectContext();

  const [tab, setTabState] = useState<PlayerTab>(() => {
    if (onProjectPage) return "project";
    return GLOBAL_PLAYER_TAB_MEMORY;
  });

  const [q, setQState] = useState(() => GLOBAL_PLAYER_Q_MEMORY);

  const restoredTabRef = useRef(false);
  const previousOnProjectPageRef = useRef(onProjectPage);

  const { allTracks } = useAllTracks();

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

  const setTab = useCallback((nextValue: PlayerTab) => {
    GLOBAL_PLAYER_TAB_MEMORY = nextValue;
    setTabState((prev) => (prev === nextValue ? prev : nextValue));
  }, []);

  const engine = useAudioEngine({
    tab,
    setTab,
    onProjectPage,
    projectId,
    allTracks,
    projectTracks,
  });

  const setQ = useCallback((nextValue: string) => {
    const clean = String(nextValue ?? "");
    GLOBAL_PLAYER_Q_MEMORY = clean;
    setQState((prev) => (prev === clean ? prev : clean));
  }, []);

  useEffect(() => {
    if (restoredTabRef.current) return;
    restoredTabRef.current = true;

    if (onProjectPage) {
      GLOBAL_PLAYER_TAB_MEMORY = "project";
      setTabState((prev) => (prev === "project" ? prev : "project"));
      return;
    }

    const persisted = readPersisted();
    const savedTab = persisted.tab;

    if (savedTab === "project" || savedTab === "search") {
      GLOBAL_PLAYER_TAB_MEMORY = savedTab;
      setTabState((prev) => (prev === savedTab ? prev : savedTab));
    }
  }, [onProjectPage]);

  useEffect(() => {
    const previousOnProjectPage = previousOnProjectPageRef.current;

    if (!previousOnProjectPage && onProjectPage) {
      previousOnProjectPageRef.current = onProjectPage;
      GLOBAL_PLAYER_TAB_MEMORY = "project";
      setTabState((prev) => (prev === "project" ? prev : "project"));
      return;
    }

    if (previousOnProjectPage !== onProjectPage) {
      previousOnProjectPageRef.current = onProjectPage;
    }
  }, [onProjectPage]);

  useEffect(() => {
    GLOBAL_PLAYER_TAB_MEMORY = tab;
    writePersisted({ tab });
  }, [tab]);

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

      console.log("[GlobalPlayer] muzesgarden-search-tag fired", {
        nextTag,
        pathname: window.location.pathname,
        tabBefore: tab,
        qBefore: q,
        onProjectPage,
        projectId,
        time: new Date().toISOString(),
      });

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
  }, [onProjectPage, projectId, q, setQ, setTab, tab]);

  useEffect(() => {
    console.log("[GlobalPlayer] state changed", {
      tab,
      q,
      onProjectPage,
      projectId,
      pathname: typeof window !== "undefined" ? window.location.pathname : "",
      time: new Date().toISOString(),
    });
  }, [tab, q, onProjectPage, projectId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;

      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        engine.togglePlayPause();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [engine]);

  const jumpIfPossible = useCallback(() => {
    if (!engine.nowId) return;
    if (!onProjectPage) return;

    setTab("project");

    window.setTimeout(() => {
      jumpToNow(engine.nowId!);
    }, 0);
  }, [engine.nowId, jumpToNow, onProjectPage, setTab]);

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