"use client";

import { useMemo, useState } from "react";
import SharedDownloadButtons from "../shared/downloads/SharedDownloadButtons";
import { LibraryTrackCard } from "./LibraryTrackCard";

type GroundworkTrackLike = {
  id?: unknown;
  title?: unknown;
  artist?: unknown;
  tags?: unknown;
  url?: unknown;
  fileUrl?: unknown;
  publicUrl?: unknown;
  audioUrl?: unknown;
  librarySourceLabel?: unknown;
  libraryVisibilityLabel?: unknown;
  sourceProjectTitle?: unknown;
};

type ProjectOptionLike = {
  id?: unknown;
  title?: unknown;
};

type LastSentProject = {
  id: string;
  title: string;
  sentCount: number;
};

type GroupedLibraryTrack = {
  id: string;
  title: string;
  copyCount: number;
  tracks: GroundworkTrackLike[];
};

type Props = {
  tracks: GroundworkTrackLike[];
  searchQuery: string;
  projectSearchQuery: string;
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

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function getTrackTitle(track: GroundworkTrackLike) {
  return cleanText(track.title) || "library-track";
}

function getTrackAudioUrl(track: GroundworkTrackLike) {
  return (
    cleanText(track.url) ||
    cleanText(track.fileUrl) ||
    cleanText(track.publicUrl) ||
    cleanText(track.audioUrl)
  );
}

function getProjectTitle(project: ProjectOptionLike | null | undefined) {
  return cleanText(project?.title) || "Untitled project";
}

function slugifyDownloadName(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "library-track"
  );
}

function normalizeLibraryTitle(value: string) {
  return (
    value
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/\s+/g, " ")
      .trim() || "Untitled Track"
  );
}

function stripCopyWords(value: string) {
  const copyWords = [
    "rock",
    "funk",
    "hiphop",
    "trap",
    "jazz",
    "edm",
    "house",
    "techno",
    "ambient",
    "lofi",
    "keeper",
    "keeper1",
    "keeper2",
    "keeper3",
    "suno",
    "master",
    "mix",
    "demo",
    "draft",
    "final",
    "version",
    "v1",
    "v2",
    "v3",
    "v4",
    "v5",
    "wav",
    "mp3",
    "flac",
    "aiff",
    "stem",
    "stems",
    "instrumental",
    "vocal",
    "vocals",
    "drums",
    "bass",
    "guitar",
    "keys",
  ];

  const words = normalizeLibraryTitle(value).split(" ");
  const keptWords = [...words];

  while (keptWords.length > 1) {
    const lastWord = keptWords[keptWords.length - 1]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (!copyWords.includes(lastWord)) break;
    keptWords.pop();
  }

  return keptWords.join(" ").trim() || value;
}

function getGroupTitle(track: GroundworkTrackLike) {
  return stripCopyWords(getTrackTitle(track));
}

function getGroupId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildGroupedTracks(tracks: GroundworkTrackLike[]): GroupedLibraryTrack[] {
  const groups = new Map<string, GroupedLibraryTrack>();

  tracks.forEach((track) => {
    const title = getGroupTitle(track);
    const id = getGroupId(title);
    const existing = groups.get(id);

    if (existing) {
      existing.tracks.push(track);
      existing.copyCount = existing.tracks.length;
      return;
    }

    groups.set(id, {
      id,
      title,
      copyCount: 1,
      tracks: [track],
    });
  });

  return Array.from(groups.values()).sort((first, second) =>
    first.title.localeCompare(second.title)
  );
}

function downloadUrl(url: string, fileName: string) {
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadTracks(tracks: GroundworkTrackLike[]) {
  tracks.forEach((track, index) => {
    const url = getTrackAudioUrl(track);
    if (!url) return;

    window.setTimeout(() => {
      downloadUrl(url, slugifyDownloadName(getTrackTitle(track)));
    }, index * 300);
  });
}

export function LibraryTrackList({
  tracks,
  searchQuery,
  projectSearchQuery,
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
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [lastSentProject, setLastSentProject] =
    useState<LastSentProject | null>(null);

  const groupedTracks = useMemo(() => buildGroupedTracks(tracks), [tracks]);
  const hasSearchQuery = searchQuery.trim().length > 0;

  const filteredProjects = useMemo(() => {
    const cleanSearch = projectSearchQuery.trim().toLowerCase();

    if (!cleanSearch) return projects;

    return projects.filter((project) =>
      String(project.title ?? "").toLowerCase().includes(cleanSearch)
    );
  }, [projects, projectSearchQuery]);

  const visibleTrackIds = useMemo(() => {
    return tracks.map((track) => cleanId(track.id)).filter(Boolean);
  }, [tracks]);

  const selectedVisibleTrackIds = useMemo(() => {
    const visibleSet = new Set(visibleTrackIds);
    return selectedTrackIds.filter((trackId) => visibleSet.has(trackId));
  }, [selectedTrackIds, visibleTrackIds]);

  const selectedTracks = useMemo(() => {
    const selectedSet = new Set(selectedVisibleTrackIds);
    return tracks.filter((track) => selectedSet.has(cleanId(track.id)));
  }, [tracks, selectedVisibleTrackIds]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;

    return (
      projects.find((project) => cleanId(project.id) === selectedProjectId) ??
      null
    );
  }, [projects, selectedProjectId]);

  const downloadableSelectedTracks = useMemo(() => {
    return selectedTracks.filter((track) => getTrackAudioUrl(track));
  }, [selectedTracks]);

  const selectedCount = selectedVisibleTrackIds.length;
  const hasTracks = visibleTrackIds.length > 0;
  const allVisibleSelected =
    hasTracks && selectedCount === visibleTrackIds.length;
  const canSend =
    selectedCount > 0 && selectedProjectId.length > 0 && !sendingToProject;
  const canDownloadSelected = downloadableSelectedTracks.length > 0;

  function toggleTrackSelected(trackId: string) {
    const cleanTrackId = cleanId(trackId);
    if (!cleanTrackId) return;

    setSelectedTrackIds((currentIds) =>
      currentIds.includes(cleanTrackId)
        ? currentIds.filter((currentId) => currentId !== cleanTrackId)
        : [...currentIds, cleanTrackId]
    );
  }

  function getGroupTrackIds(group: GroupedLibraryTrack) {
    return group.tracks.map((track) => cleanId(track.id)).filter(Boolean);
  }

  function isGroupExpanded(groupId: string) {
    return !expandedGroupIds.includes(groupId);
  }

  function toggleGroupExpanded(groupId: string) {
    setExpandedGroupIds((currentIds) =>
      currentIds.includes(groupId)
        ? currentIds.filter((currentId) => currentId !== groupId)
        : [...currentIds, groupId]
    );
  }

  function toggleGroupSelected(group: GroupedLibraryTrack) {
    const groupTrackIds = getGroupTrackIds(group);
    const selectedSet = new Set(selectedTrackIds);
    const allSelected = groupTrackIds.every((trackId) =>
      selectedSet.has(trackId)
    );

    if (allSelected) {
      setSelectedTrackIds((currentIds) =>
        currentIds.filter((trackId) => !groupTrackIds.includes(trackId))
      );
      return;
    }

    setSelectedTrackIds((currentIds) =>
      Array.from(new Set([...currentIds, ...groupTrackIds]))
    );
  }

  function selectAllVisibleTracks() {
    setSelectedTrackIds(visibleTrackIds);
  }

  function clearSelectedTracks() {
    setSelectedTrackIds([]);
  }

  function openProject(projectId: string) {
    if (!projectId) return;
    window.location.href = `/workspace/projects/${projectId}`;
  }

  async function handleSendToProject() {
    const sentCount = selectedVisibleTrackIds.length;
    const projectId = selectedProjectId;
    const projectTitle = getProjectTitle(selectedProject);

    const ok = await onAddTracksToProject(projectId, selectedVisibleTrackIds);

    if (ok) {
      setLastSentProject({
        id: projectId,
        title: projectTitle,
        sentCount,
      });

      setSelectedTrackIds([]);
    }
  }

  function handleDownloadSelected() {
    downloadTracks(downloadableSelectedTracks);
  }

  return (
    <div className="space-y-3">
      <section id="library-transfer" className="sticky top-2 z-30 rounded-3xl border border-white/25 bg-black/95 p-4 text-white shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
              Library Actions
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Search title â†’ Select copies â†’ Choose project â†’ Send To
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              All songs are shown below. Search to narrow the list, then select
              grouped titles or individual song files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={toolbarButtonClass}
              onClick={
                allVisibleSelected ? clearSelectedTracks : selectAllVisibleTracks
              }
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
            Public song titles: {groupedTracks.length} Â·
            Selected copies: {selectedCount} Â· Downloadable:{" "}
            {downloadableSelectedTracks.length}
          </div>

          <select
            className={selectClass}
            value={selectedProjectId}
            onChange={(event) => {
              setSelectedProjectId(event.target.value);
              setLastSentProject(null);
            }}
            disabled={loadingProjects || filteredProjects.length === 0}
          >
            <option value="">
              {loadingProjects
                ? "Loading projects..."
                : filteredProjects.length === 0
                  ? "No matching projects"
                  : "Choose Project..."}
            </option>

            {filteredProjects.map((project) => {
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

        {selectedProject ? (
          <div className="mt-3 rounded-2xl border border-white/20 bg-black p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-black text-white">
                  Selected project: {getProjectTitle(selectedProject)}
                </div>
                <div className="mt-1 text-xs text-white/70">
                  Send selected copies here, then open the project to play or
                  arrange them.
                </div>
              </div>

              <button
                type="button"
                className={toolbarButtonClass}
                onClick={() => openProject(selectedProjectId)}
                disabled={!selectedProjectId}
              >
                Open Project
              </button>
            </div>
          </div>
        ) : null}

        {lastSentProject ? (
          <div className="mt-3 rounded-2xl border border-white/25 bg-black p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-black text-white">
                  Sent {lastSentProject.sentCount} track
                  {lastSentProject.sentCount === 1 ? "" : "s"} to{" "}
                  {lastSentProject.title}.
                </div>
                <div className="mt-1 text-xs text-white/70">
                  Next step: open the project and confirm the songs are attached.
                </div>
              </div>

              <button
                type="button"
                className={toolbarButtonClass}
                onClick={() => openProject(lastSentProject.id)}
              >
                Open Project
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-3 rounded-2xl border border-white/20 bg-black p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-black text-white">
                Selected Track Downloads
              </div>
              <div className="mt-1 text-xs text-white/70">
                Download Files and Download Folder both pull the selected Library
                audio files.
              </div>
            </div>

            <SharedDownloadButtons
              disabled={!canDownloadSelected}
              onDownloadFiles={handleDownloadSelected}
              onDownloadFolder={handleDownloadSelected}
            />
          </div>
        </div>

        {projectLinkMessage ? (
          <p className="mt-3 rounded-2xl border border-white/25 bg-black p-3 text-sm font-bold text-white/70">
            {projectLinkMessage}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-950/40 px-4 py-3 text-emerald-100">
        <h2 className="text-lg font-black">All Public Songs</h2>
        <span className="text-sm font-bold">
          {groupedTracks.length} title{groupedTracks.length === 1 ? "" : "s"} •{" "}
          {visibleTrackIds.length} song{visibleTrackIds.length === 1 ? "" : "s"}
        </span>
      </div>

      {groupedTracks.length === 0 ? (
        <div className="rounded-2xl border border-white/25 bg-black p-6 text-sm text-white/70">
          {hasSearchQuery
            ? "No tracks found for that search."
            : "No songs are available in the Library yet."}
        </div>
      ) : (
        groupedTracks.map((group) => {
          const groupTrackIds = getGroupTrackIds(group);
          const selectedSet = new Set(selectedTrackIds);
          const selectedInGroup = groupTrackIds.filter((trackId) =>
            selectedSet.has(trackId)
          ).length;
          const allGroupSelected =
            groupTrackIds.length > 0 &&
            selectedInGroup === groupTrackIds.length;
          const expanded = isGroupExpanded(group.id);

          return (
            <section
              key={group.id}
              className="rounded-3xl border border-white/25 bg-black p-4 text-white"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-3">
                  <label className="mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-black transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]">
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      onChange={() => toggleGroupSelected(group)}
                      className="h-4 w-4 accent-white"
                      aria-label={`Select all copies of ${group.title}`}
                    />
                  </label>

                  <div>
                    <h3 className="text-lg font-black text-white">
                      {group.title}{" "}
                      <span className="text-sm text-white/70">
                        ({group.copyCount}{" "}
                        {group.copyCount === 1 ? "copy" : "copies"})
                      </span>
                    </h3>

                    <p className="mt-1 text-xs font-bold text-white/70">
                      Selected copies: {selectedInGroup} /{" "}
                      {groupTrackIds.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={toolbarButtonClass}
                    onClick={() => toggleGroupSelected(group)}
                    disabled={groupTrackIds.length === 0}
                  >
                    {allGroupSelected ? "Clear Copies" : "Select All Copies"}
                  </button>

                  <button
                    type="button"
                    className={toolbarButtonClass}
                    onClick={() => toggleGroupExpanded(group.id)}
                  >
                    {expanded ? "Hide Copies" : "Show Copies"}
                  </button>
                </div>
              </div>

              {expanded ? (
                <div className="mt-4 space-y-3">
                  {group.tracks.map((track) => {
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
                </div>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
}