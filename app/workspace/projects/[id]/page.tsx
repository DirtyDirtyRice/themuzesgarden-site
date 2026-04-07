"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import PlaybackHelper from "../../../components/PlaybackHelper";
import { useAuth } from "../../../components/AuthProvider";
import ProjectActivityPanel from "./ProjectActivityPanel";
import ProjectHeader from "./ProjectHeader";
import ProjectKeyboardShortcuts from "./ProjectKeyboardShortcuts";
import ProjectLibraryWorkspace from "./ProjectLibraryWorkspace";
import ProjectMiniPlayer from "./ProjectMiniPlayer";
import ProjectNotesWorkspace from "./ProjectNotesWorkspace";
import ProjectOverviewWorkspace from "./ProjectOverviewWorkspace";
import ProjectPageShell from "./ProjectPageShell";
import ProjectTabs from "./ProjectTabs";
import { PROJECT_TAB_CONFIG } from "./projectTabConfig";
import {
  selectNowPlayingTrack,
  selectOrderedTracks,
  selectTopLinkedTracks,
} from "./projectPageSelectors";
import { writeProjectPlayerBridge } from "./projectPlayerBridge";
import { projectSupabase } from "./projectSupabase";
import {
  clamp01,
  looksLikeUuid,
} from "./projectDetailsUtils";
import type { MetadataTargetType, Tab } from "./projectDetailsTypes";
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
    orderedLinkedTracks,
    nowPlayingId,
    setNowPlayingId,
    setPreviewTrackId,
  });

  const previewTrack = useMemo(
    () => selectNowPlayingTrack(orderedLinkedTracks, previewTrackId),
    [orderedLinkedTracks, previewTrackId]
  );

  const overviewErr = projectErr ?? libraryOverviewErr ?? null;
  const overviewLoading = projectLoading || libraryOverviewLoading;
  const miniVisible = (miniAutoVisible || miniPlayerPinned) && !!nowPlayingId;

  function moveSetlistItem(tid: string, dir: "up" | "down") {
    setSetlistOrder((prev) => {
      const cur = prev.slice();
      const i = cur.indexOf(tid);
      if (i === -1) return prev;

      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= cur.length) return prev;

      const tmp = cur[i];
      cur[i] = cur[j];
      cur[j] = tmp;
      return cur;
    });
  }

  function selectTrackMetadataTarget(tid: string) {
    setMetadataTargetType("track");
    setMetadataTargetId(String(tid));
  }

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!looksLikeUuid(id)) return;
    void loadProject();
  }, [loading, user, id, loadProject]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (tab === "notes") {
      void loadNotes();
      return;
    }

    if (tab === "library") {
      void loadLibrary();
      return;
    }

    if (tab === "overview") {
      void loadOverviewDock();
    }
  }, [loading, user, tab, loadNotes, loadLibrary, loadOverviewDock]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!looksLikeUuid(id)) return;
    if (!project) return;

    const trackIds = orderedLinkedTracks
      .map((t: any) => String(t?.id ?? ""))
      .filter(Boolean);

    writeProjectPlayerBridge({
      projectId: String(id),
      projectTitle: String(project.title ?? "Untitled Project"),
      trackIds,
      trackCount: trackIds.length,
      updatedAt: new Date().toISOString(),
      source: "project-page",
    });
  }, [loading, user, id, project, orderedLinkedTracks]);

  useEffect(() => {
    if (tab !== "overview") return;

    function onScroll() {
      if (!nowPlayingCardRef.current) return;
      const rect = nowPlayingCardRef.current.getBoundingClientRect();
      setMiniAutoVisible(rect.top < -10);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll as any);
  }, [tab, setMiniAutoVisible]);

  useEffect(() => {
    if (tab !== "overview") return;
    if (previewTrackId) return;
    if (!orderedLinkedTracks.length) return;

    setPreviewTrackId(String(orderedLinkedTracks[0].id));
  }, [tab, previewTrackId, orderedLinkedTracks]);

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

      if (tab === "overview") {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isTyping =
          tag === "input" ||
          tag === "textarea" ||
          (target as any)?.isContentEditable;

        if (isTyping) return;

        const k = e.key?.toLowerCase?.() ?? "";

        if (k === "?" || k === "h") {
          e.preventDefault();
          setShowKeys((v) => !v);
          return;
        }

        if (e.code === "Space") {
          e.preventDefault();
          togglePlayPause();
          return;
        }

        if (k === "j" || e.key === "ArrowLeft") {
          e.preventDefault();
          prevTrack();
          return;
        }

        if (k === "k" || e.key === "ArrowRight") {
          e.preventDefault();
          nextTrack({ wrapIfSetlistLoop: true });
          return;
        }

        if (k === "s") {
          e.preventDefault();
          toggleShuffle();
          return;
        }

        if (k === "l") {
          e.preventDefault();
          toggleLoop();
          return;
        }

        if (k === "m") {
          e.preventDefault();
          setMuted((v) => !v);
          return;
        }

        if (k === "escape" && showKeys) {
          e.preventDefault();
          setShowKeys(false);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    tab,
    notesQuery,
    saveActiveNote,
    createNote,
    togglePlayPause,
    prevTrack,
    nextTrack,
    toggleShuffle,
    toggleLoop,
    setMuted,
    showKeys,
    setNotesQuery,
  ]);

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Project</h1>
        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm text-zinc-600">
            You must be signed in to view this project.
          </div>
          <Link
            href="/members"
            className="inline-block rounded bg-black px-4 py-2 text-white"
          >
            Go to Members Sign In
          </Link>
        </div>
      </main>
    );
  }

  let content: React.ReactNode = null;

  if (tab === "overview") {
    content = (
      <ProjectOverviewWorkspace
        project={project}
        overviewLoading={overviewLoading}
        overviewErr={overviewErr}
        linkedTracks={linkedTracks}
        orderedLinkedTracks={orderedLinkedTracks}
        topLinkedTracks={topLinkedTracks}
        nowPlayingId={nowPlayingId}
        nowPlayingTrack={nowPlayingTrack}
        previewTrackId={previewTrack ? String(previewTrack.id) : previewTrackId}
        metadataTargetType={metadataTargetType}
        metadataTargetId={metadataTargetId}
        playerErr={playerErr}
        onRefreshOverview={() => {
          void loadOverviewDock();
          void loadProject();
        }}
        onPlayProject={playProject}
        onPlayTrackById={playTrackById}
        onPreviewTrack={setPreviewTrackId}
        onSelectTrackMetadataTarget={selectTrackMetadataTarget}
        onMoveSetlistItem={moveSetlistItem}
        onStopPlayer={stopPlayer}
        nowPlayingCardRef={nowPlayingCardRef}
      />
    );
  } else if (tab === "notes") {
    content = (
      <ProjectNotesWorkspace
        notesErr={notesErr}
        notesQuery={notesQuery}
        setNotesQuery={setNotesQuery}
        totalNotes={totalNotes}
        shownNotes={shownNotes}
        displayNotes={displayNotes}
        activeNoteId={activeNoteId}
        activeNote={activeNote}
        editorTitle={editorTitle}
        setEditorTitle={setEditorTitle}
        editorBody={editorBody}
        setEditorBody={setEditorBody}
        editorDirty={editorDirty}
        autosaveOn={autosaveOn}
        setAutosaveOn={setAutosaveOn}
        creatingNote={creatingNote}
        savingNote={savingNote}
        deletingNote={deletingNote}
        renamingId={renamingId}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        renamingBusy={renamingBusy}
        onTrySwitchNote={trySwitchNote}
        onCreateNote={() => {
          void createNote();
        }}
        onSaveActiveNote={() => {
          void saveActiveNote();
        }}
        onDeleteActiveNote={() => {
          void deleteActiveNote();
        }}
        onTogglePin={togglePin}
        onStartRename={startRename}
        onCancelRename={cancelRename}
        onSaveRename={(noteId) => {
          void saveRename(noteId);
        }}
      />
    );
  } else if (tab === "library") {
    content = (
      <ProjectLibraryWorkspace
        allTracks={allTracks}
        linkedTracks={linkedTracks}
        linkedTrackIds={linkedTrackIds}
        loadingLibrary={loadingLibrary}
        libraryErr={libraryErr}
        linkBusyId={linkBusyId}
        nowPlayingId={nowPlayingId}
        previewTrackId={previewTrackId}
        metadataTargetType={metadataTargetType}
        metadataTargetId={metadataTargetId}
        onRefresh={() => {
          void loadLibrary();
        }}
        onPlayTrackById={playTrackById}
        onPreviewTrack={setPreviewTrackId}
        onSelectTrackMetadataTarget={selectTrackMetadataTarget}
        onUnlinkTrack={(tid) => {
          void unlinkTrack(tid);
        }}
        onLinkTrack={(tid) => {
          void linkTrack(tid);
        }}
      />
    );
  } else {
    content = <ProjectActivityPanel projectId={id} />;
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="text-sm text-zinc-600">
        <Link href="/workspace" className="underline">
          Workspace
        </Link>{" "}
        <span className="text-zinc-400">/</span>{" "}
        <Link href="/workspace/projects" className="underline">
          Projects
        </Link>{" "}
        <span className="text-zinc-400">/</span>{" "}
        <span className="text-zinc-700">Details</span>
      </div>

      <ProjectPageShell
        header={
          <ProjectHeader
            project={project}
            rightSlot={
              <div className="text-xs text-zinc-500 break-all">
                ID: {id}
              </div>
            }
          />
        }
        tabs={<ProjectTabs tab={tab} setTab={setTab} />}
        content={content}
      />

      <section className="rounded-xl border p-5">
        <Link href="/workspace/projects" className="rounded border px-3 py-2 text-sm">
          Back to Projects
        </Link>
      </section>

      <ProjectKeyboardShortcuts
        open={tab === "overview" && showKeys}
        onClose={() => setShowKeys(false)}
      />

      <ProjectMiniPlayer
        visible={tab === "overview" && miniVisible}
        nowPlayingTrack={nowPlayingTrack}
        upNextTrack={upNextTrack}
        playbackIndex={playbackIndex}
        playbackCount={playbackTracks.length}
        elapsedSec={elapsedSec}
        durationSec={durationSec}
        volume01={clamp01(volume01)}
        muted={muted}
        loopMode={loopMode}
        shuffleOn={shuffleOn}
        isPaused={isPaused}
        nowPlayingCardRef={nowPlayingCardRef}
        onShowKeys={() => setShowKeys(true)}
        onTogglePinned={() => setMiniPlayerPinned((v) => !v)}
        onToggleShuffle={toggleShuffle}
        onPrev={prevTrack}
        onNext={() => nextTrack({ wrapIfSetlistLoop: true })}
        onTogglePlayPause={togglePlayPause}
        onStop={stopPlayer}
        onToggleMuted={() => setMuted((v) => !v)}
        onVolumeChange={(value01) => setVolume01(clamp01(value01))}
        onToggleLoop={toggleLoop}
        onSeekStart={() => setSeeking(true)}
        onSeekEnd={() => setSeeking(false)}
        onSeekChange={(percent01) => {
          seekTo(percent01);
        }}
        miniPlayerPinned={miniPlayerPinned}
      />

      <audio ref={audioRef} onEnded={onEnded} />
      <PlaybackHelper />
    </main>
  );
}