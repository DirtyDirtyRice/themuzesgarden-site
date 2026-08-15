export type LibraryTrackVisibility = "public" | "private";

export type LibraryTrackAccess = {
  visibility: LibraryTrackVisibility;
  sharedWithMemberIds: string[];
};

export function normalizeLibraryTrackVisibility(
  value: unknown
): LibraryTrackVisibility {
  return String(value).trim().toLowerCase() === "public"
    ? "public"
    : "private";
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

export function canViewLibraryTrack(
  track: {
    libraryAccess?: LibraryTrackAccess;
    visibility?: unknown;
    sharedWithMemberIds?: unknown;
    ownerId?: unknown;
    owner_id?: unknown;
  },
  memberId: string | null,
) {
  const access = track.libraryAccess ?? buildLibraryTrackAccess(track);
  if (isLibraryTrackPublic(access)) return true;
  const cleanMemberId = String(memberId ?? "").trim();
  if (!cleanMemberId) return false;
  const ownerId = String(track.ownerId ?? track.owner_id ?? "").trim();
  return ownerId === cleanMemberId || access.sharedWithMemberIds.includes(cleanMemberId);
}
