export type WorkspaceTrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
  visibility?: "private" | "shared" | "public" | string | null;
  librarySourceLabel?: string;
  libraryVisibilityLabel?: string;
  tags?: string[];
};

export function normalizeWorkspaceTrack(input: any): WorkspaceTrackLike {
  return {
    id: String(input?.id ?? ""),
    title:
      input?.title == null || input?.title === ""
        ? "Untitled"
        : String(input.title),
    artist:
      input?.artist == null || input?.artist === ""
        ? null
        : String(input.artist),
    visibility:
      input?.visibility == null ? null : String(input.visibility),
    librarySourceLabel:
      input?.librarySourceLabel == null
        ? undefined
        : String(input.librarySourceLabel),
    libraryVisibilityLabel:
      input?.libraryVisibilityLabel == null
        ? undefined
        : String(input.libraryVisibilityLabel),
    tags: Array.isArray(input?.tags)
      ? input.tags.map((t: any) => String(t))
      : [],
  };
}