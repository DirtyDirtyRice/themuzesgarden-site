export type MomentInspectorSnapshotVerdict =
  | "all"
  | "stable"
  | "watch"
  | "repair"
  | "blocked";

export type MomentInspectorSnapshotPayload = {
  selectedTrackId: string;
  selectedPhraseFamilyId: string;
  selectedVerdict: MomentInspectorSnapshotVerdict;
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
  comparePrimaryFamilyId: string;
  compareSecondaryFamilyId: string;
};

export type MomentInspectorSnapshotMetadata = {
  exportedAt: string;
  source: "moment-inspector";
  version: 1;
};

export type MomentInspectorSnapshotDocument = {
  metadata: MomentInspectorSnapshotMetadata;
  snapshot: MomentInspectorSnapshotPayload;
};

export type MomentInspectorSnapshotRuntimeInput = {
  selectedTrackId: string;
  selectedPhraseFamilyId: string;
  selectedVerdict: MomentInspectorSnapshotVerdict;
  pinnedFamilyIds: string[];
  pinnedOnly: boolean;
  comparePrimaryFamilyId: string;
  compareSecondaryFamilyId: string;
};

export type MomentInspectorSnapshotExportResult = {
  filename: string;
  json: string;
  document: MomentInspectorSnapshotDocument;
};