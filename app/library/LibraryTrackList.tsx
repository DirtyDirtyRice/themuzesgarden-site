"use client";

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

type Props = {
  tracks: GroundworkTrackLike[];
  editingTrackId: string | null;
  onSetEditingTrackId: (trackId: string | null) => void;
  onAddFilterTag: (tagId: string) => void;
  onAddTagToTrack: (trackId: string, tagId: string) => void;
  onRemoveTagFromTrack: (trackId: string, tagId: string) => void;
};

export function LibraryTrackList({
  tracks,
  editingTrackId,
  onSetEditingTrackId,
  onAddFilterTag,
  onAddTagToTrack,
  onRemoveTagFromTrack,
}: Props) {
  return (
    <div className="space-y-3">
      {tracks.map((track) => {
        const trackId = String(track.id ?? "");
        const isEditing = editingTrackId === trackId;

        return (
          <LibraryTrackCard
            key={trackId}
            track={track as any}
            isEditing={isEditing}
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
        <div
          className="rounded-2xl border border-white bg-black p-6 text-sm"
          style={{ color: "var(--text-normal)" }}
        >
          No tracks found in the Daddy Library yet.
        </div>
      )}
    </div>
  );
}