export type LibraryTrackVisibility = "public" | "private";

export type LibraryTrackAccess = {
  visibility: LibraryTrackVisibility;
  sharedWithMemberIds: string[];
};

export function normalizeLibraryTrackVisibility(
  value: unknown
): LibraryTrackVisibility {
  return String(value).trim().toLowerCase() === "private"
    ? "private"
    : "public";
}

export function normalizeSharedWithMemberIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export function buildLibraryTrackAccess(input?: {
  visibility?: unknown;
  sharedWithMemberIds?: unknown;
}): LibraryTrackAccess {
  return {
    visibility: normalizeLibraryTrackVisibility(input?.visibility),
    sharedWithMemberIds: normalizeSharedWithMemberIds(
      input?.sharedWithMemberIds
    ),
  };
}

export function isLibraryTrackPublic(access: LibraryTrackAccess): boolean {
  return access.visibility === "public";
}

export function isLibraryTrackPrivate(access: LibraryTrackAccess): boolean {
  return access.visibility === "private";
}