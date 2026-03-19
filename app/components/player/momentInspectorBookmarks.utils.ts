import type {
  MomentInspectorBookmarkOption,
  MomentInspectorBookmarkRecord,
  MomentInspectorBookmarkSnapshot,
  MomentInspectorCreateBookmarkInput,
} from "./momentInspectorBookmarks.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeStringArray(values: unknown[]): string[] {
  const seen = new Set<string>();
  const rows: string[] = [];

  for (const value of values) {
    const clean = normalizeText(value);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    rows.push(clean);
  }

  return rows;
}

export function createBookmarkId(): string {
  return `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeBookmarkSnapshot(
  snapshot: Partial<MomentInspectorBookmarkSnapshot> | null | undefined
): MomentInspectorBookmarkSnapshot {
  const selectedVerdict = normalizeText(snapshot?.selectedVerdict);

  return {
    selectedTrackId: normalizeText(snapshot?.selectedTrackId),
    selectedPhraseFamilyId: normalizeText(snapshot?.selectedPhraseFamilyId),
    selectedVerdict:
      selectedVerdict === "stable" ||
      selectedVerdict === "watch" ||
      selectedVerdict === "repair" ||
      selectedVerdict === "blocked"
        ? selectedVerdict
        : "all",
    pinnedFamilyIds: normalizeStringArray(
      Array.isArray(snapshot?.pinnedFamilyIds) ? snapshot!.pinnedFamilyIds : []
    ),
    pinnedOnly: Boolean(snapshot?.pinnedOnly),
    comparePrimaryFamilyId: normalizeText(snapshot?.comparePrimaryFamilyId),
    compareSecondaryFamilyId: normalizeText(snapshot?.compareSecondaryFamilyId),
  };
}

export function normalizeBookmarkLabel(value: unknown): string {
  const clean = normalizeText(value);
  return clean || "Saved view";
}

export function createBookmarkRecord(
  input: MomentInspectorCreateBookmarkInput
): MomentInspectorBookmarkRecord {
  const now = new Date().toISOString();

  return {
    id: createBookmarkId(),
    label: normalizeBookmarkLabel(input.label),
    createdAt: now,
    updatedAt: now,
    snapshot: normalizeBookmarkSnapshot(input.snapshot),
  };
}

export function updateBookmarkRecord(
  record: MomentInspectorBookmarkRecord,
  updates: Partial<Pick<MomentInspectorBookmarkRecord, "label" | "snapshot">>
): MomentInspectorBookmarkRecord {
  return {
    ...record,
    label:
      updates.label !== undefined
        ? normalizeBookmarkLabel(updates.label)
        : record.label,
    snapshot:
      updates.snapshot !== undefined
        ? normalizeBookmarkSnapshot(updates.snapshot)
        : record.snapshot,
    updatedAt: new Date().toISOString(),
  };
}

export function buildBookmarkSubtitle(
  snapshot: MomentInspectorBookmarkSnapshot
): string {
  const parts: string[] = [];

  if (snapshot.selectedTrackId) {
    parts.push(`Track ${snapshot.selectedTrackId}`);
  }

  if (snapshot.selectedPhraseFamilyId) {
    parts.push(`Family ${snapshot.selectedPhraseFamilyId}`);
  }

  if (snapshot.selectedVerdict !== "all") {
    parts.push(`Verdict ${snapshot.selectedVerdict}`);
  }

  if (snapshot.pinnedOnly) {
    parts.push("Pinned only");
  }

  if (
    snapshot.comparePrimaryFamilyId &&
    snapshot.compareSecondaryFamilyId
  ) {
    parts.push(
      `Compare ${snapshot.comparePrimaryFamilyId} vs ${snapshot.compareSecondaryFamilyId}`
    );
  }

  return parts.join(" · ") || "Saved inspector view";
}

export function buildBookmarkOptions(
  bookmarks: MomentInspectorBookmarkRecord[]
): MomentInspectorBookmarkOption[] {
  return bookmarks.map((bookmark) => ({
    id: bookmark.id,
    label: bookmark.label,
    subtitle: buildBookmarkSubtitle(bookmark.snapshot),
  }));
}