export type FindItTargetId =
  | "metadata-create-record"
  | "metadata-library"
  | "metadata-open-record"
  | "metadata-relationships"
  | "metadata-system"
  | "metadata-edit-record"
  | "metadata-delete-record"
  | "metadata-create-required-fields"
  | "metadata-create-placement"
  | "metadata-more-information"
  | "metadata-find-it-help"
  | "home"
  | "main-library"
  | "listen"
  | "live"
  | "members";

export type FindItTargetCategory =
  | "Metadata"
  | "Navigation"
  | "Record"
  | "Create"
  | "Help";

export type FindItTarget = {
  id: FindItTargetId;
  label: string;
  shortLabel: string;
  category: FindItTargetCategory;
  keywords: string[];
  route: string;
  steps: string[];
  exactSteps: string[];
  detail: string;
  startButtonLabel?: string;
};

export type FindItMatch = {
  target: FindItTarget;
  score: number;
  matchedWords: string[];
};

export type TreeMarker = "here" | "target";

export type CurrentLocationSummary = {
  label: string;
  steps: string[];
};