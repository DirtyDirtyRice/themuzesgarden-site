export type MetadataCreateCreateBridgePanelProps = {
  saveReady: boolean;
  saveBlockedReasons: string[];
  savePayloadJson: string;
  isSubmitting: boolean;
  submitMessage: string;
  submitError: string;
  createdSlug: string;
  onCreateRecord: () => void;
};

export type DirectSaveStatus =
  | {
      tone: "idle";
      message: "";
    }
  | {
      tone: "saving" | "success" | "error";
      message: string;
    };

export type DirectPayloadRecord = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  shelf?: unknown;
  section?: unknown;
  visibility?: unknown;
  excerpt?: unknown;
  description?: unknown;
  fields?: unknown;
  relationships?: unknown;
};

export type ParsedRecordState = {
  record: DirectPayloadRecord | null;
  errorMessage: string;
};

export type SaveActionState = {
  status: DirectSaveStatus;
  hasSaved: boolean;
  hasDuplicateRecord: boolean;
  recordViewSlug: string;
  canDirectSave: boolean;
};

export type SaveActionCopy = {
  blockedTitle: string;
  readyTitle: string;
  savedTitle: string;
  duplicateTitle: string;
};