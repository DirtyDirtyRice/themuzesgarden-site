import {
  RECORD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./metadataCreateConfig";
import MetadataCreateContentSection from "./MetadataCreateContentSection";
import MetadataCreateIdentitySection from "./MetadataCreateIdentitySection";
import MetadataCreatePlacementSection from "./MetadataCreatePlacementSection";
import MetadataCreateRelationshipSection from "./MetadataCreateRelationshipSection";
import MetadataCreateReviewSection from "./MetadataCreateReviewSection";

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

type RelationshipOption = {
  id: string;
  title: string;
  slug: string;
};

export default function MetadataCreateForm({
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
}: {
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
  activeSections: { id: string; label: string }[];
  generatedSlug: string;
  relationshipOptions: RelationshipOption[];
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
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
          Guided Builder
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Record Setup</h2>
      </div>

      <div className="flex flex-col gap-5">
        <MetadataCreateIdentitySection
          recordType={recordType}
          onRecordTypeChange={onRecordTypeChange}
          title={title}
          onTitleChange={onTitleChange}
          titleReady={titleReady}
          visibility={visibility}
          onVisibilityChange={onVisibilityChange}
          generatedSlug={generatedSlug}
          slugReady={slugReady}
        />

        <MetadataCreatePlacementSection
          selectedShelfId={selectedShelfId}
          onShelfChange={onShelfChange}
          selectedSectionId={selectedSectionId}
          onSectionChange={onSectionChange}
          shelfOptions={shelfOptions}
          activeShelfDescription={activeShelfDescription}
          activeSections={activeSections}
          belongsReason={belongsReason}
          onBelongsReasonChange={onBelongsReasonChange}
          belongsReady={belongsReady}
        />

        <MetadataCreateContentSection
          summary={summary}
          onSummaryChange={onSummaryChange}
          summaryReady={summaryReady}
        />

        <MetadataCreateRelationshipSection
          relationshipType={relationshipType}
          onRelationshipTypeChange={onRelationshipTypeChange}
          relatedRecordId={relatedRecordId}
          onRelatedRecordChange={onRelatedRecordChange}
          relationshipOptions={relationshipOptions}
        />

        <MetadataCreateReviewSection
          requiredReadyCount={requiredReadyCount}
          hasRelationshipStarter={hasRelationshipStarter}
          missingItems={missingItems}
          canContinue={canContinue}
          recordType={recordType}
          activeShelfLabel={activeShelfLabel}
          activeSectionLabel={activeSectionLabel}
          visibility={visibility}
          generatedSlug={generatedSlug}
        />
      </div>
    </article>
  );
}