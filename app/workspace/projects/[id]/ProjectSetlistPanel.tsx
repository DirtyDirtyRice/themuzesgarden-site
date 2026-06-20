"use client";

import PlaybackHelper from "../../../components/PlaybackHelper";
import ProjectHeader from "./ProjectHeader";
import ProjectKeyboardShortcuts from "./ProjectKeyboardShortcuts";
import ProjectMiniPlayer from "./ProjectMiniPlayer";
import ProjectPageShell from "./ProjectPageShell";
import ProjectTabs from "./ProjectTabs";
import ProjectDetailsBackLink from "./ProjectDetailsBackLink";
import ProjectDetailsBreadcrumbs from "./ProjectDetailsBreadcrumbs";
import ProjectDetailsContentRouter from "./ProjectDetailsContentRouter";
import { clamp01 } from "./projectDetailsUtils";
import type { ProjectSetlistControllerState } from "./projectSetlistController";

export default function ProjectSetlistPanel({
  controller,
}: {
  controller: ProjectSetlistControllerState;
}) {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 text-white">
      <ProjectDetailsBreadcrumbs />

      <ProjectPageShell
        header={
          <ProjectHeader
            project={controller.project}
            rightSlot={
              <div className="break-all text-xs text-white/45">
                ID: {controller.id}
              </div>
            }
          />
        }
        tabs={<ProjectTabs tab={controller.tab} setTab={controller.setTab} />}
        content={
          controller.tab ? (
            <ProjectDetailsContentRouter
              tab={controller.tab}
              project={controller.project}
              overviewLoading={controller.overviewLoading}
              overviewErr={controller.overviewErr}
              linkedTracks={controller.linkedTracks}
              orderedLinkedTracks={controller.orderedLinkedTracks}
              topLinkedTracks={controller.topLinkedTracks}
              nowPlayingId={controller.nowPlayingId}
              nowPlayingTrack={controller.nowPlayingTrack}
              previewTrackId={controller.resolvedPreviewTrackId}
              metadataTargetType={controller.metadataTargetType}
              metadataTargetId={controller.metadataTargetId}
              playerErr={controller.playerErr}
              onRefreshOverview={controller.handleRefreshOverview}
              onPlayProject={controller.playbackHandlers.handlePlayProject}
              onPlayTrackById={controller.playbackHandlers.handlePlayTrackById}
              onPreviewTrack={controller.setPreviewTrackId}
              onSelectTrackMetadataTarget={controller.selectTrackMetadataTarget}
              onMoveSetlistItem={controller.moveSetlistItem}
              onStopPlayer={controller.stopPlayer}
              nowPlayingCardRef={controller.nowPlayingCardRef}
              notesErr={controller.notesErr}
              notesQuery={controller.notesQuery}
              setNotesQuery={controller.setNotesQuery}
              totalNotes={controller.totalNotes}
              shownNotes={controller.shownNotes}
              displayNotes={controller.displayNotes}
              activeNoteId={controller.activeNoteId}
              activeNote={controller.activeNote}
              editorTitle={controller.editorTitle}
              setEditorTitle={controller.setEditorTitle}
              editorBody={controller.editorBody}
              setEditorBody={controller.setEditorBody}
              editorDirty={controller.editorDirty}
              autosaveOn={controller.autosaveOn}
              setAutosaveOn={controller.setAutosaveOn}
              creatingNote={controller.creatingNote}
              savingNote={controller.savingNote}
              deletingNote={controller.deletingNote}
              renamingId={controller.renamingId}
              renameValue={controller.renameValue}
              setRenameValue={controller.setRenameValue}
              renamingBusy={controller.renamingBusy}
              onTrySwitchNote={controller.handleTrySwitchNote}
              onCreateNote={controller.handleCreateNote}
              onSaveActiveNote={controller.handleSaveActiveNote}
              onDeleteActiveNote={controller.handleDeleteActiveNote}
              onTogglePin={controller.handleTogglePin}
              onStartRename={controller.handleStartRename}
              onCancelRename={controller.cancelRename}
              onSaveRename={controller.handleSaveRename}
              allTracks={controller.allTracks}
              linkedTrackIds={controller.linkedTrackIds}
              loadingLibrary={controller.loadingLibrary}
              libraryErr={controller.libraryErr}
              linkBusyId={controller.linkBusyId}
              onRefreshLibrary={controller.handleRefreshLibrary}
              onUnlinkTrack={controller.handleUnlinkTrack}
              onLinkTrack={controller.handleLinkTrack}
            />
          ) : null
        }
      />

      <ProjectDetailsBackLink />

      <ProjectKeyboardShortcuts
        open={controller.tab === "overview" && controller.showKeys}
        onClose={() => controller.setShowKeys(false)}
      />

      <ProjectMiniPlayer
        visible={controller.miniVisible}
        nowPlayingTrack={controller.nowPlayingTrack}
        upNextTrack={controller.upNextTrack}
        playbackIndex={controller.playbackIndex}
        playbackCount={controller.playbackTracks.length}
        elapsedSec={controller.elapsedSec}
        durationSec={controller.durationSec}
        volume01={clamp01(controller.volume01)}
        muted={controller.muted}
        loopMode={controller.loopMode}
        shuffleOn={controller.shuffleOn}
        isPaused={controller.isPaused}
        nowPlayingCardRef={controller.nowPlayingCardRef}
        onShowKeys={() => controller.setShowKeys(true)}
        onTogglePinned={() => controller.setMiniPlayerPinned((value) => !value)}
        onToggleShuffle={controller.toggleShuffle}
        onPrev={controller.playbackHandlers.handlePrevTrack}
        onNext={controller.playbackHandlers.handleNextTrack}
        onTogglePlayPause={controller.playbackHandlers.handleTogglePlayPause}
        onStop={controller.stopPlayer}
        onToggleMuted={() => controller.setMuted((value) => !value)}
        onVolumeChange={(value01) => controller.setVolume01(clamp01(value01))}
        onToggleLoop={controller.toggleLoop}
        onSeekStart={() => controller.setSeeking(true)}
        onSeekEnd={() => controller.setSeeking(false)}
        onSeekChange={(percent01) => {
          controller.seekTo(percent01);
        }}
        miniPlayerPinned={controller.miniPlayerPinned}
      />

      <audio ref={controller.audioRef} onEnded={controller.onEnded} />
      <PlaybackHelper />
    </main>
  );
}