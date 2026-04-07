"use client";

import MetadataPanel from "../../../../player/MetadataPanel";
import ProjectLibraryPanel from "./ProjectLibraryPanel";
import type { MetadataTargetType } from "./projectDetailsTypes";

type TrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">Project Library</div>
        <button
          className="rounded border px-3 py-2 text-sm disabled:opacity-60"
          onClick={onRefresh}
          disabled={loadingLibrary}
        >
          {loadingLibrary ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {libraryErr ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {libraryErr}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Linked Tracks</div>
            <div className="text-xs text-zinc-500">Linked: {linkedTrackIds.size}</div>
          </div>

          {linkedTracks.length === 0 ? (
            <div className="text-sm text-zinc-600">
              No tracks linked yet. Use the Library list to link.
            </div>
          ) : (
            <div className="space-y-2">
              {linkedTracks.map((t: TrackLike) => {
                const tid = String(t.id);
                const isNow = nowPlayingId === tid;
                const isPreview = previewTrackId === tid;
                const isMetadataSelected =
                  metadataTargetType === "track" && metadataTargetId === tid;

                return (
                  <div
                    key={tid}
                    className={`rounded border p-3 flex items-center justify-between gap-3 cursor-pointer ${
                      isPreview ? "bg-zinc-50 border-black" : "bg-white"
                    }`}
                    onClick={() => {
                      onPreviewTrack(tid);
                      onSelectTrackMetadataTarget(tid);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {isNow ? "▶ " : ""}
                        {isNow && (
                          <span className="mr-2 rounded bg-black px-2 py-0.5 text-[10px] text-white">
                            NOW
                          </span>
                        )}
                        {t.title ?? "Untitled"}
                      </div>

                      {t.artist ? (
                        <div className="text-xs text-zinc-500 truncate">{t.artist}</div>
                      ) : null}

                      {isMetadataSelected ? (
                        <div className="mt-1 text-[11px] text-zinc-500">
                          Selected for metadata
                        </div>
                      ) : null}

                      {isMetadataSelected ? (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <MetadataPanel
                            targetType={metadataTargetType}
                            targetId={metadataTargetId ?? tid}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="rounded border px-3 py-2 text-xs"
                        onClick={() => onPlayTrackById(tid)}
                      >
                        Play
                      </button>

                      <button
                        className="rounded border px-3 py-2 text-xs"
                        onClick={() => {
                          onPreviewTrack(tid);
                          onSelectTrackMetadataTarget(tid);
                        }}
                      >
                        Inspect
                      </button>

                      <button
                        className="rounded border px-3 py-2 text-xs disabled:opacity-60"
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
          allTracks={allTracks as any[]}
          linkedTrackIds={linkedTrackIds}
          loadingLibrary={loadingLibrary}
          linkBusyId={linkBusyId}
          linkTrack={onLinkTrack}
          unlinkTrack={onUnlinkTrack}
          playTrack={(track: any) => {
            const tid = String(track?.id ?? "");
            if (!tid) return;
            onPlayTrackById(tid);
          }}
        />
      </div>

      <div className="rounded-lg border p-4 space-y-1">
        <div className="font-medium text-sm">Safe architecture</div>
        <div className="text-sm text-zinc-600">
          This uses <code className="px-1">project_tracks</code> as a join table. Library stays
          global and unchanged.
        </div>
      </div>
    </div>
  );
}