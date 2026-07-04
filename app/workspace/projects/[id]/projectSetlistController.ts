"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import {
  selectNowPlayingTrack,
  selectOrderedTracks,
  selectTopLinkedTracks,
} from "./projectPageSelectors";
import { projectSupabase } from "./projectSupabase";
import type { Tab } from "./projectDetailsTypes";
import { useProjectLibraryLinking } from "./useProjectLibraryLinking";
import { useProjectNotes } from "./useProjectNotes";
import { useProjectOverview } from "./useProjectOverview";
import { useProjectPlayback } from "./useProjectPlayback";
import { useProjectDetailsLifecycleEffects } from "./projectLinkedTrackHelpers";
import {
  moveTrackInSetlistOrder,
  useReconciledProjectSetlistOrder,
} from "./projectSetlistOrdering";
import {
  cleanSetlistOrder,
  persistProjectSetlistOrder,
  sameTrackOrder,
} from "./projectSetlistPersistence";
import {
  useProjectKeyboardPlaybackBindings,
  useProjectProjectPlaybackHandlers,
} from "./projectProjectPlaybackHandlers";

export type ProjectSetlistControllerArgs = {
  id: string;
  loading: boolean;
  user: User | null;
};

export function useProjectSetlistController({
  id,
  loading,
  user,
}: ProjectSetlistControllerArgs) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [setlistOrder, setSetlistOrder] = useState<string[]>([]);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [metadataTargetType, setMetadataTargetType] =
    useState<MetadataTargetType>("track");
  const [metadataTargetId, setMetadataTargetId] = useState<string | null>(null);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nowPlayingCardRef = useRef<HTMLDivElement | null>(null);

  const projectOverview = useProjectOverview({
    projectId: id,
    supabase: projectSupabase,
  });

  const updateSetlistOrderWithPersistence = useCallback(
    (action: React.SetStateAction<string[]>) => {
      setSetlistOrder((previousOrder) => {
        const nextOrder =
          typeof action === "function"
            ? (action as (value: string[]) => string[])(previousOrder)
            : action;
        const cleanOrder = cleanSetlistOrder(nextOrder);

        if (!sameTrackOrder(previousOrder, cleanOrder)) {
          persistProjectSetlistOrder({
            projectId: id,
            nextOrder: cleanOrder,
            setProject: projectOverview.setProject,
            supabase: projectSupabase,
          });
        }

        return cleanOrder;
      });
    },
    [id, projectOverview.setProject],
  );

  const projectNotes = useProjectNotes({
    projectId: id,
    supabase: projectSupabase,
  });

  const projectLibrary = useProjectLibraryLinking({
    projectId: id,
    supabase: projectSupabase,
    setSetlistOrder: updateSetlistOrderWithPersistence,
    setNowPlayingId,
    setPreviewTrackId,
    metadataTargetType,
    metadataTargetId,
    setMetadataTargetId,
  });

  const orderedLinkedTracks = useMemo(
    () => selectOrderedTracks(projectLibrary.linkedTracks, setlistOrder),
    [projectLibrary.linkedTracks, setlistOrder],
  );

  const topLinkedTracks = useMemo(
    () => selectTopLinkedTracks(orderedLinkedTracks, 5),
    [orderedLinkedTracks],
  );

  const playbackSourceTracks = useMemo(
    () => (tab === "library" ? projectLibrary.allTracks : orderedLinkedTracks),
    [tab, projectLibrary.allTracks, orderedLinkedTracks],
  );

  const projectPlayback = useProjectPlayback({
    projectId: id,
    audioRef,
    orderedLinkedTracks: playbackSourceTracks,
    nowPlayingId,
    setNowPlayingId,
    setPreviewTrackId,
  });

  const playbackHandlers = useProjectProjectPlaybackHandlers({
    nowPlayingId,
    setMiniAutoVisible: projectPlayback.setMiniAutoVisible,
    playTrackById: projectPlayback.playTrackById,
    playProject: projectPlayback.playProject,
    prevTrack: projectPlayback.prevTrack,
    nextTrack: projectPlayback.nextTrack,
    togglePlayPause: projectPlayback.togglePlayPause,
  });

  const previewSourceTracks = useMemo(
    () => (tab === "library" ? projectLibrary.allTracks : orderedLinkedTracks),
    [tab, projectLibrary.allTracks, orderedLinkedTracks],
  );

  const previewTrack = useMemo(
    () => selectNowPlayingTrack(previewSourceTracks, previewTrackId),
    [previewSourceTracks, previewTrackId],
  );

  const overviewErr =
    projectOverview.overviewErr ?? projectLibrary.overviewErr ?? null;
  const overviewLoading =
    projectOverview.overviewLoading || projectLibrary.overviewLoading;
  const miniVisible =
    (projectPlayback.miniAutoVisible || projectPlayback.miniPlayerPinned) &&
    !!nowPlayingId;

  const moveSetlistItem = useCallback(
    (trackId: string, direction: "up" | "down") => {
      updateSetlistOrderWithPersistence((previousOrder) =>
        moveTrackInSetlistOrder(previousOrder, trackId, direction),
      );
    },
    [updateSetlistOrderWithPersistence],
  );

  const selectTrackMetadataTarget = useCallback((trackId: string) => {
    setMetadataTargetType("track");
    setMetadataTargetId(String(trackId));
  }, []);

  useReconciledProjectSetlistOrder({
    project: projectOverview.project,
    linkedTracks: projectLibrary.linkedTracks,
    setSetlistOrder,
  });

  useProjectDetailsLifecycleEffects({
    id,
    loading,
    user,
    tab: tab ?? "overview",
    project: projectOverview.project,
    orderedLinkedTracks,
    previewTrackId,
    nowPlayingCardRef,
    setMiniAutoVisible: projectPlayback.setMiniAutoVisible,
    setPreviewTrackId,
    loadProject: projectOverview.loadProject,
    loadNotes: projectNotes.loadNotes,
    loadLibrary: projectLibrary.loadLibrary,
    loadOverviewDock: projectLibrary.loadOverviewDock,
  });

  useProjectKeyboardPlaybackBindings({
    tab: tab ?? "overview",
    notesQuery: projectNotes.notesQuery,
    showKeys,
    setShowKeys,
    setNotesQuery: projectNotes.setNotesQuery,
    saveActiveNote: projectNotes.saveActiveNote,
    createNote: projectNotes.createNote,
    toggleShuffle: projectPlayback.toggleShuffle,
    toggleLoop: projectPlayback.toggleLoop,
    setMuted: projectPlayback.setMuted,
    playbackHandlers,
  });

  return {
    ...projectNotes,
    ...projectLibrary,
    ...projectPlayback,
    id,
    tab,
    setTab,
    showKeys,
    setShowKeys,
    project: projectOverview.project,
    overviewLoading,
    overviewErr,
    orderedLinkedTracks,
    topLinkedTracks,
    nowPlayingId,
    setPreviewTrackId,
    resolvedPreviewTrackId: previewTrack
      ? String(previewTrack.id)
      : previewTrackId,
    metadataTargetType,
    metadataTargetId,
    playbackHandlers,
    selectTrackMetadataTarget,
    moveSetlistItem,
    nowPlayingCardRef,
    miniVisible,
    audioRef,
    handleSaveProjectDescription: projectOverview.saveProjectDescription,
    handleRefreshOverview: () => {
      void projectLibrary.loadOverviewDock();
      void projectOverview.loadProject();
    },
    handleRefreshLibrary: () => {
      void projectLibrary.loadLibrary();
    },
    handleUnlinkTrack: (trackId: string) => {
      void projectLibrary.unlinkTrack(trackId);
    },
    handleLinkTrack: (trackId: string) => {
      void projectLibrary.linkTrack(trackId);
    },
    handleTrySwitchNote: (note: unknown) => {
      void projectNotes.trySwitchNote(note as any);
    },
    handleCreateNote: () => {
      void projectNotes.createNote();
    },
    handleSaveActiveNote: () => {
      void projectNotes.saveActiveNote();
    },
    handleDeleteActiveNote: () => {
      void projectNotes.deleteActiveNote();
    },
    handleTogglePin: (note: unknown) => {
      void projectNotes.togglePin(note as any);
    },
    handleStartRename: (note: unknown) => {
      projectNotes.startRename(note as any);
    },
    handleSaveRename: (noteId: string) => {
      void projectNotes.saveRename(noteId);
    },
  };
}

export type ProjectSetlistControllerState = ReturnType<
  typeof useProjectSetlistController
>;