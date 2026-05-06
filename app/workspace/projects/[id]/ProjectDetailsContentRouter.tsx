"use client";

import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import ProjectActivityPanel from "./ProjectActivityPanel";
import ProjectLibraryWorkspace from "./ProjectLibraryWorkspace";
import ProjectNotesWorkspace from "./ProjectNotesWorkspace";
import ProjectOverviewWorkspace from "./ProjectOverviewWorkspace";
import type { Tab } from "./projectDetailsTypes";

export default function ProjectDetailsContentRouter(props: {
  tab: Tab;
  project: any;
  overviewLoading: boolean;
  overviewErr: string | null;
  linkedTracks: any[];
  orderedLinkedTracks: any[];
  topLinkedTracks: any[];
  nowPlayingId: string | null;
  nowPlayingTrack: any;
  previewTrackId: string | null;
  metadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  playerErr: string | null;
  onRefreshOverview: () => void;
  onPlayProject: () => void;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string | null) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
  onMoveSetlistItem: (tid: string, dir: "up" | "down") => void;
  onStopPlayer: () => void;
  nowPlayingCardRef: React.RefObject<HTMLDivElement | null>;

  notesErr: string | null;
  notesQuery: string;
  setNotesQuery: (value: string) => void;
  totalNotes: number;
  shownNotes: number;
  displayNotes: any[];
  activeNoteId: string | null;
  activeNote: any;
  editorTitle: string;
  setEditorTitle: (value: string) => void;
  editorBody: string;
  setEditorBody: (value: string) => void;
  editorDirty: boolean;
  autosaveOn: boolean;
  setAutosaveOn: (value: boolean) => void;
  creatingNote: boolean;
  savingNote: boolean;
  deletingNote: boolean;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  renamingBusy: boolean;
  onTrySwitchNote: (note: any) => void;
  onCreateNote: () => void;
  onSaveActiveNote: () => void;
  onDeleteActiveNote: () => void;
  onTogglePin: (note: any) => void;
  onStartRename: (note: any) => void;
  onCancelRename: () => void;
  onSaveRename: (noteId: string) => void;

  allTracks: any[];
  linkedTrackIds: Set<string>;
  loadingLibrary: boolean;
  libraryErr: string | null;
  linkBusyId: string | null;
  onRefreshLibrary: () => void;
  onUnlinkTrack: (tid: string) => void;
  onLinkTrack: (tid: string) => void;
}) {
  const {
    tab,
    project,
    overviewLoading,
    overviewErr,
    linkedTracks,
    orderedLinkedTracks,
    topLinkedTracks,
    nowPlayingId,
    nowPlayingTrack,
    previewTrackId,
    metadataTargetType,
    metadataTargetId,
    playerErr,
    onRefreshOverview,
    onPlayProject,
    onPlayTrackById,
    onPreviewTrack,
    onSelectTrackMetadataTarget,
    onMoveSetlistItem,
    onStopPlayer,
    nowPlayingCardRef,

    notesErr,
    notesQuery,
    setNotesQuery,
    totalNotes,
    shownNotes,
    displayNotes,
    activeNoteId,
    activeNote,
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
    onTrySwitchNote,
    onCreateNote,
    onSaveActiveNote,
    onDeleteActiveNote,
    onTogglePin,
    onStartRename,
    onCancelRename,
    onSaveRename,

    allTracks,
    linkedTrackIds,
    loadingLibrary,
    libraryErr,
    linkBusyId,
    onRefreshLibrary,
    onUnlinkTrack,
    onLinkTrack,
  } = props;

  if (tab === "overview") {
    return (
      <ProjectOverviewWorkspace
        project={project}
        overviewLoading={overviewLoading}
        overviewErr={overviewErr}
        linkedTracks={linkedTracks}
        orderedLinkedTracks={orderedLinkedTracks}
        topLinkedTracks={topLinkedTracks}
        nowPlayingId={nowPlayingId}
        nowPlayingTrack={nowPlayingTrack}
        previewTrackId={previewTrackId}
        metadataTargetType={metadataTargetType}
        metadataTargetId={metadataTargetId}
        playerErr={playerErr}
        onRefreshOverview={onRefreshOverview}
        onPlayProject={onPlayProject}
        onPlayTrackById={onPlayTrackById}
        onPreviewTrack={onPreviewTrack}
        onSelectTrackMetadataTarget={onSelectTrackMetadataTarget}
        onMoveSetlistItem={onMoveSetlistItem}
        onStopPlayer={onStopPlayer}
        nowPlayingCardRef={nowPlayingCardRef}
      />
    );
  }

  if (tab === "notes") {
    return (
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
        onTrySwitchNote={onTrySwitchNote}
        onCreateNote={onCreateNote}
        onSaveActiveNote={onSaveActiveNote}
        onDeleteActiveNote={onDeleteActiveNote}
        onTogglePin={onTogglePin}
        onStartRename={onStartRename}
        onCancelRename={onCancelRename}
        onSaveRename={onSaveRename}
      />
    );
  }

  if (tab === "library") {
    return (
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
        onRefresh={onRefreshLibrary}
        onPlayTrackById={onPlayTrackById}
        onPreviewTrack={onPreviewTrack}
        onSelectTrackMetadataTarget={onSelectTrackMetadataTarget}
        onUnlinkTrack={onUnlinkTrack}
        onLinkTrack={onLinkTrack}
      />
    );
  }

  return <ProjectActivityPanel />;
}