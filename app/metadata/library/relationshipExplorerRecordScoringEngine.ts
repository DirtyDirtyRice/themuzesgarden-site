import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import type { RelatedRecordSignal } from "./relationshipExplorerTypes";
import {
  getTitleWords,
  getPreviewText,
  getRecordSlug,
  getSharedWords,
  getWordMatches,
  cleanComparableText,
} from "./relationshipExplorerRecordTextEngine";

type SignalWeightKey =
  | "shelf"
  | "section"
  | "title"
  | "preview"
  | "slug"
  | "visibility"
  | "sharedWords";

const WEIGHTS: Record<SignalWeightKey, number> = {
  shelf: 35,
  section: 35,
  title: 18,
  preview: 12,
  slug: 10,
  visibility: 5,
  sharedWords: 2,
};

export function getRelationshipScore(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
) {
  const shelfMatch = candidate.shelf === active.shelf;
  const sectionMatch = candidate.section === active.section;
  const visibilityMatch = candidate.visibility === active.visibility;

  const titleWords = getTitleWords(active);
  const titleText = cleanComparableText(candidate.title);
  const previewText = cleanComparableText(getPreviewText(candidate));
  const slugText = cleanComparableText(getRecordSlug(candidate));

  const titleMatches = getWordMatches(titleWords, titleText);
  const previewMatches = getWordMatches(titleWords, previewText);
  const slugMatches = getWordMatches(titleWords, slugText);

  const shared = getSharedWords(active, candidate);

  const scoreParts = {
    shelf: shelfMatch ? WEIGHTS.shelf : 0,
    section: sectionMatch ? WEIGHTS.section : 0,
    title: Math.min(titleMatches.length * 8, WEIGHTS.title),
    preview: Math.min(previewMatches.length * 4, WEIGHTS.preview),
    slug: Math.min(slugMatches.length * 5, WEIGHTS.slug),
    visibility: visibilityMatch ? WEIGHTS.visibility : 0,
    sharedWords: Math.min(shared.length * WEIGHTS.sharedWords, 10),
  };

  const score = Object.values(scoreParts).reduce((a, b) => a + b, 0);

  return { score, scoreParts };
}

export function scoreRelatedRecord(
  active: MetadataLibraryRecordSummary,
  candidate: MetadataLibraryRecordSummary
): RelatedRecordSignal {
  const { score, scoreParts } = getRelationshipScore(active, candidate);

  return {
    record: candidate,
    shelfMatch: scoreParts.shelf > 0,
    sectionMatch: scoreParts.section > 0,
    titleMatch:
      scoreParts.title > 0 ||
      scoreParts.preview > 0 ||
      scoreParts.slug > 0,
    score,
    reason: "scored",
  };
}