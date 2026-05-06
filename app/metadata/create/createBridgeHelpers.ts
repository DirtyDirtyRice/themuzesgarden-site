import type {
  DirectPayloadRecord,
  DirectSaveStatus,
  ParsedRecordState,
} from "./createBridgeTypes";

export function cleanSaveText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createButtonClass(isEnabled: boolean) {
  if (isEnabled) {
    return "border border-white/10 bg-white text-black hover:opacity-85 active:scale-[0.98]";
  }

  return "cursor-not-allowed border border-white/10 bg-white/5 text-white/35";
}

export function secondaryButtonClass() {
  return "inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:opacity-85 active:scale-[0.98]";
}

export function getDirectSaveStatusClass(status: DirectSaveStatus) {
  if (status.tone === "success") {
    return "border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100";
  }

  if (status.tone === "error") {
    return "border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200";
  }

  if (status.tone === "saving") {
    return "border-white/10 bg-black px-3 py-2 text-sm text-white/70";
  }

  return "";
}

export function getParsedRecord(savePayloadJson: string): ParsedRecordState {
  try {
    const parsedPayload = JSON.parse(savePayloadJson) as {
      record?: DirectPayloadRecord;
      readyForCreate?: boolean;
    };

    if (!parsedPayload.readyForCreate) {
      return {
        record: null,
        errorMessage: "The record is not marked ready for save yet.",
      };
    }

    if (!parsedPayload.record || typeof parsedPayload.record !== "object") {
      return {
        record: null,
        errorMessage: "The save data does not contain a valid record yet.",
      };
    }

    return {
      record: parsedPayload.record,
      errorMessage: "",
    };
  } catch {
    return {
      record: null,
      errorMessage: "The save data could not be read yet.",
    };
  }
}

export function getRecordValidationError(record: DirectPayloadRecord | null) {
  if (!record) {
    return "No record is ready to save.";
  }

  if (!cleanSaveText(record.id)) {
    return "Record id is missing.";
  }

  if (!cleanSaveText(record.slug)) {
    return "Record slug is missing.";
  }

  if (!cleanSaveText(record.title)) {
    return "Record title is missing.";
  }

  return "";
}

export function getFriendlySaveError(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  if (
    normalizedMessage.includes("duplicate key") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("metadata_records_pkey")
  ) {
    return "This record already exists. Open the existing record or create another.";
  }

  return "Save failed. Check the required fields, then try again.";
}

export function isDuplicateSaveMessage(message: string) {
  return message.toLowerCase().includes("already exists");
}

export function getSaveButtonText(status: DirectSaveStatus, hasSaved: boolean) {
  if (status.tone === "saving") {
    return "Saving...";
  }

  if (hasSaved) {
    return "Saved";
  }

  return "Save Record";
}

export function buildMetadataRecordInsert(record: DirectPayloadRecord) {
  return {
    id: cleanSaveText(record.id),
    slug: cleanSaveText(record.slug),
    title: cleanSaveText(record.title),
    shelf: cleanSaveText(record.shelf),
    section: cleanSaveText(record.section),
    visibility: cleanSaveText(record.visibility),
    excerpt: cleanSaveText(record.excerpt),
    description: cleanSaveText(record.description),
    fields: record.fields ?? [],
  };
}