import type { MetadataEntry, MetadataLink } from "./metadataTypes";

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function buildMetadataFromTracks(tracks: Array<Record<string, unknown>>): {
  entries: MetadataEntry[];
  links: MetadataLink[];
} {
  const entries: MetadataEntry[] = [];
  const links: MetadataLink[] = [];

  const seenEntryIds = new Set<string>();
  const seenLinkIds = new Set<string>();
  const now = new Date().toISOString();

  for (const track of tracks) {
    const rawId = String(track.id ?? "").trim();
    if (!rawId) continue;

    const trackEntryId = `track-${rawId}`;
    const title = String(track.title ?? "Untitled track").trim() || "Untitled track";
    const artist = String(track.artist ?? "").trim();
    const sourceProjectTitle = String(track.sourceProjectTitle ?? "").trim();
    const librarySourceLabel = String(track.librarySourceLabel ?? "").trim();
    const libraryVisibilityLabel = String(track.libraryVisibilityLabel ?? "").trim();

    const rawTags = Array.isArray(track.tags) ? track.tags : [];
    const tags = uniqueStrings(rawTags);

    const searchableTags = uniqueStrings([
      ...tags,
      title,
      artist,
      sourceProjectTitle,
      librarySourceLabel,
      libraryVisibilityLabel,
      rawId,
      "track",
      "library",
      "supabase",
    ]);

    if (!seenEntryIds.has(trackEntryId)) {
      entries.push({
        id: trackEntryId,
        targetType: "track",
        targetId: rawId,
        kind: "description",
        label: title,
        value: artist,
        description: sourceProjectTitle
          ? `Track from project ${sourceProjectTitle}`
          : "Track from library",
        parentId: undefined,
        createdAt: now,
        updatedAt: undefined,
        createdBy: "metadata-library-bridge",
        tags: searchableTags,
      });

      seenEntryIds.add(trackEntryId);
    }

    for (const tag of tags) {
      const cleanTag = String(tag ?? "").trim();
      if (!cleanTag) continue;

      const tagKey = normalizeKey(cleanTag);
      if (!tagKey) continue;

      const tagEntryId = `tag-${tagKey}`;

      if (!seenEntryIds.has(tagEntryId)) {
        entries.push({
          id: tagEntryId,
          targetType: "tag",
          targetId: tagKey,
          kind: "tag",
          label: cleanTag,
          value: "",
          description: `Library tag: ${cleanTag}`,
          parentId: undefined,
          createdAt: now,
          updatedAt: undefined,
          createdBy: "metadata-library-bridge",
          tags: uniqueStrings([cleanTag, tagKey, "tag", "library"]),
        });

        seenEntryIds.add(tagEntryId);
      }

      const linkId = `track-tag-${rawId}-${tagKey}`;

      if (!seenLinkIds.has(linkId)) {
        links.push({
          id: linkId,
          sourceId: trackEntryId,
          targetId: tagEntryId,
          relationship: "related",
          createdAt: now,
        });

        seenLinkIds.add(linkId);
      }
    }
  }

  return { entries, links };
}