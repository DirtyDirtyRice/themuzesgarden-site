import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  IntendedRepeatFamilyPlan,
  IntendedRepeatPlacement,
} from "./playerMomentIntendedRepeat";
import type { PhraseDriftEngineResult } from "./playerMomentPhraseDrift";
import type { PhraseStabilityEngineResult } from "./playerMomentPhraseStability";

export type IntendedActionType =
  | "fill-missing-occurrence"
  | "tighten-near-occurrence"
  | "reuse-anchor-phrase"
  | "reuse-best-family-member";

export type IntendedActionCandidate = {
  familyId: string;
  actionType: IntendedActionType;
  targetExpectedAt: number;
  sourceMomentId: string | null;
  anchorMomentId: string | null;
  nearestMomentId: string | null;
  status: "present" | "near" | "missing";
  confidence: number;
  reason: string;
};

export type IntendedActionPlan = {
  familyId: string;
  actions: IntendedActionCandidate[];
};

export type IntendedActionResult = {
  plans: IntendedActionPlan[];
  actionsByFamilyId: Record<string, IntendedActionCandidate[]>;
};

type FamilyMemberLike = {
  momentId: string;
  similarityToAnchor: number;
};

type ScoredReusableMember = {
  momentId: string;
  similarityToAnchor: number;
  confidenceScore: number;
  driftSeverity: string;
};

function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clamp100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function round3(value: number): number {
  return Number(value.toFixed(3));
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toSafeTime(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(3));
}

function getFamilyMembers(family: MomentFamilyEngineFamily): FamilyMemberLike[] {
  return Array.isArray(family.members) ? (family.members as FamilyMemberLike[]) : [];
}

function getMemberSeverityPenalty(severity: string): number {
  if (severity === "high") return 0.2;
  if (severity === "medium") return 0.1;
  if (severity === "low") return 0.04;
  return 0;
}

function compareReusableMembers(
  a: ScoredReusableMember,
  b: ScoredReusableMember
): number {
  const aScore =
    a.similarityToAnchor * 0.65 +
    a.confidenceScore * 0.35 -
    getMemberSeverityPenalty(a.driftSeverity);

  const bScore =
    b.similarityToAnchor * 0.65 +
    b.confidenceScore * 0.35 -
    getMemberSeverityPenalty(b.driftSeverity);

  if (bScore !== aScore) return bScore - aScore;
  return a.momentId.localeCompare(b.momentId);
}

function getBestReusableMemberId(family: MomentFamilyEngineFamily): string | null {
  const anchorMomentId = normalizeText(family.anchorMomentId) || null;
  const members = getFamilyMembers(family);

  if (!members.length) return anchorMomentId;

  const sorted = [...members].sort((a, b) => {
    const aa = clamp01(a.similarityToAnchor);
    const bb = clamp01(b.similarityToAnchor);

    if (bb !== aa) return bb - aa;
    return normalizeText(a.momentId).localeCompare(normalizeText(b.momentId));
  });

  return normalizeText(sorted[0]?.momentId) || anchorMomentId;
}

function getReusableMemberIdForFamily(params: {
  family: MomentFamilyEngineFamily;
  phraseDriftResult?: PhraseDriftEngineResult | null;
}): string | null {
  const familyId = normalizeText(params.family.id);
  const driftFamily = (params.phraseDriftResult?.byFamilyId?.[familyId] as any) ?? null;
  const anchorMomentId = normalizeText(params.family.anchorMomentId) || null;

  const scoredMembers: ScoredReusableMember[] = getFamilyMembers(params.family)
    .map((member) => {
      const momentId = normalizeText(member.momentId);
      const driftMembers = Array.isArray(driftFamily?.members) ? driftFamily.members : [];
      const driftRow = driftMembers.find(
        (row: any) => normalizeText(row?.momentId) === momentId
      );

      return {
        momentId,
        similarityToAnchor: clamp01(member.similarityToAnchor),
        confidenceScore: clamp01((driftRow as any)?.confidenceScore ?? 0.7),
        driftSeverity: normalizeText((driftRow as any)?.driftSeverity),
      };
    })
    .filter((member) => member.momentId);

  if (!scoredMembers.length) {
    return anchorMomentId;
  }

  scoredMembers.sort(compareReusableMembers);

  return (
    scoredMembers[0]?.momentId ||
    anchorMomentId ||
    getBestReusableMemberId(params.family)
  );
}

function getSeverityBoost(severity: string | null | undefined): number {
  if (severity === "high") return 0.16;
  if (severity === "medium") return 0.1;
  if (severity === "low") return 0.04;
  return 0;
}

function getStatusWeight(status: "present" | "near" | "missing"): number {
  if (status === "missing") return 0.22;
  if (status === "near") return 0.1;
  return -0.1;
}

function getDeltaPenalty(deltaFromExpected: number | null | undefined): number {
  const delta = Math.abs(Number(deltaFromExpected ?? 0));
  if (!Number.isFinite(delta) || delta <= 0) return 0;
  if (delta >= 2) return 0.16;
  if (delta >= 1) return 0.1;
  if (delta >= 0.5) return 0.05;
  return 0.02;
}

function getStabilityBoost(stabilityScore: number | null): number {
  if (stabilityScore === null) return 0;
  if (stabilityScore < 40) return 0.2;
  if (stabilityScore < 55) return 0.14;
  if (stabilityScore < 70) return 0.08;
  if (stabilityScore < 85) return 0.03;
  return -0.04;
}

function getCoveragePenalty(intendedPlan: IntendedRepeatFamilyPlan): number {
  const total =
    Number(intendedPlan.presentCount ?? 0) +
    Number(intendedPlan.nearCount ?? 0) +
    Number(intendedPlan.missingCount ?? 0);

  if (!Number.isFinite(total) || total <= 0) return 0;

  const missingRatio = Number(intendedPlan.missingCount ?? 0) / total;
  const nearRatio = Number(intendedPlan.nearCount ?? 0) / total;

  return round3(missingRatio * 0.18 + nearRatio * 0.08);
}

function getStabilityPenalty(stabilityScore: number | null): number {
  if (stabilityScore === null) return 0;
  if (stabilityScore < 40) return 0;
  if (stabilityScore < 55) return 0.02;
  if (stabilityScore < 70) return 0.05;
  if (stabilityScore < 85) return 0.08;
  return 0.12;
}

function getSourceQualityBoost(params: {
  sourceMomentId: string | null;
  anchorMomentId: string | null;
  nearestMomentId: string | null;
  status: "present" | "near" | "missing";
}): number {
  const { sourceMomentId, anchorMomentId, nearestMomentId, status } = params;

  if (!sourceMomentId) return -0.08;

  if (status === "missing" && sourceMomentId === anchorMomentId) return 0.04;
  if (status === "missing" && sourceMomentId !== anchorMomentId) return 0.08;

  if (status === "near" && sourceMomentId === nearestMomentId) return 0.1;
  if (status === "present" && sourceMomentId === nearestMomentId) return 0.06;

  return 0.02;
}

function buildReason(params: {
  status: "present" | "near" | "missing";
  actionType: IntendedActionType;
  sourceMomentId: string | null;
  deltaFromExpected: number | null;
  highestDriftSeverity: string | null;
  stabilityScore: number | null;
  stabilityLabel: string | null;
  missingCount: number;
  nearCount: number;
}): string {
  const {
    status,
    actionType,
    sourceMomentId,
    deltaFromExpected,
    highestDriftSeverity,
    stabilityScore,
    stabilityLabel,
    missingCount,
    nearCount,
  } = params;

  const stabilityText =
    stabilityScore === null
      ? "stability unknown"
      : `stability ${Math.round(stabilityScore)}%${
          stabilityLabel ? ` (${stabilityLabel})` : ""
        }`;

  const driftText = highestDriftSeverity
    ? `drift ${highestDriftSeverity}`
    : "drift none";

  if (status === "missing") {
    if (actionType === "reuse-anchor-phrase") {
      return `Missing expected occurrence. Reuse anchor phrase. ${stabilityText}; ${driftText}; missing ${missingCount}; near ${nearCount}.`;
    }

    return sourceMomentId
      ? `Missing expected occurrence. Reuse strongest family member ${sourceMomentId}. ${stabilityText}; ${driftText}; missing ${missingCount}; near ${nearCount}.`
      : `Missing expected occurrence. Rebuild from family phrase material. ${stabilityText}; ${driftText}; missing ${missingCount}; near ${nearCount}.`;
  }

  if (status === "near") {
    return deltaFromExpected !== null
      ? `Near occurrence detected ${deltaFromExpected.toFixed(2)} seconds from expected position. Tighten placement using the nearest phrase reference. ${stabilityText}; ${driftText}; missing ${missingCount}; near ${nearCount}.`
      : `Near occurrence detected and should be tightened around the expected position. ${stabilityText}; ${driftText}; missing ${missingCount}; near ${nearCount}.`;
  }

  return `Occurrence already present. Keep best reusable family material available for alignment or reinforcement. ${stabilityText}; ${driftText}; missing ${missingCount}; near ${nearCount}.`;
}

function buildActionType(params: {
  status: "present" | "near" | "missing";
  sourceMomentId: string | null;
  anchorMomentId: string | null;
}): IntendedActionType {
  const { status, sourceMomentId, anchorMomentId } = params;

  if (status === "near") return "tighten-near-occurrence";
  if (status === "present") return "reuse-best-family-member";

  if (sourceMomentId && anchorMomentId && sourceMomentId === anchorMomentId) {
    return "reuse-anchor-phrase";
  }

  return "fill-missing-occurrence";
}

function buildActionForPlacement(params: {
  family: MomentFamilyEngineFamily;
  intendedPlan: IntendedRepeatFamilyPlan;
  placement: IntendedRepeatPlacement;
  phraseDriftResult?: PhraseDriftEngineResult | null;
  phraseStabilityResult?: PhraseStabilityEngineResult | null;
}): IntendedActionCandidate | null {
  const {
    family,
    intendedPlan,
    placement,
    phraseDriftResult,
    phraseStabilityResult,
  } = params;

  const familyId = normalizeText(family.id);
  if (!familyId) return null;

  const status = placement.status;
  if (status !== "missing" && status !== "near" && status !== "present") {
    return null;
  }

  const anchorMomentId = normalizeText(family.anchorMomentId) || null;
  const nearestMomentId = normalizeText(placement.nearestMomentId) || null;
  const bestReusableMemberId = getReusableMemberIdForFamily({
    family,
    phraseDriftResult,
  });

  const driftFamily = (phraseDriftResult?.byFamilyId?.[familyId] as any) ?? null;
  const stabilityFamily = (phraseStabilityResult?.byFamilyId?.[familyId] as any) ?? null;

  const stabilityScore =
    stabilityFamily != null ? clamp100(stabilityFamily.stabilityScore) : null;

  const stabilityLabel =
    normalizeText(
      stabilityFamily?.stabilityLabel ?? stabilityFamily?.label
    ) || null;

  const highestDriftSeverity =
    normalizeText(driftFamily?.highestSeverity ?? driftFamily?.highestDriftSeverity) ||
    null;

  const placementConfidence = clamp01(placement.confidence);
  const strongestScore = clamp01(family.strongestScore);
  const averageScore = clamp01(family.averageScore);

  const baseConfidence =
    placementConfidence * 0.38 +
    strongestScore * 0.34 +
    averageScore * 0.28;

  const sourceMomentId =
    status === "near" || status === "present"
      ? nearestMomentId || bestReusableMemberId
      : bestReusableMemberId;

  const actionType = buildActionType({
    status,
    sourceMomentId,
    anchorMomentId,
  });

  const confidenceAdjusted =
    baseConfidence +
    getStatusWeight(status) +
    getSeverityBoost(highestDriftSeverity) +
    getStabilityBoost(stabilityScore) +
    getSourceQualityBoost({
      sourceMomentId,
      anchorMomentId,
      nearestMomentId,
      status,
    }) -
    getDeltaPenalty(placement.deltaFromExpected) -
    getCoveragePenalty(intendedPlan) -
    (status === "present" ? getStabilityPenalty(stabilityScore) : 0);

  const combinedConfidence = round3(clamp01(confidenceAdjusted));

  return {
    familyId,
    actionType,
    targetExpectedAt: toSafeTime(placement.expectedAt),
    sourceMomentId,
    anchorMomentId,
    nearestMomentId,
    status,
    confidence: combinedConfidence,
    reason: buildReason({
      status,
      actionType,
      sourceMomentId,
      deltaFromExpected: placement.deltaFromExpected,
      highestDriftSeverity,
      stabilityScore,
      stabilityLabel,
      missingCount: Number(intendedPlan.missingCount ?? 0),
      nearCount: Number(intendedPlan.nearCount ?? 0),
    }),
  };
}

function toFamilyMap(
  families: MomentFamilyEngineFamily[]
): Record<string, MomentFamilyEngineFamily> {
  const map: Record<string, MomentFamilyEngineFamily> = {};

  for (const family of families) {
    const familyId = normalizeText(family.id);
    if (!familyId) continue;
    map[familyId] = family;
  }

  return map;
}

function getActionPriority(action: IntendedActionCandidate): number {
  if (action.status === "missing") return 3;
  if (action.status === "near") return 2;
  return 1;
}

function getPlanPriority(plan: IntendedActionPlan): number {
  return plan.actions.reduce((sum, action) => sum + getActionPriority(action), 0);
}

function dedupeActions(actions: IntendedActionCandidate[]): IntendedActionCandidate[] {
  const seen = new Set<string>();
  const result: IntendedActionCandidate[] = [];

  for (const action of actions) {
    const key = [
      action.familyId,
      action.status,
      action.actionType,
      action.sourceMomentId ?? "",
      action.nearestMomentId ?? "",
      Number(action.targetExpectedAt).toFixed(3),
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(action);
  }

  return result;
}

export function buildIntendedActionPlans(params: {
  families: MomentFamilyEngineFamily[];
  intendedPlans: IntendedRepeatFamilyPlan[];
  phraseDriftResult?: PhraseDriftEngineResult | null;
  phraseStabilityResult?: PhraseStabilityEngineResult | null;
}): IntendedActionResult {
  const familyMap = toFamilyMap(params.families);
  const plans: IntendedActionPlan[] = [];
  const actionsByFamilyId: Record<string, IntendedActionCandidate[]> = {};

  for (const intendedPlan of params.intendedPlans) {
    const familyId = normalizeText(intendedPlan.familyId);
    const family = familyMap[familyId];
    if (!family) continue;

    const placements = Array.isArray(intendedPlan.expectedPlacements)
      ? intendedPlan.expectedPlacements
      : [];

    const actions = dedupeActions(
      placements
        .map((placement) =>
          buildActionForPlacement({
            family,
            intendedPlan,
            placement,
            phraseDriftResult: params.phraseDriftResult,
            phraseStabilityResult: params.phraseStabilityResult,
          })
        )
        .filter((value): value is IntendedActionCandidate => Boolean(value))
        .sort((a, b) => {
          const aPriority = getActionPriority(a);
          const bPriority = getActionPriority(b);

          if (bPriority !== aPriority) {
            return bPriority - aPriority;
          }

          if (b.confidence !== a.confidence) return b.confidence - a.confidence;

          if (a.targetExpectedAt !== b.targetExpectedAt) {
            return a.targetExpectedAt - b.targetExpectedAt;
          }

          return (a.sourceMomentId ?? "").localeCompare(b.sourceMomentId ?? "");
        })
    );

    plans.push({
      familyId,
      actions,
    });

    actionsByFamilyId[familyId] = actions;
  }

  plans.sort((a, b) => {
    const aPriority = getPlanPriority(a);
    const bPriority = getPlanPriority(b);
    if (bPriority !== aPriority) return bPriority - aPriority;

    const aMissing = a.actions.filter((row) => row.status === "missing").length;
    const bMissing = b.actions.filter((row) => row.status === "missing").length;
    if (bMissing !== aMissing) return bMissing - aMissing;

    const aNear = a.actions.filter((row) => row.status === "near").length;
    const bNear = b.actions.filter((row) => row.status === "near").length;
    if (bNear !== aNear) return bNear - aNear;

    const aTop = a.actions[0]?.confidence ?? 0;
    const bTop = b.actions[0]?.confidence ?? 0;
    if (bTop !== aTop) return bTop - aTop;

    return a.familyId.localeCompare(b.familyId);
  });

  return {
    plans,
    actionsByFamilyId,
  };
}
