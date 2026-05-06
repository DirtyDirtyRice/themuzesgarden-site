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
  onSetEditing: () => void;
  onAddFilterTag: (tagId: string) => void;
  onAddTagToTrack: (trackId: string, tagId: string) => void;
  onRemoveTagFromTrack: (trackId: string, tagId: string) => void;
};

export function LibraryTrackCard({
  track,
  isEditing,
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

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-white bg-black p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{trackTitle}</div>

          <div className="text-sm text-white/70">{trackArtist}</div>

          <div className="mt-1 text-xs text-white/60">
            Source: {track.librarySourceLabel}
            {" • "}
            Visibility: {track.libraryVisibilityLabel}
            {trackSourceProjectTitle
              ? ` • Project: ${trackSourceProjectTitle}`
              : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={showMetadata}
            onClick={() => setShowMetadata((value) => !value)}
            className="rounded-lg border border-white px-2.5 py-1.5 text-xs text-white"
          >
            Metadata
          </button>

          <button
            type="button"
            aria-expanded={showTags}
            onClick={() => setShowTags((value) => !value)}
            className="rounded-lg border border-white px-2.5 py-1.5 text-xs text-white"
          >
            Tags
          </button>

          <button
            type="button"
            aria-expanded={showDescription}
            onClick={() => setShowDescription((value) => !value)}
            className="rounded-lg border border-white px-2.5 py-1.5 text-xs text-white"
          >
            Description
          </button>
        </div>
      </div>

      {showMetadata && (
        <div className="mt-4 rounded-xl border border-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Metadata</div>

            <button
              type="button"
              onClick={handleOpenMetadataPage}
              className="rounded border border-white px-2 py-1 text-xs text-white"
            >
              Open full metadata
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {metadataItems.length === 0 ? (
              <div className="text-xs text-white/60">No metadata found.</div>
            ) : (
              metadataItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-white p-2"
                >
                  <div className="text-sm font-semibold text-white">
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
        <div className="mt-4 rounded-xl border border-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Tags</div>

            <button
              type="button"
              onClick={onSetEditing}
              className="rounded border border-white px-2 py-1 text-xs text-white"
            >
              {isEditing ? "Done" : "Edit tags"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tagIds.length === 0 ? (
              <span className="text-xs text-white/60">No tags yet.</span>
            ) : (
              tagIds.map((tagId) => (
                <div key={`${trackId}-${tagId}`} className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onAddFilterTag(tagId)}
                    className="rounded-full border border-white px-2 py-1 text-xs text-white"
                  >
                    {displayTagLabel(tagId)}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveTagFromTrack(trackId, tagId)}
                    className="rounded-full border border-white px-2 py-1 text-xs text-white"
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
        <div className="mt-4 rounded-xl border border-white p-3">
          <div className="text-sm font-semibold text-white">Description</div>

          <div className="mt-2 text-sm text-white/70">
            {trackDescription || "No description yet."}
          </div>
        </div>
      )}
    </div>
  );
}