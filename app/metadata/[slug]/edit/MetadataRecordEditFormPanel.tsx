"use client";

import { useState } from "react";

import { VISIBILITY_OPTIONS } from "@/app/metadata/create/metadataCreateConfig";
import MetadataCreateForm from "@/app/metadata/create/MetadataCreateForm";
import MetadataCreateSidebar from "@/app/metadata/create/MetadataCreateSidebar";
import type {
  MetadataSectionKey,
  MetadataShelfKey,
} from "@/lib/metadata/metadataLibraryTypes";
import type {
  RecordTypeOption,
  RelationshipType,
} from "./metadataEditHelpers";
import type { RecordSummaryOption } from "./metadataEditRelationshipOptions";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
type InnerPanelKey = "fields" | "preview";

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

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  selectedShelfId: string;
  onShelfChange: (value: string) => void;
  selectedSectionId: string;
  onSectionChange: (value: string) => void;
  recordType: RecordTypeOption;
  onRecordTypeChange: (value: RecordTypeOption) => void;
  visibility: VisibilityOption;
  onVisibilityChange: (value: VisibilityOption) => void;
  summary: string;
  onSummaryChange: (value: string) => void;
  belongsReason: string;
  onBelongsReasonChange: (value: string) => void;
  relationshipType: RelationshipType;
  onRelationshipTypeChange: (value: RelationshipType) => void;
  relatedRecordId: string;
  onRelatedRecordChange: (value: string) => void;
  shelfOptions: ShelfOption[];
  activeShelfDescription: string;
  activeSections: ShelfOption["sections"];
  generatedSlug: string;
  relationshipOptions: RecordSummaryOption[];
  requiredReadyCount: number;
  hasRelationshipStarter: boolean;
  missingItems: string[];
  canContinue: boolean;
  titleReady: boolean;
  slugReady: boolean;
  summaryReady: boolean;
  belongsReady: boolean;
  activeShelfLabel: string;
  activeSectionLabel: string;
  trimmedTitle: string;
  trimmedSummary: string;
  trimmedBelongsReason: string;
  relationshipPreviewLabel: string;
};

const INNER_PANELS: {
  key: InnerPanelKey;
  title: string;
  description: string;
}[] = [
  {
    key: "fields",
    title: "Edit Fields",
    description: "Work on the record title, placement, summary, and relationship.",
  },
  {
    key: "preview",
    title: "Live Preview",
    description: "Check the current record details before moving to update.",
  },
];

export default function MetadataRecordEditFormPanel({
  title,
  onTitleChange,
  selectedShelfId,
  onShelfChange,
  selectedSectionId,
  onSectionChange,
  recordType,
  onRecordTypeChange,
  visibility,
  onVisibilityChange,
  summary,
  onSummaryChange,
  belongsReason,
  onBelongsReasonChange,
  relationshipType,
  onRelationshipTypeChange,
  relatedRecordId,
  onRelatedRecordChange,
  shelfOptions,
  activeShelfDescription,
  activeSections,
  generatedSlug,
  relationshipOptions,
  requiredReadyCount,
  hasRelationshipStarter,
  missingItems,
  canContinue,
  titleReady,
  slugReady,
  summaryReady,
  belongsReady,
  activeShelfLabel,
  activeSectionLabel,
  trimmedTitle,
  trimmedSummary,
  trimmedBelongsReason,
  relationshipPreviewLabel,
}: Props) {
  const [activeInnerPanel, setActiveInnerPanel] =
    useState<InnerPanelKey>("fields");

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
          Form Workspace
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Choose What To Work On
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
          This keeps the edit form from feeling like one long page. Use the
          buttons below to switch between editing fields and checking the preview.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {INNER_PANELS.map((panel) => {
            const isActive = panel.key === activeInnerPanel;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => setActiveInnerPanel(panel.key)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "scale-[1.01] border-white bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.6)]"
                    : "border-white/10 bg-black/40 text-white hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <span
                  className={[
                    "block text-base font-semibold",
                    isActive ? "text-black" : "text-white",
                  ].join(" ")}
                >
                  {panel.title}
                </span>

                <span
                  className={[
                    "mt-2 block text-sm leading-6",
                    isActive ? "text-black/75" : "text-white/70",
                  ].join(" ")}
                >
                  {panel.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeInnerPanel === "fields" ? (
        <MetadataCreateForm
          title={title}
          onTitleChange={onTitleChange}
          selectedShelfId={selectedShelfId}
          onShelfChange={onShelfChange}
          selectedSectionId={selectedSectionId}
          onSectionChange={onSectionChange}
          recordType={recordType}
          onRecordTypeChange={onRecordTypeChange}
          visibility={visibility}
          onVisibilityChange={onVisibilityChange}
          summary={summary}
          onSummaryChange={onSummaryChange}
          belongsReason={belongsReason}
          onBelongsReasonChange={onBelongsReasonChange}
          relationshipType={relationshipType}
          onRelationshipTypeChange={onRelationshipTypeChange}
          relatedRecordId={relatedRecordId}
          onRelatedRecordChange={onRelatedRecordChange}
          shelfOptions={shelfOptions}
          activeShelfDescription={activeShelfDescription}
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
          activeShelfLabel={activeShelfLabel}
          activeSectionLabel={activeSectionLabel}
        />
      ) : null}

      {activeInnerPanel === "preview" ? (
        <MetadataCreateSidebar
          activeShelfLabel={activeShelfLabel}
          activeSectionLabel={activeSectionLabel}
          recordType={recordType}
          visibility={visibility}
          title={trimmedTitle}
          generatedSlug={generatedSlug}
          summary={trimmedSummary}
          belongsReason={trimmedBelongsReason}
          relationshipPreviewLabel={relationshipPreviewLabel}
          shelfOptions={shelfOptions}
        />
      ) : null}
    </section>
  );
}