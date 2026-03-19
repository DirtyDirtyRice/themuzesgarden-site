export type MetadataObjectType =
  | "lyric-word"
  | "instrument"
  | "note"
  | "chord"
  | "modulation"
  | "sound-moment"
  | "track-section"
  | "tag";

export type MetadataEntry = {
  id: string;
  objectType: MetadataObjectType;
  objectKey: string;
  label: string;

  meaning?: string;
  pronunciation?: string;
  vocalTone?: string;
  emotionalTone?: string;
  instrumentCharacter?: string;
  harmonicFunction?: string;
  musicalIntent?: string;
  playbackBehavior?: string;

  tags: string[];

  createdAt: number;
  updatedAt: number;
};

export type MetadataRegistry = {
  entries: Map<string, MetadataEntry>;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeKeyPart(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean))
  );
}

function buildRegistryMap(
  entries?: Iterable<[string, MetadataEntry]> | null
): Map<string, MetadataEntry> {
  return new Map(entries ?? []);
}

export function createMetadataRegistry(
  entries?: Iterable<[string, MetadataEntry]> | null
): MetadataRegistry {
  return {
    entries: buildRegistryMap(entries),
  };
}

export function buildMetadataRegistryKey(
  objectType: MetadataObjectType,
  objectKey: string
): string {
  const cleanType = normalizeKeyPart(objectType);
  const cleanObjectKey = normalizeKeyPart(objectKey);

  return `${cleanType}::${cleanObjectKey}`;
}

export function createMetadataEntry(args: {
  objectType: MetadataObjectType;
  objectKey: string;
  label: string;
  meaning?: string;
  pronunciation?: string;
  vocalTone?: string;
  emotionalTone?: string;
  instrumentCharacter?: string;
  harmonicFunction?: string;
  musicalIntent?: string;
  playbackBehavior?: string;
  tags?: string[];
  now?: number;
}): MetadataEntry {
  const now = Number.isFinite(args.now) ? Number(args.now) : Date.now();
  const cleanObjectKey = normalizeText(args.objectKey);
  const cleanLabel = normalizeText(args.label);

  return {
    id: buildMetadataRegistryKey(args.objectType, cleanObjectKey),
    objectType: args.objectType,
    objectKey: cleanObjectKey,
    label: cleanLabel || cleanObjectKey || "Metadata Entry",
    meaning: normalizeText(args.meaning) || undefined,
    pronunciation: normalizeText(args.pronunciation) || undefined,
    vocalTone: normalizeText(args.vocalTone) || undefined,
    emotionalTone: normalizeText(args.emotionalTone) || undefined,
    instrumentCharacter: normalizeText(args.instrumentCharacter) || undefined,
    harmonicFunction: normalizeText(args.harmonicFunction) || undefined,
    musicalIntent: normalizeText(args.musicalIntent) || undefined,
    playbackBehavior: normalizeText(args.playbackBehavior) || undefined,
    tags: uniqStrings(args.tags ?? []),
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertMetadataEntry(
  registry: MetadataRegistry,
  entry: MetadataEntry
): MetadataRegistry {
  const next = createMetadataRegistry(registry.entries);
  const key = buildMetadataRegistryKey(entry.objectType, entry.objectKey);
  const existing = next.entries.get(key) ?? null;

  next.entries.set(key, {
    ...entry,
    id: key,
    createdAt: existing?.createdAt ?? entry.createdAt ?? Date.now(),
    updatedAt: entry.updatedAt ?? Date.now(),
    tags: uniqStrings(entry.tags ?? []),
  });

  return next;
}

export function setMetadataEntry(
  registry: MetadataRegistry,
  args: {
    objectType: MetadataObjectType;
    objectKey: string;
    label: string;
    meaning?: string;
    pronunciation?: string;
    vocalTone?: string;
    emotionalTone?: string;
    instrumentCharacter?: string;
    harmonicFunction?: string;
    musicalIntent?: string;
    playbackBehavior?: string;
    tags?: string[];
    now?: number;
  }
): MetadataRegistry {
  const key = buildMetadataRegistryKey(args.objectType, args.objectKey);
  const existing = registry.entries.get(key) ?? null;
  const now = Number.isFinite(args.now) ? Number(args.now) : Date.now();

  const entry: MetadataEntry = {
    id: key,
    objectType: args.objectType,
    objectKey: normalizeText(args.objectKey),
    label: normalizeText(args.label) || normalizeText(args.objectKey) || "Metadata Entry",
    meaning: normalizeText(args.meaning) || existing?.meaning,
    pronunciation: normalizeText(args.pronunciation) || existing?.pronunciation,
    vocalTone: normalizeText(args.vocalTone) || existing?.vocalTone,
    emotionalTone: normalizeText(args.emotionalTone) || existing?.emotionalTone,
    instrumentCharacter:
      normalizeText(args.instrumentCharacter) || existing?.instrumentCharacter,
    harmonicFunction: normalizeText(args.harmonicFunction) || existing?.harmonicFunction,
    musicalIntent: normalizeText(args.musicalIntent) || existing?.musicalIntent,
    playbackBehavior: normalizeText(args.playbackBehavior) || existing?.playbackBehavior,
    tags: uniqStrings([...(existing?.tags ?? []), ...(args.tags ?? [])]),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return upsertMetadataEntry(registry, entry);
}

export function getMetadataEntry(
  registry: MetadataRegistry,
  objectType: MetadataObjectType,
  objectKey: string
): MetadataEntry | null {
  const key = buildMetadataRegistryKey(objectType, objectKey);
  return registry.entries.get(key) ?? null;
}

export function getAllMetadataEntries(registry: MetadataRegistry): MetadataEntry[] {
  return Array.from(registry.entries.values()).sort((a, b) => {
    const byType = String(a.objectType).localeCompare(String(b.objectType), undefined, {
      sensitivity: "base",
    });
    if (byType !== 0) return byType;

    return String(a.label).localeCompare(String(b.label), undefined, {
      sensitivity: "base",
    });
  });
}

export function getMetadataEntriesByType(
  registry: MetadataRegistry,
  objectType: MetadataObjectType
): MetadataEntry[] {
  return getAllMetadataEntries(registry).filter(
    (entry) => entry.objectType === objectType
  );
}

export function findMetadataEntriesByTag(
  registry: MetadataRegistry,
  tag: string
): MetadataEntry[] {
  const cleanTag = normalizeKeyPart(tag);
  if (!cleanTag) return [];

  return getAllMetadataEntries(registry).filter((entry) =>
    (entry.tags ?? []).some((value) => normalizeKeyPart(value) === cleanTag)
  );
}

export function removeMetadataEntry(
  registry: MetadataRegistry,
  objectType: MetadataObjectType,
  objectKey: string
): MetadataRegistry {
  const key = buildMetadataRegistryKey(objectType, objectKey);
  const next = createMetadataRegistry(registry.entries);
  next.entries.delete(key);
  return next;
}

export function getMetadataRegistrySummary(registry: MetadataRegistry): {
  total: number;
  lyricWordCount: number;
  instrumentCount: number;
  noteCount: number;
  chordCount: number;
  modulationCount: number;
  soundMomentCount: number;
  trackSectionCount: number;
  tagCount: number;
} {
  const entries = getAllMetadataEntries(registry);

  let lyricWordCount = 0;
  let instrumentCount = 0;
  let noteCount = 0;
  let chordCount = 0;
  let modulationCount = 0;
  let soundMomentCount = 0;
  let trackSectionCount = 0;
  let tagCount = 0;

  for (const entry of entries) {
    if (entry.objectType === "lyric-word") lyricWordCount += 1;
    else if (entry.objectType === "instrument") instrumentCount += 1;
    else if (entry.objectType === "note") noteCount += 1;
    else if (entry.objectType === "chord") chordCount += 1;
    else if (entry.objectType === "modulation") modulationCount += 1;
    else if (entry.objectType === "sound-moment") soundMomentCount += 1;
    else if (entry.objectType === "track-section") trackSectionCount += 1;
    else if (entry.objectType === "tag") tagCount += 1;
  }

  return {
    total: entries.length,
    lyricWordCount,
    instrumentCount,
    noteCount,
    chordCount,
    modulationCount,
    soundMomentCount,
    trackSectionCount,
    tagCount,
  };
}