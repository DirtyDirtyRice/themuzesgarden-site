export type MomentInspectorCompareFamilyOption = {
  familyId: string;
  label?: string;
  runtimeVerdict?: string | null;
};

export type MomentInspectorCompareState = {
  primaryFamilyId: string;
  secondaryFamilyId: string;
};

export type MomentInspectorCompareMetricTone =
  | "stronger"
  | "weaker"
  | "equal"
  | "neutral";

export type MomentInspectorCompareMetricRow = {
  key: string;
  label: string;
  primaryValue: string;
  secondaryValue: string;
  tone: MomentInspectorCompareMetricTone;
};

export type MomentInspectorCompareSummary = {
  primaryFamilyId: string;
  secondaryFamilyId: string;
  ready: boolean;
  reasons: string[];
};

export type MomentInspectorComparePanelSection = {
  title: string;
  rows: MomentInspectorCompareMetricRow[];
};

export type MomentInspectorCompareResult = {
  summary: MomentInspectorCompareSummary;
  sections: MomentInspectorComparePanelSection[];
};