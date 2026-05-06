"use client";

import { useMemo, useState } from "react";

import { getMetadataLibrary } from "@/lib/metadata/metadataLibrarySeed";
import type {
  MetadataRecord,
  MetadataRecordSummary,
  MetadataSectionKey,
  MetadataShelfKey,
} from "@/lib/metadata/metadataLibraryTypes";

import { VISIBILITY_OPTIONS } from "@/app/metadata/create/metadataCreateConfig";
import { getRelationshipLabel } from "@/app/metadata/create/metadataCreateUtils";
import { validateMetadataCreateState } from "@/app/metadata/create/metadataCreateValidation";
import { buildMetadataCreateRecord } from "@/app/metadata/create/metadataCreateRecordBuilder";

import {
  executeMetadataUpdateSubmit,
  type MetadataUpdateRelationshipDraft,
} from "./metadataUpdateSubmitAction";
import MetadataEditPanelNavigator, {
  type MetadataEditPanelKey,
} from "./MetadataEditPanelNavigator";
import MetadataRecordEditFormPanel from "./MetadataRecordEditFormPanel";
import MetadataRecordEditHeader from "./MetadataRecordEditHeader";
import MetadataRelationshipPreviewPanel from "./MetadataRelationshipPreviewPanel";
import MetadataRecordUpdateActionPanel from "./MetadataRecordUpdateActionPanel";
import {
  cleanText,
  findBelongsReasonFromRecord,
  findRecordTypeFromRecord,
  getRelationshipMeaning,
  type RecordTypeOption,
  type RelationshipType,
} from "./metadataEditHelpers";
import {
  buildRelationshipOptions,
  findSelectedRelatedRecord,
  hasDuplicateRelationshipSelection,
  type RecordSummaryOption,
} from "./metadataEditRelationshipOptions";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];

type ShelfOption = {
  id: string;
  key?: MetadataShelfKey;
  label: string;
  description: string;
  sections: {
    id: string;
    key?: MetadataSectionKey;
    label: string;
  }[];
};

function cleanTextWithFallback(value: unknown, fallback = "") {
  const cleaned = cleanText(value);
  return cleaned || fallback;
}

export default function MetadataRecordEditClient({
  record,
  recordSummaries,
}: {
  record: MetadataRecord;
  recordSummaries: MetadataRecordSummary[];
}) {
  const library = getMetadataLibrary();

  const shelfOptions = library.shelves as ShelfOption[];
  const starterRelationshipOptions = recordSummaries as RecordSummaryOption[];

  const initialShelf =
    shelfOptions.find((shelf) => shelf.key === record.shelf) ??
    shelfOptions[0] ??
    null;

  const initialSection =
    initialShelf?.sections.find((section) => section.key === record.section) ??
    initialShelf?.sections[0] ??
    null;

  const firstRelationship = record.relationships[0] ?? null;
  const currentRelationshipId = cleanText(firstRelationship?.id);

  const [activePanel, setActivePanel] = useState<MetadataEditPanelKey>("form");
  const [title, setTitle] = useState(record.title);
  const [selectedShelfId, setSelectedShelfId] = useState(initialShelf?.id ?? "");
  const [selectedSectionId, setSelectedSectionId] = useState(
    initialSection?.id ?? "",
  );
  const [recordType, setRecordType] = useState<RecordTypeOption>(
    findRecordTypeFromRecord(record),
  );
  const [visibility, setVisibility] = useState<VisibilityOption>(
    record.visibility,
  );
  const [summary, setSummary] = useState(record.excerpt);
  const [belongsReason, setBelongsReason] = useState(
    findBelongsReasonFromRecord(record),
  );
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    (firstRelationship?.type as RelationshipType) ?? "related_to",
  );
  const [relatedRecordId, setRelatedRecordId] = useState(
    firstRelationship?.targetRecordId ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [updatedSlug, setUpdatedSlug] = useState(record.slug);

  const activeShelf = useMemo(() => {
    return shelfOptions.find((shelf) => shelf.id === selectedShelfId) ?? null;
  }, [selectedShelfId, shelfOptions]);

  const activeSections = activeShelf?.sections ?? [];

  const activeSection = useMemo(() => {
    return (
      activeSections.find((section) => section.id === selectedSectionId) ?? null
    );
  }, [activeSections, selectedSectionId]);

  const relationshipOptions = useMemo(() => {
    return buildRelationshipOptions({
      title,
      record,
      relationshipType,
      currentRelationshipId,
      starterRelationshipOptions,
    });
  }, [
    title,
    record,
    relationshipType,
    currentRelationshipId,
    starterRelationshipOptions,
  ]);

  const selectedRelatedRecord = useMemo(() => {
    return findSelectedRelatedRecord(relationshipOptions, relatedRecordId);
  }, [relationshipOptions, relatedRecordId]);

  const duplicateRelationshipSelected = useMemo(() => {
    return hasDuplicateRelationshipSelection({
      record,
      selectedRelatedRecord,
      relationshipType,
      currentRelationshipId,
    });
  }, [
    record,
    selectedRelatedRecord,
    relationshipType,
    currentRelationshipId,
  ]);

  function handleShelfChange(nextShelfId: string) {
    const nextShelf =
      shelfOptions.find((shelf) => shelf.id === nextShelfId) ?? null;

    setSelectedShelfId(nextShelfId);
    setSelectedSectionId(nextShelf?.sections[0]?.id ?? "");
  }

  function handleRelationshipTypeChange(nextRelationshipType: RelationshipType) {
    setRelationshipType(nextRelationshipType);

    if (relatedRecordId) {
      setActivePanel("preview");
    }
  }

  function handleRelatedRecordChange(nextRelatedRecordId: string) {
    setRelatedRecordId(nextRelatedRecordId);

    if (nextRelatedRecordId) {
      setActivePanel("preview");
    }
  }

  const validation = useMemo(() => {
    return validateMetadataCreateState({
      title,
      summary,
      belongsReason,
      visibility,
      hasActiveShelf: Boolean(activeShelf),
      hasActiveSection: Boolean(activeSection),
      hasSelectedRelatedRecord: Boolean(selectedRelatedRecord),
      relationshipType,
    });
  }, [
    title,
    summary,
    belongsReason,
    visibility,
    activeShelf,
    activeSection,
    selectedRelatedRecord,
    relationshipType,
  ]);

  const trimmedTitle = validation.trimmedTitle;
  const trimmedSummary = validation.trimmedSummary;
  const trimmedBelongsReason = validation.trimmedBelongsReason;
  const generatedSlug = validation.generatedSlug;
  const canSubmitUpdate = validation.canContinue && !duplicateRelationshipSelected;

  const relationshipPreviewLabel = selectedRelatedRecord
    ? `${getRelationshipLabel(relationshipType)} → ${selectedRelatedRecord.title}`
    : "No starter relationship selected yet.";

  const relationshipPreviewDescription = selectedRelatedRecord
    ? `${getRelationshipLabel(relationshipType)}: ${
        cleanText(trimmedTitle || record.title) || "This record"
      } → ${cleanText(selectedRelatedRecord.title) || "the selected record"}`
    : "Choose a relationship type and a related record to preview what this connection will mean before you update the record.";

  const relationshipMeaning = selectedRelatedRecord
    ? getRelationshipMeaning(
        relationshipType,
        cleanText(selectedRelatedRecord.title) || "the selected record",
      )
    : "The preview explanation will appear here after you select a related record.";

  const recordBuild = useMemo(() => {
    return buildMetadataCreateRecord({
      generatedSlug,
      trimmedTitle,
      trimmedSummary,
      trimmedBelongsReason,
      visibility,
      recordType,
      relationshipType,
      selectedShelfId,
      selectedSectionId,
      activeShelfKey: activeShelf?.key,
      activeSectionKey: activeSection?.key,
      selectedRelatedRecord,
    });
  }, [
    generatedSlug,
    trimmedTitle,
    trimmedSummary,
    trimmedBelongsReason,
    visibility,
    recordType,
    relationshipType,
    selectedShelfId,
    selectedSectionId,
    activeShelf,
    activeSection,
    selectedRelatedRecord,
  ]);

  const relationshipDraft = useMemo<MetadataUpdateRelationshipDraft | null>(() => {
    if (!selectedRelatedRecord) return null;

    const sourceTitle = cleanTextWithFallback(
      trimmedTitle || record.title,
      "This record",
    );
    const targetTitle = cleanTextWithFallback(
      selectedRelatedRecord.title,
      "Selected record",
    );
    const targetRecordId = cleanText(selectedRelatedRecord.id);
    const rawTargetSlug = cleanText(
      (selectedRelatedRecord as { slug?: unknown }).slug,
    );
    const targetSlug = rawTargetSlug || targetRecordId;
    const detail = `${getRelationshipLabel(
      relationshipType,
    )}: ${sourceTitle} → ${targetTitle}`;

    return {
      sourceRecordId: cleanText(record.id),
      sourceSlug: cleanTextWithFallback(generatedSlug || record.slug, record.slug),
      sourceTitle,
      targetRecordId,
      targetSlug,
      targetTitle,
      relationshipType,
      detail,
      note: "",
      reason: relationshipMeaning,
    };
  }, [
    selectedRelatedRecord,
    trimmedTitle,
    record.id,
    record.slug,
    record.title,
    generatedSlug,
    relationshipType,
    relationshipMeaning,
  ]);

  const updatedRecord = useMemo<MetadataRecord>(() => {
    return {
      ...recordBuild.finalRecord,
      id: record.id,
      relationships: [],
    };
  }, [recordBuild.finalRecord, record.id]);

  const updatedRecordJson = useMemo(() => {
    return JSON.stringify(
      {
        ...updatedRecord,
        relationshipStorage: relationshipDraft
          ? "metadata_relationships table"
          : "no relationship selected",
        relationshipDraft,
      },
      null,
      2,
    );
  }, [updatedRecord, relationshipDraft]);

  async function handleUpdateRecord() {
    setSubmitMessage("");
    setSubmitError("");
    setUpdatedSlug("");

    if (!validation.canContinue) {
      setSubmitError("Please finish the required edit fields before updating.");
      setActivePanel("form");
      return;
    }

    if (duplicateRelationshipSelected) {
      setSubmitError("That relationship already exists on this record.");
      setActivePanel("update");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await executeMetadataUpdateSubmit({
        originalRecordId: record.id,
        originalSlug: record.slug,
        updatedRecord,
        readyForUpdate: canSubmitUpdate,
        relationshipDraft,
      });

      if (!result.ok) {
        setSubmitError(result.message);
        setActivePanel("update");
        return;
      }

      setSubmitMessage(result.message);
      setUpdatedSlug(result.updatedRecord.slug);
      setActivePanel("update");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unknown update error occurred.",
      );
      setActivePanel("update");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <MetadataRecordEditHeader
          recordId={record.id}
          recordSlug={record.slug}
          recordTitle={record.title}
        />

        <MetadataEditPanelNavigator
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />

        {activePanel === "form" ? (
          <MetadataRecordEditFormPanel
            title={title}
            onTitleChange={setTitle}
            selectedShelfId={selectedShelfId}
            onShelfChange={handleShelfChange}
            selectedSectionId={selectedSectionId}
            onSectionChange={setSelectedSectionId}
            recordType={recordType}
            onRecordTypeChange={setRecordType}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            summary={summary}
            onSummaryChange={setSummary}
            belongsReason={belongsReason}
            onBelongsReasonChange={setBelongsReason}
            relationshipType={relationshipType}
            onRelationshipTypeChange={handleRelationshipTypeChange}
            relatedRecordId={relatedRecordId}
            onRelatedRecordChange={handleRelatedRecordChange}
            shelfOptions={shelfOptions}
            activeShelfDescription={activeShelf?.description ?? ""}
            activeSections={activeSections}
            generatedSlug={generatedSlug}
            relationshipOptions={relationshipOptions}
            requiredReadyCount={validation.requiredReadyCount}
            hasRelationshipStarter={validation.hasRelationshipStarter}
            missingItems={validation.missingItems}
            canContinue={validation.canContinue}
            titleReady={validation.titleReady}
            slugReady={validation.slugReady}
            summaryReady={validation.summaryReady}
            belongsReady={validation.belongsReady}
            activeShelfLabel={activeShelf?.label ?? ""}
            activeSectionLabel={activeSection?.label ?? ""}
            trimmedTitle={trimmedTitle}
            trimmedSummary={trimmedSummary}
            trimmedBelongsReason={trimmedBelongsReason}
            relationshipPreviewLabel={relationshipPreviewLabel}
          />
        ) : null}

        {activePanel === "preview" ? (
          <MetadataRelationshipPreviewPanel
            relationshipPreviewDescription={relationshipPreviewDescription}
            relationshipMeaning={relationshipMeaning}
            sourceTitle={cleanText(trimmedTitle || record.title) || "This record"}
            targetTitle={
              cleanText(selectedRelatedRecord?.title) || "the selected record"
            }
            hasSelectedRelatedRecord={Boolean(selectedRelatedRecord)}
            canGoToUpdate={canSubmitUpdate}
            onGoToForm={() => setActivePanel("form")}
            onGoToUpdate={() => setActivePanel("update")}
          />
        ) : null}

        {activePanel === "update" ? (
          <MetadataRecordUpdateActionPanel
            updatedRecordJson={updatedRecordJson}
            canSubmitUpdate={canSubmitUpdate}
            isSubmitting={isSubmitting}
            updatedSlug={updatedSlug}
            submitMessage={submitMessage}
            submitError={submitError}
            hasDuplicateRelationshipSelection={duplicateRelationshipSelected}
            onEditAgain={() => setActivePanel("form")}
            onUpdateRecord={() => {
              void handleUpdateRecord();
            }}
          />
        ) : null}
      </div>
    </main>
  );
}