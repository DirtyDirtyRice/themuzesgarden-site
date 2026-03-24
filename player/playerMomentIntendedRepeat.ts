import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";

export type IntendedRepeatPlacement = {
  expectedAt: number;
  nearestMomentId: string | null;
  status: "present" | "near" | "missing";
  confidence: number;
  deltaFromExpected: number | null;
};

export type IntendedRepeatFamilyPlan = {
  familyId: string;
  expectedPlacements: IntendedRepeatPlacement[];
  presentCount: number;
  nearCount: number;
  missingCount: number;
};

export type IntendedRepeatResult = {
  plans: IntendedRepeatFamilyPlan[];
  byFamilyId: Record<string, IntendedRepeatFamilyPlan>;
};

type FamilyMemberLike = {
  momentId: string;
  similarityToAnchor: number;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toSafeTime(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(3));
}

function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// 🔧 FIXED LOOP ERROR HERE
function getFamilyMembers(family: MomentFamilyEngineFamily): FamilyMemberLike[] {
  return Array.isArray(family.members)
    ? (family.members as unknown as FamilyMemberLike[])
    : [];
}

function getMemberStarts(family: MomentFamilyEngineFamily): number[] {
  return getFamilyMembers(family)
    .map((m: any) => toSafeTime(m.start ?? m.expectedAt ?? 0))
    .filter((n) => Number.isFinite(n));
}

function getNearestMomentId(
  starts: number[],
  target: number,
  family: MomentFamilyEngineFamily
): { id: string | null; delta: number | null } {
  const members = getFamilyMembers(family);

  if (!starts.length || !members.length) {
    return { id: null, delta: null };
  }

  let bestIndex = -1;
  let bestDelta = Infinity;

  starts.forEach((s, i) => {
    const delta = Math.abs(s - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  });

  if (bestIndex === -1) {
    return { id: null, delta: null };
  }

  return {
    id: normalizeText((members[bestIndex] as any)?.momentId) || null,
    delta: bestDelta,
  };
}

function getStatus(delta: number | null): "present" | "near" | "missing" {
  if (delta === null) return "missing";
  if (delta < 0.1) return "present";
  if (delta < 0.6) return "near";
  return "missing";
}

function getConfidence(delta: number | null): number {
  if (delta === null) return 0.2;
  if (delta < 0.1) return 0.95;
  if (delta < 0.6) return clamp01(1 - delta);
  return 0.3;
}

function buildPlacements(
  family: MomentFamilyEngineFamily
): IntendedRepeatPlacement[] {
  const starts = getMemberStarts(family);

  const interval = Number(family.repeatIntervalHint ?? 0);
  if (!Number.isFinite(interval) || interval <= 0) return [];

  const placements: IntendedRepeatPlacement[] = [];

  const base = starts[0] ?? 0;

  for (let i = 1; i <= 6; i++) {
    const expectedAt = toSafeTime(base + interval * i);

    const { id, delta } = getNearestMomentId(starts, expectedAt, family);

    const status = getStatus(delta);
    const confidence = getConfidence(delta);

    placements.push({
      expectedAt,
      nearestMomentId: id,
      status,
      confidence,
      deltaFromExpected: delta,
    });
  }

  return placements;
}

function buildPlan(family: MomentFamilyEngineFamily): IntendedRepeatFamilyPlan {
  const familyId = normalizeText(family.id);

  const expectedPlacements = buildPlacements(family);

  let presentCount = 0;
  let nearCount = 0;
  let missingCount = 0;

  for (const p of expectedPlacements) {
    if (p.status === "present") presentCount++;
    else if (p.status === "near") nearCount++;
    else missingCount++;
  }

  return {
    familyId,
    expectedPlacements,
    presentCount,
    nearCount,
    missingCount,
  };
}

export function buildIntendedRepeat(params: {
  families: MomentFamilyEngineFamily[];
}): IntendedRepeatResult {
  const plans: IntendedRepeatFamilyPlan[] = [];
  const byFamilyId: Record<string, IntendedRepeatFamilyPlan> = {};

  for (const family of params.families) {
    const plan = buildPlan(family);

    plans.push(plan);
    byFamilyId[plan.familyId] = plan;
  }

  return {
    plans,
    byFamilyId,
  };
}
