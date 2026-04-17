import { normalizeText, slugify } from "./metadataCreateUtils";

export type MetadataCreateValidationInput = {
  title: string;
  summary: string;
  belongsReason: string;
  visibility: string;
  hasActiveShelf: boolean;
  hasActiveSection: boolean;
  hasSelectedRelatedRecord: boolean;
  relationshipType: string;
};

export type MetadataCreateValidationResult = {
  trimmedTitle: string;
  trimmedSummary: string;
  trimmedBelongsReason: string;
  generatedSlug: string;
  titleReady: boolean;
  shelfReady: boolean;
  sectionReady: boolean;
  visibilityReady: boolean;
  summaryReady: boolean;
  belongsReady: boolean;
  slugReady: boolean;
  requiredReadyCount: number;
  canContinue: boolean;
  hasRelationshipStarter: boolean;
  missingItems: string[];
};

export function validateMetadataCreateState({
  title,
  summary,
  belongsReason,
  visibility,
  hasActiveShelf,
  hasActiveSection,
  hasSelectedRelatedRecord,
  relationshipType,
}: MetadataCreateValidationInput): MetadataCreateValidationResult {
  const trimmedTitle = normalizeText(title);
  const trimmedSummary = normalizeText(summary);
  const trimmedBelongsReason = normalizeText(belongsReason);
  const generatedSlug = slugify(title);

  const titleReady = trimmedTitle.length >= 3;
  const shelfReady = Boolean(hasActiveShelf);
  const sectionReady = Boolean(hasActiveSection);
  const visibilityReady = Boolean(normalizeText(visibility));
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
    hasSelectedRelatedRecord && normalizeText(relationshipType)
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

  return {
    trimmedTitle,
    trimmedSummary,
    trimmedBelongsReason,
    generatedSlug,
    titleReady,
    shelfReady,
    sectionReady,
    visibilityReady,
    summaryReady,
    belongsReady,
    slugReady,
    requiredReadyCount,
    canContinue,
    hasRelationshipStarter,
    missingItems,
  };
}