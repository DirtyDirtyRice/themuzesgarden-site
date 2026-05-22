"use client";

import { useCallback, useEffect } from "react";
import type { Tab } from "./projectDetailsTypes";

export function useProjectProjectPlaybackHandlers({
  nowPlayingId,
  setMiniAutoVisible,
  playTrackById,
  playProject,
  prevTrack,
  nextTrack,
  togglePlayPause,
}: {
  nowPlayingId: string | null;
  setMiniAutoVisible: (value: boolean | ((previous: boolean) => boolean)) => void;
  playTrackById: (trackId: string) => void;
  playProject: () => void;
  prevTrack: () => void;
  nextTrack: (options?: { wrapIfSetlistLoop?: boolean }) => void;
  togglePlayPause: () => void;
}) {
  const handlePlayTrackById = useCallback(
    (trackId: string) => {
      const cleanId = String(trackId ?? "").trim();
      if (!cleanId) return;

      setMiniAutoVisible(true);
      playTrackById(cleanId);
    },
    [playTrackById, setMiniAutoVisible]
  );

  const handlePlayProject = useCallback(() => {
    setMiniAutoVisible(true);
    playProject();
  }, [playProject, setMiniAutoVisible]);

  const handleTogglePlayPause = useCallback(() => {
    if (nowPlayingId) {
      setMiniAutoVisible(true);
    }
    togglePlayPause();
  }, [nowPlayingId, setMiniAutoVisible, togglePlayPause]);

  const handlePrevTrack = useCallback(() => {
    setMiniAutoVisible(true);
    prevTrack();
  }, [prevTrack, setMiniAutoVisible]);

  const handleNextTrack = useCallback(() => {
    setMiniAutoVisible(true);
    nextTrack({ wrapIfSetlistLoop: true });
  }, [nextTrack, setMiniAutoVisible]);

  return {
    handlePlayTrackById,
    handlePlayProject,
    handleTogglePlayPause,
    handlePrevTrack,
    handleNextTrack,
  };
}

export function useProjectKeyboardPlaybackBindings({
  tab,
  notesQuery,
  showKeys,
  setShowKeys,
  setNotesQuery,
  saveActiveNote,
  createNote,
  toggleShuffle,
  toggleLoop,
  setMuted,
  playbackHandlers,
}: {
  tab: Tab;
  notesQuery: string;
  showKeys: boolean;
  setShowKeys: (value: boolean | ((previous: boolean) => boolean)) => void;
  setNotesQuery: (value: string) => void;
  saveActiveNote: () => Promise<unknown> | unknown;
  createNote: () => Promise<unknown> | unknown;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  setMuted: (value: boolean | ((previous: boolean) => boolean)) => void;
  playbackHandlers: ReturnType<typeof useProjectProjectPlaybackHandlers>;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;

      if (tab === "notes") {
        if (e.key === "Escape" && notesQuery) {
          e.preventDefault();
          setNotesQuery("");
          return;
        }

        if (isMod && (e.key === "s" || e.key === "S")) {
          e.preventDefault();
          void saveActiveNote();
          return;
        }

        if (isMod && (e.key === "n" || e.key === "N")) {
          e.preventDefault();
          void createNote();
          return;
        }
      }

      if (tab !== "overview") return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        (target as any)?.isContentEditable;

      if (isTyping) return;

      const key = e.key?.toLowerCase?.() ?? "";

      if (key === "?" || key === "h") {
        e.preventDefault();
        setShowKeys((value) => !value);
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        playbackHandlers.handleTogglePlayPause();
        return;
      }

      if (key === "j" || e.key === "ArrowLeft") {
        e.preventDefault();
        playbackHandlers.handlePrevTrack();
        return;
      }

      if (key === "k" || e.key === "ArrowRight") {
        e.preventDefault();
        playbackHandlers.handleNextTrack();
        return;
      }

      if (key === "s") {
        e.preventDefault();
        toggleShuffle();
        return;
      }

      if (key === "l") {
        e.preventDefault();
        toggleLoop();
        return;
      }

      if (key === "m") {
        e.preventDefault();
        setMuted((value) => !value);
        return;
      }

      if (key === "escape" && showKeys) {
        e.preventDefault();
        setShowKeys(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    tab,
    notesQuery,
    saveActiveNote,
    createNote,
    toggleShuffle,
    toggleLoop,
    setMuted,
    showKeys,
    setShowKeys,
    setNotesQuery,
    playbackHandlers,
  ]);
}
