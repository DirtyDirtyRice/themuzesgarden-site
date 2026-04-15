"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import PlaybackHelper from "../../../components/PlaybackHelper";
import { useAuth } from "../../../components/AuthProvider";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import ProjectActivityPanel from "./ProjectActivityPanel";
import ProjectHeader from "./ProjectHeader";
import ProjectKeyboardShortcuts from "./ProjectKeyboardShortcuts";
import ProjectLibraryWorkspace from "./ProjectLibraryWorkspace";
import ProjectMiniPlayer from "./ProjectMiniPlayer";
import ProjectNotesWorkspace from "./ProjectNotesWorkspace";
import ProjectOverviewWorkspace from "./ProjectOverviewWorkspace";
import ProjectPageShell from "./ProjectPageShell";
import ProjectTabs from "./ProjectTabs";
import {
  selectNowPlayingTrack,
  selectOrderedTracks,
  selectTopLinkedTracks,
} from "./projectPageSelectors";
import { writeProjectPlayerBridge } from "./projectPlayerBridge";
import { projectSupabase } from "./projectSupabase";
import { clamp01, looksLikeUuid } from "./projectDetailsUtils";
import type { Tab } from "./projectDetailsTypes";
import { useProjectLibraryLinking } from "./useProjectLibraryLinking";
import { useProjectNotes } from "./useProjectNotes";
import { useProjectOverview } from "./useProjectOverview";
import { useProjectPlayback } from "./useProjectPlayback";

export default function ProjectDetailsPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const id = useMemo(() => String((params as any)?.id ?? ""), [params]);

  const [tab, setTab] = useState<Tab>("overview");
  const [setlistOrder, setSetlistOrder] = useState<string[]>([]);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [metadataTargetType, setMetadataTargetType] =
    useState<MetadataTargetType>("track");
  const [metadataTargetId, setMetadataTargetId] = useState<string | null>(null);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nowPlayingCardRef = useRef<HTMLDivElement | null>(null);

  const {
    project,
    overviewLoading: projectLoading,
    overviewErr: projectErr,
    loadProject,
  } = useProjectOverview({
    projectId: id,
    supabase: projectSupabase,
  });

  const {
    notesErr,
    notesQuery,
    setNotesQuery,
    activeNoteId,
    activeNote,
    displayNotes,
    totalNotes,
    shownNotes,
    editorTitle,
    setEditorTitle,
    editorBody,
    setEditorBody,
    editorDirty,
    autosaveOn,
    setAutosaveOn,
    creatingNote,
    savingNote,
    deletingNote,
    renamingId,
    renameValue,
    setRenameValue,
    renamingBusy,
    loadNotes,
    createNote,
    saveActiveNote,
    togglePin,
    startRename,
    cancelRename,
    saveRename,
    deleteActiveNote,
    trySwitchNote,
  } = useProjectNotes({
    projectId: id,
    supabase: projectSupabase,
  });

  const {
    allTracks,
    linkedTrackIds,
    linkedTracks,
    loadingLibrary,
    libraryErr,
    overviewLoading: libraryOverviewLoading,
    overviewErr: libraryOverviewErr,
    linkBusyId,
    loadLibrary,
    loadOverviewDock,
    linkTrack,
    unlinkTrack,
  } = useProjectLibraryLinking({
    projectId: id,
    supabase: projectSupabase,
    setSetlistOrder,
    setNowPlayingId,
    setPreviewTrackId,
    metadataTargetType,
    metadataTargetId,
    setMetadataTargetId,
  });

  const orderedLinkedTracks = useMemo(
    () => selectOrderedTracks(linkedTracks, setlistOrder),
    [linkedTracks, setlistOrder]
  );

  const topLinkedTracks = useMemo(
    () => selectTopLinkedTracks(orderedLinkedTracks, 5),
    [orderedLinkedTracks]
  );

  const playbackSourceTracks = useMemo(
    () => (tab === "library" ? allTracks : orderedLinkedTracks),
    [tab, allTracks, orderedLinkedTracks]
  );

  const {
    playerErr,
    elapsedSec,
    durationSec,
    seeking,
    setSeeking,
    miniPlayerPinned,
    setMiniPlayerPinned,
    miniAutoVisible,
    setMiniAutoVisible,
    loopMode,
    isPaused,
    shuffleOn,
    volume01,
    setVolume01,
    muted,
    setMuted,
    playbackTracks,
    nowPlayingTrack,
    playbackIndex,
    upNextTrack,
    seekTo,
    playTrackById,
    playProject,
    prevTrack,
    nextTrack,
    stopPlayer,
    togglePlayPause,
    onEnded,
    toggleLoop,
    toggleShuffle,
  } = useProjectPlayback({
    projectId: id,
    audioRef,
    orderedLinkedTracks: playbackSourceTracks,
    nowPlayingId,
    setNowPlayingId,
    setPreviewTrackId,
  });

  if (loading) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4 text-white">
        <h1 className="text-2xl font-bold">Project</h1>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5 space-y-2">
          <div className="text-sm text-white/70">
            You must be signed in to view this project.
          </div>

          <Link
            href="/members"
            className="inline-block rounded bg-white px-4 py-2 text-black"
          >
            Go to Members Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6 text-white">
      <div className="text-sm text-white/50">
        <Link href="/workspace" className="underline">
          Workspace
        </Link>{" "}
        <span className="text-white/30">/</span>{" "}
        <Link href="/workspace/projects" className="underline">
          Projects
        </Link>{" "}
        <span className="text-white/30">/</span>{" "}
        <span className="text-white/70">Details</span>
      </div>

      <ProjectPageShell
        header={<ProjectHeader project={project} />}
        tabs={<ProjectTabs tab={tab} setTab={setTab} />}
        content={
          tab === "overview" ? (
            <ProjectOverviewWorkspace />
          ) : tab === "notes" ? (
            <ProjectNotesWorkspace />
          ) : tab === "library" ? (
            <ProjectLibraryWorkspace />
          ) : (
            <ProjectActivityPanel />
          )
        }
      />

      <section className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
        <Link
          href="/workspace/projects"
          className="rounded border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          Back to Projects
        </Link>
      </section>

      <ProjectKeyboardShortcuts
        open={tab === "overview" && showKeys}
        onClose={() => setShowKeys(false)}
      />

      <ProjectMiniPlayer />

      <audio ref={audioRef} />
      <PlaybackHelper />
    </main>
  );
}