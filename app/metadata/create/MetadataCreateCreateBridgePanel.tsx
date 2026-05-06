"use client";

import { useMemo, useState } from "react";

import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";

import CreateBridgePayloadPanel from "./CreateBridgePayloadPanel";
import CreateBridgeReadiness from "./CreateBridgeReadiness";
import CreateBridgeSaveAction from "./CreateBridgeSaveAction";
import {
  buildMetadataRecordInsert,
  cleanSaveText,
  getFriendlySaveError,
  getParsedRecord,
  getRecordValidationError,
  isDuplicateSaveMessage,
} from "./createBridgeHelpers";
import type {
  DirectSaveStatus,
  MetadataCreateCreateBridgePanelProps,
} from "./createBridgeTypes";

export default function MetadataCreateCreateBridgePanel({
  saveReady,
  saveBlockedReasons,
  savePayloadJson,
  isSubmitting,
  submitMessage,
  submitError,
  createdSlug,
}: MetadataCreateCreateBridgePanelProps) {
  const [directSaveStatus, setDirectSaveStatus] = useState<DirectSaveStatus>({
    tone: "idle",
    message: "",
  });
  const [savedRecordSlug, setSavedRecordSlug] = useState("");
  const [hasDuplicateRecord, setHasDuplicateRecord] = useState(false);

  const parsedRecordState = useMemo(() => {
    return getParsedRecord(savePayloadJson);
  }, [savePayloadJson]);

  const recordValidationError = getRecordValidationError(
    parsedRecordState.record,
  );
  const directSaveBlockedReason =
    parsedRecordState.errorMessage || recordValidationError;
  const currentRecordSlug = cleanSaveText(parsedRecordState.record?.slug);
  const recordViewSlug = savedRecordSlug || createdSlug || currentRecordSlug;
  const hasSaved = directSaveStatus.tone === "success";
  const canDirectSave =
    saveReady &&
    !isSubmitting &&
    !directSaveBlockedReason &&
    !hasSaved &&
    !hasDuplicateRecord &&
    directSaveStatus.tone !== "saving";

  async function handleDirectSaveRecord() {
    if (!canDirectSave || !parsedRecordState.record) {
      setDirectSaveStatus({
        tone: "error",
        message:
          directSaveBlockedReason ||
          "This record is not ready to save yet. Check the required fields.",
      });
      return;
    }

    setHasDuplicateRecord(false);
    setDirectSaveStatus({
      tone: "saving",
      message: "Saving record...",
    });

    try {
      const supabase = requireMetadataSupabase();
      const record = parsedRecordState.record;
      const recordSlug = cleanSaveText(record.slug);
      const recordTitle = cleanSaveText(record.title);
      const insertRecord = buildMetadataRecordInsert(record);

      const { data: existingRecord, error: existingError } = await supabase
        .from("metadata_records")
        .select("slug")
        .eq("slug", recordSlug)
        .maybeSingle();

      if (existingError) {
        setHasDuplicateRecord(false);
        setDirectSaveStatus({
          tone: "error",
          message: "Save check failed. Try again before saving this record.",
        });
        return;
      }

      if (existingRecord) {
        setHasDuplicateRecord(true);
        setSavedRecordSlug(recordSlug);
        setDirectSaveStatus({
          tone: "error",
          message:
            "This record already exists. Open the existing record or create another.",
        });
        return;
      }

      const { error } = await supabase.from("metadata_records").insert([
        insertRecord,
      ]);

      if (error) {
        const friendlyMessage = getFriendlySaveError(error.message);
        const isDuplicateRecord = isDuplicateSaveMessage(friendlyMessage);

        setHasDuplicateRecord(isDuplicateRecord);
        setSavedRecordSlug(isDuplicateRecord ? recordSlug : "");
        setDirectSaveStatus({
          tone: "error",
          message: friendlyMessage,
        });
        return;
      }

      setSavedRecordSlug(recordSlug);
      setDirectSaveStatus({
        tone: "success",
        message: `Saved successfully: ${recordTitle}.`,
      });
    } catch {
      setHasDuplicateRecord(false);
      setDirectSaveStatus({
        tone: "error",
        message: "Save failed unexpectedly. Check the record, then try again.",
      });
    }
  }

  return (
    <section
      id="metadata-create-bridge"
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            Save record
          </span>

          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Ready to Create
          </h2>

          <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            Save the metadata record once. After it saves, the save button locks
            and the next action buttons appear.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatusCard label="Save Ready" value={saveReady ? "Yes" : "No"} />
          <StatusCard label="Blockers" value={String(saveBlockedReasons.length)} />
          <StatusCard
            label="Status"
            value={
              hasSaved
                ? "saved"
                : hasDuplicateRecord
                  ? "already exists"
                  : "not saved yet"
            }
          />
        </div>

        <CreateBridgeReadiness
          saveReady={saveReady}
          saveBlockedReasons={saveBlockedReasons}
          directSaveBlockedReason={directSaveBlockedReason}
          hasSaved={hasSaved}
          hasDuplicateRecord={hasDuplicateRecord}
        />

        <CreateBridgePayloadPanel savePayloadJson={savePayloadJson} />

        <CreateBridgeSaveAction
          canDirectSave={canDirectSave}
          directSaveStatus={directSaveStatus}
          hasSaved={hasSaved}
          hasDuplicateRecord={hasDuplicateRecord}
          recordViewSlug={recordViewSlug}
          submitMessage={submitMessage}
          submitError={submitError}
          onDirectSaveRecord={() => void handleDirectSaveRecord()}
        />
      </div>
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-white/85">{value}</p>
    </div>
  );
}