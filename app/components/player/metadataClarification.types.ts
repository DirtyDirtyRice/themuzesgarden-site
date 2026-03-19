export type MetadataClarificationTargetKind =
  | "lyric"
  | "word"
  | "phrase"
  | "note"
  | "chord"
  | "instrument"
  | "texture"
  | "effect"
  | "section"
  | "moment"
  | "track"
  | "other";

export type MetadataClarificationStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "uncertain"
  | "deprecated";

export type MetadataClarificationPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type MetadataClarificationSource =
  | "user"
  | "developer"
  | "system"
  | "imported";

export type MetadataClarificationAmbiguityFlag =
  | "meaning-unclear"
  | "sound-unclear"
  | "timing-unclear"
  | "performance-unclear"
  | "scope-unclear"
  | "conflicting-notes"
  | "missing-context"
  | "needs-review";

export type MetadataClarificationIntent = {
  meaning: string | null;
  sound: string | null;
  emotionalTone: string | null;
  performanceStyle: string | null;
  timingFeel: string | null;
};

export type MetadataClarificationContext = {
  trackId: string | null;
  sectionId: string | null;
  phraseFamilyId: string | null;
  momentId: string | null;
  targetLabel: string | null;
};

export type MetadataClarificationNote = {
  id: string;
  source: MetadataClarificationSource;
  text: string;
};

export type MetadataClarificationAction = {
  id: string;
  label: string;
  actionKind: string;
  payload: Record<string, unknown> | null;
};

export type MetadataClarificationRecord = {
  id: string;
  targetKind: MetadataClarificationTargetKind;
  targetValue: string;
  normalizedTargetValue: string;
  status: MetadataClarificationStatus;
  priority: MetadataClarificationPriority;
  intent: MetadataClarificationIntent;
  context: MetadataClarificationContext;
  ambiguityFlags: MetadataClarificationAmbiguityFlag[];
  userNotes: MetadataClarificationNote[];
  developerNotes: MetadataClarificationNote[];
  actions: MetadataClarificationAction[];
  tags: string[];
};

export type MetadataClarificationResult = {
  recordCount: number;
  records: MetadataClarificationRecord[];
  recordsByTargetKind: Partial<
    Record<MetadataClarificationTargetKind, MetadataClarificationRecord[]>
  >;
  recordsById: Record<string, MetadataClarificationRecord>;
  unresolvedCount: number;
  highPriorityCount: number;
};

export type BuildMetadataClarificationIntentParams = {
  meaning?: unknown;
  sound?: unknown;
  emotionalTone?: unknown;
  performanceStyle?: unknown;
  timingFeel?: unknown;
};

export type BuildMetadataClarificationContextParams = {
  trackId?: unknown;
  sectionId?: unknown;
  phraseFamilyId?: unknown;
  momentId?: unknown;
  targetLabel?: unknown;
};

export type BuildMetadataClarificationNoteParams = {
  id?: unknown;
  source?: unknown;
  text?: unknown;
};

export type BuildMetadataClarificationActionParams = {
  id?: unknown;
  label?: unknown;
  actionKind?: unknown;
  payload?: unknown;
};

export type BuildMetadataClarificationRecordParams = {
  id?: unknown;
  targetKind?: unknown;
  targetValue?: unknown;
  status?: unknown;
  priority?: unknown;
  intent?: BuildMetadataClarificationIntentParams | null;
  context?: BuildMetadataClarificationContextParams | null;
  ambiguityFlags?: unknown[];
  userNotes?: BuildMetadataClarificationNoteParams[];
  developerNotes?: BuildMetadataClarificationNoteParams[];
  actions?: BuildMetadataClarificationActionParams[];
  tags?: unknown[];
};

export type BuildMetadataClarificationResultParams = {
  records?: BuildMetadataClarificationRecordParams[];
};