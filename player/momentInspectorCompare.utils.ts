import type {
  MomentInspectorCompareFamilyOption,
  MomentInspectorCompareMetricRow,
  MomentInspectorCompareMetricTone,
  MomentInspectorComparePanelSection,
  MomentInspectorCompareResult,
} from "./momentInspectorCompare.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function formatNumber(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return String(Math.round(n * 10) / 10);
}

function formatWholePercent(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function formatText(value: unknown): string {
  const clean = normalizeText(value);
  return clean || "—";
}

function getMetricToneFromNumbers(
  primaryValue: unknown,
  secondaryValue: unknown,
  higherIsBetter = true
): MomentInspectorCompareMetricTone {
  const a = Number(primaryValue);
  const b = Number(secondaryValue);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return "neutral";
  }

  if (a === b) {
    return "equal";
  }

  if (higherIsBetter) {
    return a > b ? "stronger" : "weaker";
  }

  return a < b ? "stronger" : "weaker";
}

export function normalizeCompareFamilyId(value: unknown): string {
  return normalizeText(value);
}

export function getCompareFamilyIdFromOption(
  option: MomentInspectorCompareFamilyOption
): string {
  return normalizeCompareFamilyId(option.familyId);
}

export function getCompareFamilyOptions(
  options: MomentInspectorCompareFamilyOption[]
): MomentInspectorCompareFamilyOption[] {
  const seen = new Set<string>();
  const rows: MomentInspectorCompareFamilyOption[] = [];

  for (const option of options) {
    const familyId = getCompareFamilyIdFromOption(option);
    if (!familyId || seen.has(familyId)) continue;

    seen.add(familyId);
    rows.push({
      familyId,
      label: normalizeText(option.label) || familyId,
      runtimeVerdict: normalizeText(option.runtimeVerdict) || null,
    });
  }

  return rows;
}

export function findFamilyRowById<TFamily extends { familyId?: unknown }>(
  rows: TFamily[],
  familyId: string
): TFamily | null {
  const cleanId = normalizeCompareFamilyId(familyId);
  if (!cleanId) return null;

  return (
    rows.find((row) => normalizeCompareFamilyId(row.familyId) === cleanId) ?? null
  );
}

export function buildCompareNumberRow(params: {
  key: string;
  label: string;
  primaryValue: unknown;
  secondaryValue: unknown;
  higherIsBetter?: boolean;
  format?: "number" | "percent";
}): MomentInspectorCompareMetricRow {
  const {
    key,
    label,
    primaryValue,
    secondaryValue,
    higherIsBetter = true,
    format = "number",
  } = params;

  const formatValue = format === "percent" ? formatWholePercent : formatNumber;

  return {
    key,
    label,
    primaryValue: formatValue(primaryValue),
    secondaryValue: formatValue(secondaryValue),
    tone: getMetricToneFromNumbers(
      primaryValue,
      secondaryValue,
      higherIsBetter
    ),
  };
}

export function buildCompareTextRow(params: {
  key: string;
  label: string;
  primaryValue: unknown;
  secondaryValue: unknown;
}): MomentInspectorCompareMetricRow {
  const { key, label, primaryValue, secondaryValue } = params;

  const primaryText = formatText(primaryValue);
  const secondaryText = formatText(secondaryValue);

  let tone: MomentInspectorCompareMetricTone = "neutral";
  if (primaryText === secondaryText) {
    tone = "equal";
  }

  return {
    key,
    label,
    primaryValue: primaryText,
    secondaryValue: secondaryText,
    tone,
  };
}

export function buildCompareSection(
  title: string,
  rows: MomentInspectorCompareMetricRow[]
): MomentInspectorComparePanelSection {
  return {
    title,
    rows,
  };
}

export function getCompareReadiness(params: {
  primaryFamilyId: string;
  secondaryFamilyId: string;
}): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const primaryFamilyId = normalizeCompareFamilyId(params.primaryFamilyId);
  const secondaryFamilyId = normalizeCompareFamilyId(params.secondaryFamilyId);

  if (!primaryFamilyId) {
    reasons.push("Select a primary family.");
  }

  if (!secondaryFamilyId) {
    reasons.push("Select a secondary family.");
  }

  if (
    primaryFamilyId &&
    secondaryFamilyId &&
    normalizeLower(primaryFamilyId) === normalizeLower(secondaryFamilyId)
  ) {
    reasons.push("Choose two different families.");
  }

  return {
    ready: reasons.length === 0,
    reasons,
  };
}

export function buildMomentInspectorCompareResult(params: {
  primaryFamilyId: string;
  secondaryFamilyId: string;
  driftPrimary: unknown;
  driftSecondary: unknown;
  stabilityPrimary: unknown;
  stabilitySecondary: unknown;
  actionPrimary: unknown;
  actionSecondary: unknown;
  repairPrimary: unknown;
  repairSecondary: unknown;
  trustPrimary: unknown;
  trustSecondary: unknown;
}): MomentInspectorCompareResult {
  const readiness = getCompareReadiness({
    primaryFamilyId: params.primaryFamilyId,
    secondaryFamilyId: params.secondaryFamilyId,
  });

  const driftPrimary = (params.driftPrimary ?? {}) as Record<string, unknown>;
  const driftSecondary = (params.driftSecondary ?? {}) as Record<string, unknown>;
  const stabilityPrimary = (params.stabilityPrimary ?? {}) as Record<string, unknown>;
  const stabilitySecondary = (params.stabilitySecondary ?? {}) as Record<string, unknown>;
  const actionPrimary = (params.actionPrimary ?? {}) as Record<string, unknown>;
  const actionSecondary = (params.actionSecondary ?? {}) as Record<string, unknown>;
  const repairPrimary = (params.repairPrimary ?? {}) as Record<string, unknown>;
  const repairSecondary = (params.repairSecondary ?? {}) as Record<string, unknown>;
  const trustPrimary = (params.trustPrimary ?? {}) as Record<string, unknown>;
  const trustSecondary = (params.trustSecondary ?? {}) as Record<string, unknown>;

  const sections: MomentInspectorComparePanelSection[] = [
    buildCompareSection("Drift", [
      buildCompareNumberRow({
        key: "drift-score",
        label: "Drift severity",
        primaryValue: driftPrimary.driftSeverityScore ?? driftPrimary.highestDriftSeverity,
        secondaryValue:
          driftSecondary.driftSeverityScore ?? driftSecondary.highestDriftSeverity,
        higherIsBetter: false,
      }),
      buildCompareTextRow({
        key: "drift-label",
        label: "Drift label",
        primaryValue: driftPrimary.driftLabel ?? driftPrimary.highestDriftLabel,
        secondaryValue: driftSecondary.driftLabel ?? driftSecondary.highestDriftLabel,
      }),
    ]),
    buildCompareSection("Stability", [
      buildCompareNumberRow({
        key: "stability-score",
        label: "Stability score",
        primaryValue: stabilityPrimary.stabilityScore,
        secondaryValue: stabilitySecondary.stabilityScore,
        higherIsBetter: true,
      }),
      buildCompareTextRow({
        key: "stability-label",
        label: "Stability label",
        primaryValue: stabilityPrimary.stabilityLabel,
        secondaryValue: stabilitySecondary.stabilityLabel,
      }),
    ]),
    buildCompareSection("Actions", [
      buildCompareNumberRow({
        key: "actions-total",
        label: "Total actions",
        primaryValue: actionPrimary.totalActions,
        secondaryValue: actionSecondary.totalActions,
        higherIsBetter: false,
      }),
      buildCompareNumberRow({
        key: "actions-present",
        label: "Present actions",
        primaryValue: actionPrimary.presentActions,
        secondaryValue: actionSecondary.presentActions,
        higherIsBetter: true,
      }),
      buildCompareNumberRow({
        key: "actions-missing",
        label: "Missing actions",
        primaryValue: actionPrimary.missingActions,
        secondaryValue: actionSecondary.missingActions,
        higherIsBetter: false,
      }),
    ]),
    buildCompareSection("Repair", [
      buildCompareNumberRow({
        key: "repair-priority",
        label: "Repair priority",
        primaryValue: repairPrimary.repairPriorityScore,
        secondaryValue: repairSecondary.repairPriorityScore,
        higherIsBetter: false,
      }),
      buildCompareNumberRow({
        key: "repair-near",
        label: "Near count",
        primaryValue: repairPrimary.nearCount,
        secondaryValue: repairSecondary.nearCount,
        higherIsBetter: false,
      }),
    ]),
    buildCompareSection("Trust", [
      buildCompareNumberRow({
        key: "trust-score",
        label: "Trust score",
        primaryValue: trustPrimary.trustScore ?? trustPrimary.score,
        secondaryValue: trustSecondary.trustScore ?? trustSecondary.score,
        higherIsBetter: true,
        format: "percent",
      }),
      buildCompareTextRow({
        key: "trust-level",
        label: "Trust level",
        primaryValue: trustPrimary.trustLevel ?? trustPrimary.level,
        secondaryValue: trustSecondary.trustLevel ?? trustSecondary.level,
      }),
    ]),
  ];

  return {
    summary: {
      primaryFamilyId: normalizeCompareFamilyId(params.primaryFamilyId),
      secondaryFamilyId: normalizeCompareFamilyId(params.secondaryFamilyId),
      ready: readiness.ready,
      reasons: readiness.reasons,
    },
    sections,
  };
}