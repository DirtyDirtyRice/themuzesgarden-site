"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMetadataByTarget } from "@/lib/metadata/metadataApi";
import NestedTagPicker from "./NestedTagPicker";
import type { TrackLike } from "./libraryTypes";
import { displayTagLabel } from "./libraryUtils";

function getTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function getCleanText(value: unknown): string {
  return String(value ?? "").trim();
}

type GroundworkTrackLike = TrackLike & {
  librarySourceLabel?: string;
  libraryVisibilityLabel?: string;
  sourceProjectTitle?: string | null;
  description?: string | null;
};

type MetadataItemPreview = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  track: GroundworkTrackLike;
  isEditing: boolean;
  isSelected: boolean;
  onToggleSelected: () => void;
  onSetEditing: () => void;
  onAddFilterTag: (tagId: string) => void;
  onAddTagToTrack: (trackId: string, tagId: string) => void;
  onRemoveTagFromTrack: (trackId: string, tagId: string) => void;
};

const actionButtonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const smallButtonClass =
  "rounded-xl border border-white/25 bg-black px-2 py-1 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const panelClass = "mt-4 rounded-2xl border border-white/25 bg-black p-3";

export function LibraryTrackCard({
  track,
  isEditing,
  isSelected,
  onToggleSelected,
  onSetEditing,
  onAddFilterTag,
  onAddTagToTrack,
  onRemoveTagFromTrack,
}: Props) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const trackId = String(track.id ?? "");
  const trackTitle = String(track.title ?? "Untitled track");
  const trackArtist = String(track.artist ?? "");
  const trackSourceProjectTitle = track.sourceProjectTitle
    ? String(track.sourceProjectTitle)
    : "";
  const trackDescription = getCleanText(
    (track as Record<string, unknown>).description
  );

  const tagIds = getTagIds(track.tags);

  const [showMetadata, setShowMetadata] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    if ((showMetadata || showTags || showDescription) && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showMetadata, showTags, showDescription]);

  const metadataItems = useMemo<MetadataItemPreview[]>(() => {
    const raw = getMetadataByTarget("track", trackId);

    if (!Array.isArray(raw)) return [];

    return raw
      .map((item, index) => {
        const record =
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {};

        const id = getCleanText(record.id) || `${trackId}-${index}`;
        const label =
          getCleanText(record.label) ||
          getCleanText(record.value) ||
          getCleanText(record.kind) ||
          "Untitled";
        const description = getCleanText(record.description);

        return {
          id,
          label,
          description,
        };
      })
      .filter((item) => item.label);
  }, [trackId]);

  function handleOpenMetadataPage() {
    const safeId = encodeURIComponent(trackId);
    router.push(`/metadata/${safeId}?attachTrackId=${safeId}`);
  }

  function handleOpenLyricsPage() {
    const safeId = encodeURIComponent(trackId);
    const safeTitle = encodeURIComponent(trackTitle);
    const safeArtist = encodeURIComponent(trackArtist);

    router.push(
      `/library/lyrics?trackId=${safeId}&trackTitle=${safeTitle}&trackArtist=${safeArtist}`
    );
  }

  return (
    <div
      ref={cardRef}
      className={[
        "rounded-2xl border bg-black p-4 text-white transition-all duration-200",
        isSelected ? "border-white ring-2 ring-white/25" : "border-white/25",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <label className="mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-black transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelected}
              className="h-4 w-4 accent-white"
              aria-label={`Select ${trackTitle}`}
            />
          </label>

          <div className="min-w-0">
            <div className="font-bold text-white">{trackTitle}</div>

            <div className="text-sm text-white/70">{trackArtist}</div>

            <div className="mt-1 text-xs text-white/70">
              Source: {track.librarySourceLabel}
              {" • "}
              Visibility: {track.libraryVisibilityLabel}
              {trackSourceProjectTitle
                ? ` • Project: ${trackSourceProjectTitle}`
                : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleOpenLyricsPage}
            className={actionButtonClass}
          >
            Lyrics
          </button>

          <button
            type="button"
            aria-expanded={showMetadata}
            onClick={() => setShowMetadata((value) => !value)}
            className={actionButtonClass}
          >
            Metadata
          </button>

          <button
            type="button"
            aria-expanded={showTags}
            onClick={() => setShowTags((value) => !value)}
            className={actionButtonClass}
          >
            Tags
          </button>

          <button
            type="button"
            aria-expanded={showDescription}
            onClick={() => setShowDescription((value) => !value)}
            className={actionButtonClass}
          >
            Description
          </button>
        </div>
      </div>

      {showMetadata && (
        <div className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-white">Metadata</div>

            <button
              type="button"
              onClick={handleOpenMetadataPage}
              className={smallButtonClass}
            >
              Open full metadata
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {metadataItems.length === 0 ? (
              <div className="text-xs text-white/70">No metadata found.</div>
            ) : (
              metadataItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/25 bg-black p-2"
                >
                  <div className="text-sm font-bold text-white">
                    {item.label}
                  </div>

                  {item.description ? (
                    <div className="mt-1 text-xs text-white/70">
                      {item.description}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showTags && (
        <div className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-white">Tags</div>

            <button
              type="button"
              onClick={onSetEditing}
              className={smallButtonClass}
            >
              {isEditing ? "Done" : "Edit tags"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tagIds.length === 0 ? (
              <span className="text-xs text-white/70">No tags yet.</span>
            ) : (
              tagIds.map((tagId) => (
                <div key={`${trackId}-${tagId}`} className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onAddFilterTag(tagId)}
                    className={smallButtonClass}
                  >
                    {displayTagLabel(tagId)}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveTagFromTrack(trackId, tagId)}
                    className={smallButtonClass}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {isEditing && (
            <div className="mt-3">
              <NestedTagPicker
                title="Add tag"
                onPickTagId={(tagId) => onAddTagToTrack(trackId, tagId)}
                excludeTagIds={tagIds}
              />
            </div>
          )}
        </div>
      )}

      {showDescription && (
        <div className={panelClass}>
          <div className="text-sm font-bold text-white">Description</div>

          <div className="mt-2 text-sm text-white/70">
            {trackDescription || "No description yet."}
          </div>
        </div>
      )}
    </div>
  );
}