"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getMetadataLibrary,
  getMetadataRecordSummaries,
} from "@/lib/metadata/metadataLibrarySeed";
import type {
  MetadataSectionKey,
  MetadataShelfKey,
} from "@/lib/metadata/metadataLibraryTypes";
import { requireMetadataSupabase } from "@/lib/metadata/metadataSupabase";

import {
  RECORD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./metadataCreateConfig";
import { buildMetadataCreateRecord } from "./metadataCreateRecordBuilder";
import { buildMetadataCreateSaveBridge } from "./metadataCreateSaveBridge";
import { executeMetadataCreateSubmit } from "./metadataCreateSubmitAction";
import { getRelationshipLabel, slugify } from "./metadataCreateUtils";
import { validateMetadataCreateState } from "./metadataCreateValidation";

export type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
export type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];
export type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];
export type MetadataCreatePanel = "form" | "preview" | "output" | "save";

type DuplicateSlugStatus = "idle" | "checking" | "available" | "duplicate";

export type ShelfOption = {
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

export type RecordSummaryOption = {
  id: string;
  title: string;
  slug: string;
};

export const CREATE_PANELS = [
  { key: "form", title: "Create Form", description: "Enter record data." },
  { key: "preview", title: "Live Preview", description: "Check details." },
  { key: "output", title: "Output", description: "Review JSON." },
  { key: "save", title: "Save", description: "Finalize record." },
] as const;

export function getPanelTitle(panelKey: MetadataCreatePanel) {
  return (
    CREATE_PANELS.find((panel) => panel.key === panelKey)?.title ??
    "Create Form"
  );
}

function getShelfOptions() {
  const library = getMetadataLibrary();

  return library.shelves as ShelfOption[];
}

function getStarterRelationshipOptions() {
  const recordSummaries = getMetadataRecordSummaries();

  return recordSummaries as RecordSummaryOption[];
}

function getFirstShelfId(shelfOptions: ShelfOption[]) {
  return shelfOptions[0]?.id ?? "";
}

function getFirstSectionId(shelfOptions: ShelfOption[]) {
  return shelfOptions[0]?.sections[0]?.id ?? "";
}

function getActiveShelf(
  shelfOptions: ShelfOption[],
  selectedShelfId: string,
) {
  return shelfOptions.find((shelf) => shelf.id === selectedShelfId) ?? null;
}

function getActiveSection(
  activeSections: ShelfOption["sections"],
  selectedSectionId: string,
) {
  return (
    activeSections.find((section) => section.id === selectedSectionId) ?? null
  );
}

function getRelationshipOptions(
  starterRelationshipOptions: RecordSummaryOption[],
  title: string,
) {
  const currentSlug = slugify(title);

  return starterRelationshipOptions.filter((record) => {
    return record.slug !== currentSlug;
  });
}

function getSelectedRelatedRecord(
  relationshipOptions: RecordSummaryOption[],
  relatedRecordId: string,
) {
  return relationshipOptions.find((record) => record.id === relatedRecordId) ?? null;
}

function getSeedRecordSlugSet(records: RecordSummaryOption[]) {
  return new Set(records.map((record) => record.slug).filter(Boolean));
}

function getDuplicateTitleMessage(status: DuplicateSlugStatus) {
  if (status === "checking") {
    return "Checking title availability.";
  }

  if (status === "duplicate") {
    return "Sorry, this title has already been used.";
  }

  return "";
}

export function useMetadataCreatePageState() {
  const router = useRouter();

  const shelfOptions = useMemo(() => {
    return getShelfOptions();
  }, []);

  const starterRelationshipOptions = useMemo(() => {
    return getStarterRelationshipOptions();
  }, []);

  const seedRecordSlugs = useMemo(() => {
    return getSeedRecordSlugSet(starterRelationshipOptions);
  }, [starterRelationshipOptions]);

  const [activePanel, setActivePanel] =
    useState<MetadataCreatePanel>("form");

  const [title, setTitle] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState(() => {
    return getFirstShelfId(shelfOptions);
  });
  const [selectedSectionId, setSelectedSectionId] = useState(() => {
    return getFirstSectionId(shelfOptions);
  });

  const [recordType, setRecordType] =
    useState<RecordTypeOption>("concept");
  const [visibility, setVisibility] =
    useState<VisibilityOption>("public");

  const [summary, setSummary] = useState("");
  const [belongsReason, setBelongsReason] = useState("");

  const [relationshipType, setRelationshipType] =
    useState<RelationshipType>("related_to");
  const [relatedRecordId, setRelatedRecordId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [duplicateSlugStatus, setDuplicateSlugStatus] =
    useState<DuplicateSlugStatus>("idle");

  const generatedTitleSlug = slugify(title);
  const duplicateTitleMessage = getDuplicateTitleMessage(duplicateSlugStatus);
  const isDuplicateSlug = duplicateSlugStatus === "duplicate";
  const isCheckingDuplicateSlug = duplicateSlugStatus === "checking";

  useEffect(() => {
    const cleanTitle = title.trim();

    if (!generatedTitleSlug || cleanTitle.length < 3) {
      setDuplicateSlugStatus("idle");
      return;
    }

    if (seedRecordSlugs.has(generatedTitleSlug)) {
      setDuplicateSlugStatus("duplicate");
      return;
    }

    let isCurrentCheck = true;

    setDuplicateSlugStatus("checking");

    const duplicateCheckTimer = window.setTimeout(async () => {
      try {
        const supabase = requireMetadataSupabase();

        const { data, error } = await supabase
          .from("metadata_records")
          .select("slug")
          .eq("slug", generatedTitleSlug)
          .maybeSingle();

        if (!isCurrentCheck) return;

        if (error) {
          setDuplicateSlugStatus("available");
          return;
        }

        setDuplicateSlugStatus(data ? "duplicate" : "available");
      } catch {
        if (isCurrentCheck) {
          setDuplicateSlugStatus("available");
        }
      }
    }, 250);

    return () => {
      isCurrentCheck = false;
      window.clearTimeout(duplicateCheckTimer);
    };
  }, [generatedTitleSlug, seedRecordSlugs, title]);

  const activeShelf = useMemo(() => {
    return getActiveShelf(shelfOptions, selectedShelfId);
  }, [selectedShelfId, shelfOptions]);

  const activeSections = activeShelf?.sections ?? [];

  const activeSection = useMemo(() => {
    return getActiveSection(activeSections, selectedSectionId);
  }, [activeSections, selectedSectionId]);

  const relationshipOptions = useMemo(() => {
    return getRelationshipOptions(starterRelationshipOptions, title);
  }, [starterRelationshipOptions, title]);

  const selectedRelatedRecord = useMemo(() => {
    return getSelectedRelatedRecord(relationshipOptions, relatedRecordId);
  }, [relationshipOptions, relatedRecordId]);

  function handleShelfChange(nextShelfId: string) {
    const nextShelf =
      shelfOptions.find((shelf) => shelf.id === nextShelfId) ?? null;

    setSelectedShelfId(nextShelfId);
    setSelectedSectionId(nextShelf?.sections[0]?.id ?? "");
  }

  const baseValidation = useMemo(() => {
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

  const validation = useMemo(() => {
    const duplicateBlocker = duplicateTitleMessage
      ? [duplicateTitleMessage]
      : [];

    return {
      ...baseValidation,
      titleReady:
        baseValidation.titleReady &&
        !isDuplicateSlug &&
        !isCheckingDuplicateSlug,
      canContinue:
        baseValidation.canContinue &&
        !isDuplicateSlug &&
        !isCheckingDuplicateSlug,
      missingItems: [...duplicateBlocker, ...baseValidation.missingItems],
      duplicateTitleMessage,
      duplicateSlugStatus,
    };
  }, [
    baseValidation,
    duplicateSlugStatus,
    duplicateTitleMessage,
    isCheckingDuplicateSlug,
    isDuplicateSlug,
  ]);

  const recordBuild = useMemo(() => {
    return buildMetadataCreateRecord({
      generatedSlug: validation.generatedSlug,
      trimmedTitle: validation.trimmedTitle,
      trimmedSummary: validation.trimmedSummary,
      trimmedBelongsReason: validation.trimmedBelongsReason,
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
    validation,
    visibility,
    recordType,
    relationshipType,
    selectedShelfId,
    selectedSectionId,
    activeShelf,
    activeSection,
    selectedRelatedRecord,
  ]);

  const saveBridge = useMemo(() => {
    return buildMetadataCreateSaveBridge({
      finalRecord: recordBuild.finalRecord,
      canContinue: validation.canContinue,
      missingItems: validation.missingItems,
    });
  }, [recordBuild.finalRecord, validation]);

  const relationshipPreviewLabel = selectedRelatedRecord
    ? `${getRelationshipLabel(relationshipType)} ${selectedRelatedRecord.title}`
    : "";

  async function handleCreateRecord() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");

    try {
      const result = await executeMetadataCreateSubmit(saveBridge.savePayload);

      if (!result.ok) {
        setSubmitError(result.message);
        setActivePanel("save");
        return;
      }

      setSubmitMessage(result.message);
      setCreatedSlug(result.createdRecord.slug);
      router.push("/metadata/library");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    activePanel,
    setActivePanel,
    title,
    setTitle,
    selectedShelfId,
    setSelectedShelfId,
    selectedSectionId,
    setSelectedSectionId,
    recordType,
    setRecordType,
    visibility,
    setVisibility,
    summary,
    setSummary,
    belongsReason,
    setBelongsReason,
    relationshipType,
    setRelationshipType,
    relatedRecordId,
    setRelatedRecordId,
    isSubmitting,
    submitMessage,
    submitError,
    createdSlug,
    shelfOptions,
    activeShelf,
    activeSections,
    activeSection,
    relationshipOptions,
    selectedRelatedRecord,
    relationshipPreviewLabel,
    validation,
    recordBuild,
    saveBridge,
    handleShelfChange,
    handleCreateRecord,
  };
}