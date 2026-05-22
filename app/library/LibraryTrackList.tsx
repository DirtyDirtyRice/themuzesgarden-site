"use client";

import { useMemo, useState } from "react";
import { LibraryTrackCard } from "./LibraryTrackCard";

type GroundworkTrackLike = {
  id?: unknown;
  title?: unknown;
  artist?: unknown;
  tags?: unknown;
  librarySourceLabel?: unknown;
  libraryVisibilityLabel?: unknown;
  sourceProjectTitle?: unknown;
};

type ProjectOptionLike = {
  id?: unknown;
  title?: unknown;
};

type Props = {
  tracks: GroundworkTrackLike[];
  projects: ProjectOptionLike[];
  loadingProjects: boolean;
  sendingToProject: boolean;
  projectLinkMessage: string | null;
  editingTrackId: string | null;
  onSetEditingTrackId: (trackId: string | null) => void;
  onAddFilterTag: (tagId: string) => void;
  onAddTagToTrack: (trackId: string, tagId: string) => void;
  onRemoveTagFromTrack: (trackId: string, tagId: string) => void;
  onRefreshProjects: () => void;
  onAddTracksToProject: (
    projectId: string,
    trackIds: string[]
  ) => Promise<boolean>;
};

const toolbarButtonClass =
  "rounded-2xl border border-white/25 bg-black px-4 py-2 text-xs font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:text-white/50 disabled:hover:scale-100";

const selectClass =
  "min-h-10 rounded-2xl border border-white/25 bg-black px-3 py-2 text-xs font-black text-white outline-none focus:border-white disabled:cursor-not-allowed disabled:text-white/50";

function cleanId(value: unknown): string {
  return String(value ?? "").trim();
}

export function LibraryTrackList({
  tracks,
  projects,
  loadingProjects,
  sendingToProject,
  projectLinkMessage,
  editingTrackId,
  onSetEditingTrackId,
  onAddFilterTag,
  onAddTagToTrack,
  onRemoveTagFromTrack,
  onRefreshProjects,
  onAddTracksToProject,
}: Props) {
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const visibleTrackIds = useMemo(() => {
    return tracks.map((track) => cleanId(track.id)).filter(Boolean);
  }, [tracks]);

  const selectedVisibleTrackIds = useMemo(() => {
    const visibleSet = new Set(visibleTrackIds);
    return selectedTrackIds.filter((trackId) => visibleSet.has(trackId));
  }, [selectedTrackIds, visibleTrackIds]);

  const selectedCount = selectedVisibleTrackIds.length;
  const hasTracks = visibleTrackIds.length > 0;
  const allVisibleSelected = hasTracks && selectedCount === visibleTrackIds.length;
  const canSend =
    selectedCount > 0 && selectedProjectId.length > 0 && !sendingToProject;

  function toggleTrackSelected(trackId: string) {
    const cleanTrackId = cleanId(trackId);
    if (!cleanTrackId) return;

    setSelectedTrackIds((currentIds) =>
      currentIds.includes(cleanTrackId)
        ? currentIds.filter((currentId) => currentId !== cleanTrackId)
        : [...currentIds, cleanTrackId]
    );
  }

  function selectAllVisibleTracks() {
    setSelectedTrackIds(visibleTrackIds);
  }

  function clearSelectedTracks() {
    setSelectedTrackIds([]);
  }

  async function handleSendToProject() {
    const ok = await onAddTracksToProject(
      selectedProjectId,
      selectedVisibleTrackIds
    );

    if (ok) {
      setSelectedTrackIds([]);
    }
  }

  return (
    <div className="space-y-3">
      <section className="rounded-3xl border border-white/25 bg-black p-4 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
              Library Actions
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Multi-select tracks
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Select one or more Library tracks, choose a project, then send the
              tracks into that project.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={allVisibleSelected ? clearSelectedTracks : selectAllVisibleTracks}
              disabled={!hasTracks}
            >
              {allVisibleSelected ? "Clear All" : "Select All"}
            </button>

            <button
              type="button"
              className={toolbarButtonClass}
              onClick={clearSelectedTracks}
              disabled={selectedCount === 0}
            >
              Clear
            </button>

            <button
              type="button"
              className={toolbarButtonClass}
              onClick={onRefreshProjects}
              disabled={loadingProjects}
            >
              {loadingProjects ? "Refreshing" : "Refresh Projects"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div className="rounded-2xl border border-white/25 bg-black px-4 py-3 text-sm font-bold text-white">
            Selected tracks: {selectedCount}
          </div>

          <select
            className={selectClass}
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            disabled={loadingProjects || projects.length === 0}
          >
            <option value="">
              {loadingProjects
                ? "Loading projects..."
                : projects.length === 0
                  ? "No projects found"
                  : "Send To Project..."}
            </option>

            {projects.map((project) => {
              const projectId = cleanId(project.id);
              const projectTitle = String(project.title ?? "Untitled project");
              if (!projectId) return null;

              return (
                <option key={projectId} value={projectId}>
                  {projectTitle}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            className={toolbarButtonClass}
            onClick={handleSendToProject}
            disabled={!canSend}
          >
            {sendingToProject ? "Sending..." : "Send To"}
          </button>
        </div>

        {projectLinkMessage ? (
          <p className="mt-3 rounded-2xl border border-white/25 bg-black p-3 text-sm font-bold text-white/70">
            {projectLinkMessage}
          </p>
        ) : null}
      </section>

      {tracks.map((track) => {
        const trackId = cleanId(track.id);
        const isEditing = editingTrackId === trackId;
        const isSelected = selectedTrackIds.includes(trackId);

        return (
          <LibraryTrackCard
            key={trackId}
            track={track as any}
            isEditing={isEditing}
            isSelected={isSelected}
            onToggleSelected={() => toggleTrackSelected(trackId)}
            onSetEditing={() =>
              onSetEditingTrackId(isEditing ? null : trackId)
            }
            onAddFilterTag={onAddFilterTag}
            onAddTagToTrack={onAddTagToTrack}
            onRemoveTagFromTrack={onRemoveTagFromTrack}
          />
        );
      })}

      {tracks.length === 0 && (
        <div className="rounded-2xl border border-white/25 bg-black p-6 text-sm text-white/70">
          No tracks found in the Library yet.
        </div>
      )}
    </div>
  );
}
