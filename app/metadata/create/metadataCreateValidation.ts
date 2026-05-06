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

function hasEnoughWords(value: string, minimumWords: number) {
  return value.split(/\s+/).filter(Boolean).length >= minimumWords;
}

function hasEnoughMeaningfulText(
  value: string,
  minimumCharacters: number,
  minimumWords: number,
) {
  return value.length >= minimumCharacters && hasEnoughWords(value, minimumWords);
}

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
  const summaryReady = hasEnoughMeaningfulText(trimmedSummary, 40, 7);
  const belongsReady = hasEnoughMeaningfulText(trimmedBelongsReason, 24, 5);
  const slugReady = generatedSlug.length >= 3;

  const requiredChecks = [
    titleReady,
    shelfReady,
    sectionReady,
    visibilityReady,
    summaryReady,
    belongsReady,
    slugReady,
  ];

  const requiredReadyCount = requiredChecks.filter(Boolean).length;

  const canContinue = requiredChecks.every(Boolean);

  const hasRelationshipStarter = Boolean(
    hasSelectedRelatedRecord && normalizeText(relationshipType),
  );

  const missingItems = [
    !titleReady ? "Add a real title *" : null,
    !slugReady ? "Create a valid slug from the title *" : null,
    !shelfReady ? "Choose a shelf *" : null,
    !sectionReady ? "Choose a section *" : null,
    !visibilityReady ? "Choose visibility *" : null,
    !summaryReady
      ? "Write a meaningful Description * with at least 7 words"
      : null,
    !belongsReady
      ? "Explain Why this belongs here * with at least 5 words"
      : null,
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