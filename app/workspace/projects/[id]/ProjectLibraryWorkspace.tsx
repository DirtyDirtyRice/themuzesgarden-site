"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectLibraryPanel from "./ProjectLibraryPanel";
import type {
  MetadataTargetType,
  MetadataEntry,
} from "../../../../lib/metadata/metadataTypes";
import { buildLibraryGroundworkTracks } from "../../../library/libraryTrackGroundwork";
import {
  buildMetadataFilter,
  trackMatchesAllFilters,
  type MetadataFilter,
} from "./command_control/libraryFilter";
import {
  normalizeWorkspaceTrack,
  type WorkspaceTrackLike,
} from "./command_control/libraryNormalize";
import ProjectWorkspaceUniversalPanels from "./command_control/ProjectWorkspaceUniversalPanels";
import { useProjectWorkspacePanelSystem } from "./command_control/useProjectWorkspacePanelSystem";

type Props = {
  allTracks: any[];
  linkedTracks: any[];
  linkedTrackIds: Set<string>;
  loadingLibrary: boolean;
  libraryErr: string | null;
  linkBusyId: string | null;
  nowPlayingId: string | null;
  previewTrackId: string | null;
  metadataTargetType: MetadataTargetType;
  metadataTargetId: string | null;
  onRefresh: () => void;
  onPlayTrackById: (tid: string) => void;
  onPreviewTrack: (tid: string) => void;
  onSelectTrackMetadataTarget: (tid: string) => void;
  onUnlinkTrack: (tid: string) => void;
  onLinkTrack: (tid: string) => void;
};

function normalizeVisibilityLabel(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isTrackPrivateFromNormalizedTrack(track: WorkspaceTrackLike): boolean {
  const visibilityLabel = normalizeVisibilityLabel(track.libraryVisibilityLabel);
  return visibilityLabel === "private";
}

function isTrackPrivateFromGroundworkTrack(
  track: Record<string, unknown>
): boolean {
  const directVisibility = normalizeVisibilityLabel(track["visibility"]);
  if (directVisibility === "private") return true;

  const libraryVisibility = normalizeVisibilityLabel(track["libraryVisibility"]);
  if (libraryVisibility === "private") return true;

  const libraryVisibilityLabel = normalizeVisibilityLabel(
    track["libraryVisibilityLabel"]
  );
  if (libraryVisibilityLabel === "private") return true;

  const libraryAccess = track["libraryAccess"];
  if (libraryAccess && typeof libraryAccess === "object") {
    const nestedVisibility = normalizeVisibilityLabel(
      (libraryAccess as Record<string, unknown>)["visibility"]
    );
    if (nestedVisibility === "private") return true;
  }

  return false;
}

export default function ProjectLibraryWorkspace(props: Props) {
  const {
    allTracks,
    linkedTracks,
    linkedTrackIds,
    loadingLibrary,
    libraryErr,
    linkBusyId,
    nowPlayingId,
    previewTrackId,
    metadataTargetType,
    metadataTargetId,
    onRefresh,
    onPlayTrackById,
    onPreviewTrack,
    onSelectTrackMetadataTarget,
    onUnlinkTrack,
    onLinkTrack,
  } = props;

  const [metadataFilters, setMetadataFilters] = useState<MetadataFilter[]>([]);
  const panelSystem = useProjectWorkspacePanelSystem();

  const manager = panelSystem.manager;
  const metadataBridge = panelSystem.metadataBridge;
  const syncMetadataSelection = panelSystem.syncMetadataSelection;
  const openMetadataInspect = panelSystem.openMetadataInspect;

  const groundedAllTracks = useMemo(() => {
    return buildLibraryGroundworkTracks(
      (Array.isArray(allTracks) ? allTracks : []) as Record<string, unknown>[]
    );
  }, [allTracks]);

  const groundedLinkedTracks: WorkspaceTrackLike[] = useMemo(() => {
    return buildLibraryGroundworkTracks(
      (Array.isArray(linkedTracks) ? linkedTracks : []) as Record<
        string,
        unknown
      >[]
    ).map((track) => normalizeWorkspaceTrack(track));
  }, [linkedTracks]);

  const filteredAllTracks = useMemo(() => {
    return groundedAllTracks
      .map((track) => {
        const normalizedTrack = normalizeWorkspaceTrack(track);
        const isPrivate =
          isTrackPrivateFromNormalizedTrack(normalizedTrack) ||
          isTrackPrivateFromGroundworkTrack(
            track as Record<string, unknown>
          );

        return {
          normalizedTrack,
          isPrivate,
        };
      })
      .filter(({ normalizedTrack, isPrivate }) => {
        if (isPrivate) return false;

        return trackMatchesAllFilters(normalizedTrack, metadataFilters);
      })
      .map(({ normalizedTrack }) => normalizedTrack);
  }, [groundedAllTracks, metadataFilters]);

  const selectedMetadataTrack = useMemo(() => {
    if (metadataTargetType !== "track" || !metadataTargetId) return null;

    return (
      groundedLinkedTracks.find(
        (track) => String(track.id) === String(metadataTargetId)
      ) ?? null
    );
  }, [groundedLinkedTracks, metadataTargetId, metadataTargetType]);

  const handleMetadataSelect = useCallback((entry: MetadataEntry) => {
    const nextFilter = buildMetadataFilter(entry);

    if (!nextFilter.id || !nextFilter.query) return;

    setMetadataFilters((current) => {
      const alreadySelected = current.some(
        (item) => item.id === nextFilter.id
      );

      if (alreadySelected) {
        return current.filter((item) => item.id !== nextFilter.id);
      }

      return [...current, nextFilter];
    });
  }, []);

  useEffect(() => {
    if (metadataTargetType === "track" && metadataTargetId) {
      syncMetadataSelection(
        "track",
        metadataTargetId,
        selectedMetadataTrack?.title
          ? `Track — ${selectedMetadataTrack.title}`
          : `Track — ${metadataTargetId}`
      );
      return;
    }

    syncMetadataSelection(null, null);
  }, [
    metadataTargetId,
    metadataTargetType,
    selectedMetadataTrack?.title,
    syncMetadataSelection,
  ]);

  const removeMetadataFilter = useCallback((id: string) => {
    setMetadataFilters((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearMetadataFilters = useCallback(() => {
    setMetadataFilters([]);
  }, []);

  const handleInspectTrack = useCallback(
    (tid: string) => {
      const track = groundedLinkedTracks.find(
        (item) => String(item.id) === String(tid)
      );

      onPreviewTrack(tid);
      onSelectTrackMetadataTarget(tid);

      openMetadataInspect({
        targetType: "track",
        targetId: tid,
        targetLabel: track?.title ? `Track — ${track.title}` : `Track — ${tid}`,
        focus: true,
      });

      const instanceId = metadataBridge.instanceId;
      const existing = manager.getPanel(instanceId);

      if (!existing) return;

      const existingMetadata = existing.metadata as
        | Record<string, unknown>
        | undefined;

      if (!existingMetadata?.["onMetadataSelect"]) {
        manager.patchPanel(instanceId, {
          metadata: {
            ...(existing.metadata ?? {}),
            onMetadataSelect: handleMetadataSelect,
          },
        });
      }
    },
    [
      groundedLinkedTracks,
      handleMetadataSelect,
      manager,
      metadataBridge.instanceId,
      onPreviewTrack,
      onSelectTrackMetadataTarget,
      openMetadataInspect,
    ]
  );

  return (
    <div className="relative">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium">Project Library</div>
          <button
            className="rounded border px-3 py-2 text-sm transition hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-60"
            onClick={onRefresh}
            disabled={loadingLibrary}
          >
            {loadingLibrary ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {metadataFilters.length > 0 ? (
          <div className="rounded border bg-yellow-50 p-2 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span>Active metadata filters</span>
              <button
                className="underline transition hover:text-black active:scale-[0.98]"
                onClick={clearMetadataFilters}
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {metadataFilters.map((filter) => (
                <button
                  key={filter.id}
                  className="rounded-full border bg-white px-2 py-1 text-[11px] transition hover:bg-zinc-50 active:scale-[0.98]"
                  onClick={() => removeMetadataFilter(filter.id)}
                  title={filter.query}
                >
                  {filter.label} ×
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {libraryErr ? (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {libraryErr}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Linked Tracks</div>
              <div className="text-xs text-zinc-500">
                Linked: {groundedLinkedTracks.length}
              </div>
            </div>

            {groundedLinkedTracks.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No tracks linked yet. Use the Library list to link.
              </div>
            ) : (
              <div className="space-y-2">
                {groundedLinkedTracks.map((track) => {
                  const tid = String(track.id);
                  const isNow = nowPlayingId === tid;
                  const isPreview = previewTrackId === tid;
                  const isMetadataSelected =
                    metadataTargetType === "track" &&
                    metadataTargetId === tid;

                  const sourceLabel = String(
                    track.librarySourceLabel ?? "Library"
                  );
                  const visibilityLabel = String(
                    track.libraryVisibilityLabel ?? "Public"
                  );

                  return (
                    <div
                      key={tid}
                      className={`rounded border p-3 flex items-center justify-between gap-3 cursor-pointer ${
                        isPreview ? "bg-zinc-50 border-black" : "bg-white"
                      }`}
                      onClick={() => onPreviewTrack(tid)}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {isNow ? "▶ " : ""}
                          {isNow ? (
                            <span className="mr-2 rounded bg-black px-2 py-0.5 text-[10px] text-white">
                              NOW
                            </span>
                          ) : null}
                          {track.title ?? "Untitled"}
                        </div>

                        {track.artist ? (
                          <div className="text-xs text-zinc-500 truncate">
                            {track.artist}
                          </div>
                        ) : null}

                        <div className="mt-1 text-[10px] text-zinc-400">
                          Source: {sourceLabel} • Visibility: {visibilityLabel}
                        </div>

                        {isMetadataSelected ? (
                          <div className="mt-1 text-[11px] text-zinc-500">
                            Selected for metadata
                          </div>
                        ) : null}
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          className="rounded border px-3 py-2 text-xs transition hover:bg-zinc-50 active:scale-[0.98]"
                          onClick={() => onPlayTrackById(tid)}
                        >
                          Play
                        </button>

                        <button
                          className="rounded border px-3 py-2 text-xs transition hover:bg-zinc-50 active:scale-[0.98]"
                          onClick={() => handleInspectTrack(tid)}
                        >
                          Inspect
                        </button>

                        <button
                          className="rounded border px-3 py-2 text-xs transition hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-60"
                          onClick={() => onUnlinkTrack(tid)}
                          disabled={linkBusyId === tid}
                        >
                          {linkBusyId === tid ? "..." : "Unlink"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <ProjectLibraryPanel
            allTracks={filteredAllTracks as any[]}
            linkedTrackIds={linkedTrackIds}
            loadingLibrary={loadingLibrary}
            linkBusyId={linkBusyId}
            linkTrack={onLinkTrack}
            unlinkTrack={onUnlinkTrack}
            onPlayTrackById={onPlayTrackById}
          />
        </div>

        <div className="rounded-lg border p-4 space-y-1">
          <div className="font-medium text-sm">Safe architecture</div>
          <div className="text-sm text-zinc-600">
            This uses <code className="px-1">project_tracks</code> as a join
            table. Library stays global and unchanged.
          </div>
          <div className="text-sm text-zinc-600">
            Metadata inspect now runs through the universal panel system.
          </div>
        </div>
      </div>

      <ProjectWorkspaceUniversalPanels panelSystem={panelSystem} />
    </div>
  );
}