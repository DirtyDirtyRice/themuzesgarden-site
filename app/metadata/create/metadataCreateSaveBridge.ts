import type {
  MetadataCreatePayload,
  MetadataRecord,
} from "@/lib/metadata/metadataLibraryTypes";

export type MetadataCreateSaveBridgeInput = {
  finalRecord: MetadataRecord;
  canContinue: boolean;
  missingItems: string[];
};

export type MetadataCreateSaveBridgeResult = {
  saveReady: boolean;
  saveBlockedReasons: string[];
  savePayload: MetadataCreatePayload;
  savePayloadJson: string;
};

export function buildMetadataCreateSaveBridge({
  finalRecord,
  canContinue,
  missingItems,
}: MetadataCreateSaveBridgeInput): MetadataCreateSaveBridgeResult {
  const saveBlockedReasons = canContinue
    ? []
    : Array.isArray(missingItems)
      ? missingItems.slice()
      : ["Record is not ready for create."];

  const saveReady = canContinue && saveBlockedReasons.length === 0;

  const savePayload: MetadataCreatePayload = {
    record: finalRecord,
    mode: "create",
    source: "metadata-create",
    readyForCreate: saveReady,
  };

  const savePayloadJson = JSON.stringify(savePayload, null, 2);

  return {
    saveReady,
    saveBlockedReasons,
    savePayload,
    savePayloadJson,
  };
}