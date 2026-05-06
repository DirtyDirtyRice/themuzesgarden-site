import { formatLabel } from "./metadataLibraryHelpers";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";
import {
  getRelationshipLayerLabel,
  labelRelationshipSource,
  labelRelationshipStrength,
} from "./MetadataLibraryRelationshipSignals";
import type {
  MetadataRelationshipInsightSummary,
  MetadataRelationshipLayerKey,
  MetadataRelationshipScore,
  MetadataRelationshipSource,
  MetadataRelationshipStrength,
} from "./MetadataLibraryRelationshipIntelligenceTypes";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildRelationshipScore(params: {
  record: MetadataLibraryRecordSummary;
  openRecord: MetadataLibraryRecordSummary;
  strength: MetadataRelationshipStrength;
  source: MetadataRelationshipSource;
  activeQuery: string;
}): MetadataRelationshipScore {
  const { record, openRecord, strength, source, activeQuery } = params;
  const sameShelf = record.shelf === openRecord.shelf;
  const sameSection = record.section === openRecord.section;
  const sameVisibility = record.visibility === openRecord.visibility;
  const query = activeQuery.trim().toLowerCase();

  const titleMatchesQuery =
    query.length > 0 && record.title.toLowerCase().includes(query);
  const excerptMatchesQuery =
    query.length > 0 &&
    Boolean(record.excerpt?.toLowerCase().includes(query));

  const structureScore = clampScore(
    (sameShelf ? 35 : 0) +
      (sameSection ? 35 : 0) +
      (sameVisibility ? 10 : 0) +
      (source === "section" ? 8 : 5) +
      (strength === "strong" ? 12 : strength === "medium" ? 7 : 3),
  );

  const meaningScore = clampScore(
    30 +
      (sameSection ? 20 : 0) +
      (titleMatchesQuery ? 18 : 0) +
      (excerptMatchesQuery ? 12 : 0) +
      (record.excerpt ? 8 : 0),
  );

  const usageScore = clampScore(
    25 +
      (sameVisibility ? 18 : 0) +
      (sameShelf ? 15 : 0) +
      (source === "shelf" ? 10 : 6) +
      (record.excerpt ? 6 : 0),
  );

  const confidenceScore = clampScore(
    structureScore * 0.55 + meaningScore * 0.25 + usageScore * 0.2,
  );

  const meaningPotential =
    meaningScore >= 70
      ? "High meaning potential"
      : meaningScore >= 50
        ? "Moderate meaning potential"
        : "Low meaning signal";

  const usagePotential =
    usageScore >= 70
      ? "High usage potential"
      : usageScore >= 50
        ? "Moderate usage potential"
        : "Low usage signal";

  const crossLayerHint =
    structureScore >= 70 && meaningScore >= 60
      ? "Strong structure + meaning signal → high future meaning match."
      : structureScore >= 60 && usageScore >= 60
        ? "Solid structure + usage signal → likely workflow relevance."
        : meaningScore >= 60 || usageScore >= 60
          ? "Useful cross-layer signal. Worth keeping in view."
          : "Early cross-layer signal. Useful as supporting context.";

  const confidenceLabel =
    confidenceScore >= 80
      ? "High Confidence"
      : confidenceScore >= 60
        ? "Good Confidence"
        : confidenceScore >= 40
          ? "Useful Signal"
          : "Early Signal";

  const confidenceDetail = `${formatLabel(
    record.title,
  )} scores ${confidenceScore}/100 because it carries ${labelRelationshipStrength(
    strength,
  ).toLowerCase()} structure with ${labelRelationshipSource(
    source,
  ).toLowerCase()} context. Meaning potential: ${meaningPotential}. Usage potential: ${usagePotential}.`;

  const whyItMatters =
    confidenceScore >= 80
      ? "This is a strong candidate for future meaning and usage matching because the structure already lines up cleanly."
      : confidenceScore >= 60
        ? "This is worth reviewing because it shares enough structure to become useful when meaning fields are added."
        : confidenceScore >= 40
          ? "This may be useful as a supporting relationship, especially after more metadata is added."
          : "This is an early relationship signal that should stay visible but lower priority.";

  return {
    structureScore,
    meaningScore,
    usageScore,
    confidenceScore,
    confidenceLabel,
    confidenceDetail,
    whyItMatters,
    meaningPotential,
    usagePotential,
    crossLayerHint,
  };
}

export function compareRelationshipScores(
  first: MetadataRelationshipScore,
  second: MetadataRelationshipScore,
) {
  if (second.confidenceScore !== first.confidenceScore) {
    return second.confidenceScore - first.confidenceScore;
  }

  if (second.structureScore !== first.structureScore) {
    return second.structureScore - first.structureScore;
  }

  if (second.meaningScore !== first.meaningScore) {
    return second.meaningScore - first.meaningScore;
  }

  return second.usageScore - first.usageScore;
}

export function buildReasonSnapshot(params: {
  record: MetadataLibraryRecordSummary;
  score: MetadataRelationshipScore;
  layer: MetadataRelationshipLayerKey;
}) {
  const { record, score, layer } = params;

  return `${formatLabel(record.title)} was opened from the ${getRelationshipLayerLabel(
    layer,
  )} layer with ${score.confidenceLabel.toLowerCase()} at ${score.confidenceScore}/100. ${score.crossLayerHint}`;
}

export function buildRelationshipInsightSummary(params: {
  records: {
    record: MetadataLibraryRecordSummary;
    score: MetadataRelationshipScore;
  }[];
}): MetadataRelationshipInsightSummary | null {
  const { records } = params;

  if (records.length === 0) return null;

  const sorted = [...records].sort((first, second) =>
    compareRelationshipScores(first.score, second.score),
  );

  const top = sorted[0];
  const scores = sorted.map((item) => item.score.confidenceScore);
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  const recommendation =
    max >= 80
      ? "Start with the top result. It is a strong candidate for meaning and usage expansion."
      : max >= 60
        ? "Review the top 2–3 results. They may become strong matches once meaning fields are added."
        : "Scan broadly. These are early signals and should be explored lightly.";

  return {
    topTitle: formatLabel(top.record.title),
    topScore: top.score.confidenceScore,
    scoreRange: `${min}–${max}`,
    recommendation,
  };
}