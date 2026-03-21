"use client";

import MomentInspectorActionPanel from "./MomentInspectorActionPanel";
import MomentInspectorActionSummaryPanel from "./MomentInspectorActionSummaryPanel";
import MomentInspectorDriftPanel from "./MomentInspectorDriftPanel";
import MomentInspectorDriftSummaryPanel from "./MomentInspectorDriftSummaryPanel";
import MomentInspectorRepairFocusPanel from "./MomentInspectorRepairFocusPanel";
import MomentInspectorRepairQueuePanel from "./MomentInspectorRepairQueuePanel";
import MomentInspectorRepeatPlanPanel from "./MomentInspectorRepeatPlanPanel";
import MomentInspectorRepeatSummaryPanel from "./MomentInspectorRepeatSummaryPanel";
import MomentInspectorStabilityPanel from "./MomentInspectorStabilityPanel";
import MomentInspectorStabilitySummaryPanel from "./MomentInspectorStabilitySummaryPanel";
import { buildInspectorIntendedActionView } from "./momentInspectorIntendedActionView";
import { buildInspectorIntendedRepeatView } from "./momentInspectorIntendedRepeatView";
import { buildInspectorPhraseDriftView } from "./momentInspectorPhraseDriftView";
import { buildInspectorPhraseStabilityView } from "./momentInspectorPhraseStabilityView";
import { buildInspectorRepairQueueView } from "./momentInspectorRepairQueueView";
import { buildMomentInspectorSimilarity } from "./momentInspectorSimilarity";

type SimilarityState = ReturnType<typeof buildMomentInspectorSimilarity>;

export default function MomentInspectorRepairPanels(props: {
  similarityState: SimilarityState;
}) {
  const { similarityState } = props;

  const intendedRepeatView = buildInspectorIntendedRepeatView(
    similarityState.intendedRepeatMetadata.plans
  );

  const intendedActionView = buildInspectorIntendedActionView(
    similarityState.intendedActionResult.plans
  );

  const repairQueueView = buildInspectorRepairQueueView({
    intendedPlans: similarityState.intendedActionResult.plans,
    phraseDriftResult: similarityState.phraseDriftResult,
    phraseStabilityResult: similarityState.phraseStabilityResult,
  });

  const phraseDriftView = buildInspectorPhraseDriftView(
    similarityState.phraseDriftResult
  );

  const phraseStabilityView = buildInspectorPhraseStabilityView(
    similarityState.phraseStabilityResult
  );

  const selectedStableFamilyId = similarityState.stableSelectedFamily?.id ?? "";

  const selectedIntendedPlan = similarityState.selectedIntendedPlan;

  const selectedIntendedPlacements = selectedIntendedPlan
    ? intendedRepeatView.placementsByFamilyId[selectedIntendedPlan.familyId] ?? []
    : [];

  const selectedActionPlan = similarityState.selectedIntendedActionPlan;

  const selectedActionRows = selectedActionPlan
    ? intendedActionView.actionsByFamilyId[selectedActionPlan.familyId] ?? []
    : [];

  const selectedPhraseDriftFamilySource =
    similarityState.selectedPhraseDriftFamily;

  const selectedPhraseDriftFamily = selectedPhraseDriftFamilySource
    ? phraseDriftView.familyRows.find(
        (row) => row.familyId === selectedPhraseDriftFamilySource.familyId
      ) ?? null
    : null;

  const selectedPhraseDriftMembers = selectedPhraseDriftFamilySource
    ? phraseDriftView.membersByFamily[selectedPhraseDriftFamilySource.familyId] ??
      []
    : [];

  const selectedPhraseStabilityFamily =
    similarityState.selectedPhraseStabilityFamily
      ? phraseStabilityView.byFamilyId[
          similarityState.selectedPhraseStabilityFamily.familyId
        ] ?? null
      : null;

  const selectedRepairRow =
    (selectedStableFamilyId
      ? repairQueueView.rows.find(
          (row) => row.familyId === selectedStableFamilyId
        ) ?? null
      : null) ?? repairQueueView.rows[0] ?? null;

  const selectedRepeatSummaryRows = selectedStableFamilyId
    ? intendedRepeatView.summaryRows.filter(
        (row) => row.familyId === selectedStableFamilyId
      )
    : intendedRepeatView.summaryRows;

  const selectedActionSummaryRows = selectedStableFamilyId
    ? intendedActionView.summaryRows.filter(
        (row) => row.familyId === selectedStableFamilyId
      )
    : intendedActionView.summaryRows;

  const selectedDriftSummaryRows = selectedStableFamilyId
    ? phraseDriftView.familyRows.filter(
        (row) => row.familyId === selectedStableFamilyId
      )
    : phraseDriftView.familyRows;

  const selectedStabilitySummaryRows = selectedStableFamilyId
    ? phraseStabilityView.familyRows.filter(
        (row) => row.familyId === selectedStableFamilyId
      )
    : phraseStabilityView.familyRows;

  return (
    <>
      <MomentInspectorStabilityPanel row={selectedPhraseStabilityFamily} />

      <MomentInspectorDriftPanel
        family={selectedPhraseDriftFamily}
        members={selectedPhraseDriftMembers}
      />

      <MomentInspectorRepeatPlanPanel
        row={selectedIntendedPlan}
        placements={selectedIntendedPlacements}
      />

      <MomentInspectorActionPanel
        row={selectedActionPlan}
        actions={selectedActionRows}
      />

      <MomentInspectorRepairFocusPanel row={selectedRepairRow} />

      <MomentInspectorRepairQueuePanel rows={repairQueueView.rows} />

      <MomentInspectorStabilitySummaryPanel rows={selectedStabilitySummaryRows} />

      <MomentInspectorDriftSummaryPanel rows={selectedDriftSummaryRows} />

      <MomentInspectorRepeatSummaryPanel rows={selectedRepeatSummaryRows} />

      <MomentInspectorActionSummaryPanel rows={selectedActionSummaryRows} />
    </>
  );
}
