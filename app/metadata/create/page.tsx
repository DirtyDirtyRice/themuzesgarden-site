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
  normalizeText,
  slugify,
} from "./metadataCreateUtils";
import MetadataCreateForm from "./MetadataCreateForm";
import MetadataCreateSidebar from "./MetadataCreateSidebar";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];
type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

type ShelfOption = {
  id: string;
  label: string;
  description: string;
  sections: {
    id: string;
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

  const trimmedTitle = normalizeText(title);
  const trimmedSummary = normalizeText(summary);
  const trimmedBelongsReason = normalizeText(belongsReason);
  const generatedSlug = slugify(title);

  const titleReady = trimmedTitle.length >= 3;
  const shelfReady = Boolean(activeShelf);
  const sectionReady = Boolean(activeSection);
  const visibilityReady = Boolean(visibility);
  const summaryReady = trimmedSummary.length >= 24;
  const belongsReady = trimmedBelongsReason.length >= 20;
  const slugReady = generatedSlug.length >= 3;

  const requiredReadyCount = [
    titleReady,
    shelfReady,
    sectionReady,
    visibilityReady,
    summaryReady,
    belongsReady,
    slugReady,
  ].filter(Boolean).length;

  const canContinue =
    titleReady &&
    shelfReady &&
    sectionReady &&
    visibilityReady &&
    summaryReady &&
    belongsReady &&
    slugReady;

  const hasRelationshipStarter = Boolean(
    selectedRelatedRecord && relationshipType
  );

  const missingItems = [
    !titleReady ? "Add a real title" : null,
    !slugReady ? "Create a valid slug from the title" : null,
    !shelfReady ? "Choose a shelf" : null,
    !sectionReady ? "Choose a section" : null,
    !visibilityReady ? "Choose visibility" : null,
    !summaryReady ? "Write a meaningful explanation" : null,
    !belongsReady ? "Explain why this belongs here" : null,
  ].filter(Boolean) as string[];

  const relationshipPreviewLabel = selectedRelatedRecord
    ? `${getRelationshipLabel(relationshipType)} → ${selectedRelatedRecord.title}`
    : "No starter relationship selected yet.";

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
      </div>
    </main>
  );
}