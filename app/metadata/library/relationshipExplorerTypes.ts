import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

export type RecordWithOptionalRelationships = MetadataLibraryRecordSummary & {
  relationships?: unknown;
};

export type RecordWithOptionalPreview = MetadataLibraryRecordSummary & {
  description?: unknown;
  excerpt?: unknown;
};

export type ExplorerStep = {
  id: string;
  title: string;
  slug: string;
};

export type RelationshipSignalFamily =
  | "shelf"
  | "section"
  | "language"
  | "saved"
  | "suggested"
  | "loose";

export type RelationshipClusterKind = "shelf" | "section" | "language";

export type RelationshipClusterGroup = {
  key: string;
  label: string;
  kind: RelationshipClusterKind;
  count: number;
  records: MetadataLibraryRecordSummary[];
  summary: string;
};

export type RelationshipClusters = {
  shelfClusters: RelationshipClusterGroup[];
  sectionClusters: RelationshipClusterGroup[];
  languageClusters: RelationshipClusterGroup[];
};

export type RelationshipClusterSummary = {
  shelf: string;
  section: string;
  language: string;
  strongestKind: RelationshipClusterKind | "none";
  strongestLabel: string;
  strongestCount: number;
};

export type RelatedRecordSignal = {
  record: MetadataLibraryRecordSummary;
  shelfMatch: boolean;
  sectionMatch: boolean;
  titleMatch: boolean;
  score: number;
  reason: string;
  dominantSignal?: RelationshipSignalFamily | string;
  matchedWords?: string[];
  confidence?: "low" | "medium" | "high";
};

export type RelationshipExplorerStats = {
  relatedByShelfCount: number;
  relatedBySectionCount: number;
  titleMatchCount: number;
  relationshipCount: number;
  relatedRecordsCount: number;
  historyCount: number;
};

export type RelationshipExplorerStatus = {
  activeRecordLabel: string;
  activeRecordSlug: string;
  originalRecordLabel: string;
  isViewingOriginal: boolean;
  relationshipBadge: string;
  explorerHealthLabel: string;
};

export type RelationshipMapSignalDistribution = {
  shelfCount: number;
  sectionCount: number;
  languageCount: number;
  savedCount: number;
  suggestedCount: number;
};

export type RelationshipMapRouteHint = {
  fromLabel: string;
  toLabel: string;
  stepCount: number;
  summary: string;
};