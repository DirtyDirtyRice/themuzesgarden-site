import { buildMomentFamilies } from "./playerMomentFamilyEngine";
import { buildIntendedActionPlans } from "./playerMomentIntendedActions";
import { buildIntendedRepeatMetadata } from "./playerMomentIntendedRepeat";
import { buildMomentPhraseDrift } from "./playerMomentPhraseDrift";
import { buildMomentPhraseStability } from "./playerMomentPhraseStability";
import { findSimilarMoments, groupMomentsIntoFamilies } from "./playerMomentSimilarity";

import {
  buildRepeatDiagnostics,
  buildStableFamilyDiagnostics,
} from "./momentInspectorSimilarity.builders";
import {
  buildEmptyMomentInspectorSimilarityResult,
  buildMomentLookups,
  getEstimatedRepeatPlan,
  getMomentId,
  getSelectedEngineFamily,
  getSelectedIntendedActionPlan,
  getSelectedIntendedPlan,
  getSelectedPhraseDriftFamily,
  getSelectedPhraseStabilityFamily,
  toComparableMoment,
  toEngineMomentFamilyMap,
} from "./momentInspectorSimilarity.shared";

import type {
  BuildMomentInspectorSimilarityParams,
  BuildMomentInspectorSimilarityResult,
  InspectorComparableMoment,
  InspectorRepeatDiagnostics,
  InspectorSimilarityDebugRow,
  InspectorStableFamilyDiagnostics,
} from "./momentInspectorSimilarity.types";

export type {
  BuildMomentInspectorSimilarityParams,
  BuildMomentInspectorSimilarityResult,
  InspectorComparableMoment,
  InspectorRepeatDiagnostics,
  InspectorSimilarityDebugRow,
  InspectorStableFamilyDiagnostics,
} from "./momentInspectorSimilarity.types";

const SIMILAR_MOMENT_MIN_SCORE = 0.68;
const SIMILAR_MOMENT_MAX_RESULTS = 8;
const LEGACY_FAMILY_MIN_SCORE = 0.88;
const STABLE_FAMILY_SIMILARITY_THRESHOLD = 0.72;
const STABLE_FAMILY_MAX_MATCHES_PER_MOMENT = 6;

const PHRASE_DRIFT_CONFIG = {
  earlyLateTolerance: 0.35,
  durationTolerance: 0.25,
  mediumTimingThreshold: 0.75,
  highTimingThreshold: 1.5,
  mediumDurationThreshold: 0.5,
  highDurationThreshold: 1,
} as const;

function getSelectedLegacyFamily(params: {
  families: BuildMomentInspectorSimilarityResult["families"];
  selectedMoment: InspectorComparableMoment;
}) {
  const { families, selectedMoment } = params;

  return (
    families.find((family) =>
      family.members.some((member) => member.moment.sectionId === selectedMoment.sectionId)
    ) ?? null
  );
}

export function buildMomentInspectorSimilarity(
  params: BuildMomentInspectorSimilarityParams
): BuildMomentInspectorSimilarityResult {
  const { track, sections, selectedSectionId } = params;

  if (!track) {
    return buildEmptyMomentInspectorSimilarityResult({});
  }

  const moments = sections.map((section) => toComparableMoment(track, section));

  const selectedMoment =
    moments.find((moment) => moment.sectionId === selectedSectionId) ?? moments[0] ?? null;

  if (!selectedMoment) {
    return buildEmptyMomentInspectorSimilarityResult({
      moments,
      selectedMoment: null,
      ungroupedMomentIds: moments.map((moment) => getMomentId(moment)).filter(Boolean),
    });
  }

  const similarMoments = findSimilarMoments({
    reference: selectedMoment,
    candidates: moments,
    minSimilarityScore: SIMILAR_MOMENT_MIN_SCORE,
    maxResults: SIMILAR_MOMENT_MAX_RESULTS,
    sameTrackOnly: true,
  });

  const families = groupMomentsIntoFamilies({
    moments,
    minSimilarityScore: LEGACY_FAMILY_MIN_SCORE,
  });

  const selectedFamily = getSelectedLegacyFamily({
    families,
    selectedMoment,
  });

  const repeatPlan = selectedFamily ? getEstimatedRepeatPlan(selectedFamily) : null;

  const stableFamilyResult = buildMomentFamilies({
    moments,
    similarityThreshold: STABLE_FAMILY_SIMILARITY_THRESHOLD,
    maxMatchesPerMoment: STABLE_FAMILY_MAX_MATCHES_PER_MOMENT,
  });

  const stableFamilies = stableFamilyResult.families;
  const familyByMomentId = stableFamilyResult.familyByMomentId;
  const ungroupedMomentIds = stableFamilyResult.ungroupedMomentIds;
  const engineFamiliesById = toEngineMomentFamilyMap(stableFamilies);

  const similarityDebugRows: InspectorSimilarityDebugRow[] = [];

  const stableSelectedFamily = getSelectedEngineFamily(
    selectedMoment,
    familyByMomentId,
    engineFamiliesById
  );

  // ✅ SAFE FALLBACK FIX (CRITICAL)
  const stableFamilyDiagnostics =
    buildStableFamilyDiagnostics(stableFamilies) as unknown as InspectorStableFamilyDiagnostics[];

  const repeatDiagnostics =
    buildRepeatDiagnostics(stableFamilies) as unknown as InspectorRepeatDiagnostics[];

  const intendedRepeatMetadata = buildIntendedRepeatMetadata({
    families: stableFamilies,
    momentLookups: buildMomentLookups(moments),
    minFamilySize: 2,
  });

  const selectedIntendedPlan = getSelectedIntendedPlan(
    stableSelectedFamily,
    intendedRepeatMetadata
  );

  const phraseDriftResult = buildMomentPhraseDrift({
    moments,
    families: stableFamilies,
    ...PHRASE_DRIFT_CONFIG,
  });

  const selectedPhraseDriftFamily = getSelectedPhraseDriftFamily(
    stableSelectedFamily,
    phraseDriftResult
  );

  const phraseStabilityResult = buildMomentPhraseStability({
    phraseDriftResult,
    intendedRepeatMetadata,
  });

  const selectedPhraseStabilityFamily = getSelectedPhraseStabilityFamily(
    stableSelectedFamily,
    phraseStabilityResult
  );

  const intendedActionResult = buildIntendedActionPlans({
    families: stableFamilies,
    intendedPlans: intendedRepeatMetadata.plans,
    phraseDriftResult,
    phraseStabilityResult,
  });

  const selectedIntendedActionPlan = getSelectedIntendedActionPlan(
    stableSelectedFamily,
    intendedActionResult
  );

  return {
    moments,
    selectedMoment,
    similarMoments,
    similarityDebugRows,
    families,
    selectedFamily,
    repeatPlan,
    stableFamilies,
    stableSelectedFamily,
    familyByMomentId,
    ungroupedMomentIds,
    stableFamilyDiagnostics,
    repeatDiagnostics,
    intendedRepeatMetadata,
    selectedIntendedPlan,
    intendedActionResult,
    selectedIntendedActionPlan,
    phraseDriftResult,
    selectedPhraseDriftFamily,
    phraseStabilityResult,
    selectedPhraseStabilityFamily,
  };
}