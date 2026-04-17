"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getMetadataLibrary,
  getMetadataRecordSummaries,
} from "@/lib/metadata/metadataLibrarySeed";

import {
  RECORD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./metadataCreateConfig";

import {
  getRelationshipLabel,
  slugify,
} from "./metadataCreateUtils";

import { validateMetadataCreateState } from "./metadataCreateValidation";
import { buildMetadataCreateRecord } from "./metadataCreateRecordBuilder";

import MetadataCreateForm from "./MetadataCreateForm";
import MetadataCreateSidebar from "./MetadataCreateSidebar";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];
type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

type ShelfOption = {
  id: string;
  key?: string;
  label: string;
  description: string;
  sections: {
    id: string;
    key?: string;
    label: string;
  }[];
};

type RecordSummaryOption = {
  id: string;
  title: string;
  slug: string;
};

export default function MetadataCreatePage() {
  const library = getMetadataLibrary();
  const recordSummaries = getMetadataRecordSummaries();

  const shelfOptions = library.shelves as ShelfOption[];
  const starterRelationshipOptions = recordSummaries as RecordSummaryOption[];

  const [title, setTitle] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState(
    shelfOptions[0]?.id ?? ""
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    shelfOptions[0]?.sections[0]?.id ?? ""
  );
  const [recordType, setRecordType] = useState<RecordTypeOption>("concept");
  const [visibility, setVisibility] = useState<VisibilityOption>("public");
  const [summary, setSummary] = useState("");
  const [belongsReason, setBelongsReason] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType>("related_to");
  const [relatedRecordId, setRelatedRecordId] = useState("");

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
    const currentSlug = slugify(title);

    return starterRelationshipOptions.filter(
      (record) => record.slug !== currentSlug
    );
  }, [starterRelationshipOptions, title]);

  const selectedRelatedRecord = useMemo(() => {
    return (
      relationshipOptions.find((record) => record.id === relatedRecordId) ?? null
    );
  }, [relationshipOptions, relatedRecordId]);

  function handleShelfChange(nextShelfId: string) {
    const nextShelf =
      shelfOptions.find((shelf) => shelf.id === nextShelfId) ?? null;

    setSelectedShelfId(nextShelfId);
    setSelectedSectionId(nextShelf?.sections[0]?.id ?? "");
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

  const titleReady = validation.titleReady;
  const slugReady = validation.slugReady;
  const summaryReady = validation.summaryReady;
  const belongsReady = validation.belongsReady;

  const requiredReadyCount = validation.requiredReadyCount;
  const canContinue = validation.canContinue;
  const hasRelationshipStarter = validation.hasRelationshipStarter;
  const missingItems = validation.missingItems;

  const relationshipPreviewLabel = selectedRelatedRecord
    ? `${getRelationshipLabel(relationshipType)} → ${selectedRelatedRecord.title}`
    : "No starter relationship selected yet.";

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

  const finalRecord = recordBuild.finalRecord;
  const finalRecordJson = recordBuild.finalRecordJson;

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                  Metadata Create
                </span>

                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Create Record v3
                </h1>

                <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
                  This page builds a record with stronger structure. The goal is
                  not just to name something, but to place it intentionally,
                  describe it meaningfully, and begin connecting it to the rest
                  of the library.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/metadata"
                  className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Back to Library
                </Link>

                <Link
                  href="/metadata/system"
                  className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  View System
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Rule 1
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Content must exist before something becomes a child.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Rule 2
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  A child becomes a father only when it has children.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Rule 3
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Depth is earned, not assumed.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Rule 4
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  The interface must stay clean even when the system gets deep.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <MetadataCreateForm
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
            onRelationshipTypeChange={setRelationshipType}
            relatedRecordId={relatedRecordId}
            onRelatedRecordChange={setRelatedRecordId}
            shelfOptions={shelfOptions}
            activeShelfDescription={activeShelf?.description ?? ""}
            activeSections={activeSections}
            generatedSlug={generatedSlug}
            relationshipOptions={relationshipOptions}
            requiredReadyCount={requiredReadyCount}
            hasRelationshipStarter={hasRelationshipStarter}
            missingItems={missingItems}
            canContinue={canContinue}
            titleReady={titleReady}
            slugReady={slugReady}
            summaryReady={summaryReady}
            belongsReady={belongsReady}
            activeShelfLabel={activeShelf?.label ?? ""}
            activeSectionLabel={activeSection?.label ?? ""}
          />

          <MetadataCreateSidebar
            activeShelfLabel={activeShelf?.label ?? ""}
            activeSectionLabel={activeSection?.label ?? ""}
            recordType={recordType}
            visibility={visibility}
            title={trimmedTitle}
            generatedSlug={generatedSlug}
            summary={trimmedSummary}
            belongsReason={trimmedBelongsReason}
            relationshipPreviewLabel={relationshipPreviewLabel}
            shelfOptions={shelfOptions}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Final Record Output
              </span>

              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Final Record Output
              </h2>

              <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
                This is the full structured record object generated from the
                current builder state. It includes the metadata record shape,
                starter fields, and relationship structure.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Record ID
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-white/85">
                  {finalRecord.id}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Slug
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-white/85">
                  {finalRecord.slug}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Fields
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  {finalRecord.fields.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Relationships
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  {finalRecord.relationships.length}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  MetadataRecord JSON
                </p>
              </div>

              <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-white/85 md:text-sm">
                {finalRecordJson}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}