import type { MomentInspectorWorkspaceDerivedState } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceDerivedViewFamily = {
  familyId: string;
  title: string;
  label: string;
  summary: string;
  lane: string;
  status: string;
  count: number | null;
};

export type MomentInspectorWorkspaceDerivedViewLane = {
  lane: string;
  label: string;
  items: MomentInspectorWorkspaceDerivedViewFamily[];
  count: number;
};

export type MomentInspectorWorkspaceDerivedView = {
  lanes: MomentInspectorWorkspaceDerivedViewLane[];
  watchItems: MomentInspectorWorkspaceDerivedViewFamily[];
  repairItems: MomentInspectorWorkspaceDerivedViewFamily[];
  totalCount: number;
};

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string {
  return String(value ?? "").trim();
}

function asCount(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function getTitle(item: any): string {
  return (
    asText(item?.title) ||
    asText(item?.label) ||
    asText(item?.name) ||
    asText(item?.familyId) ||
    "Untitled family"
  );
}

function getSummary(item: any): string {
  return (
    asText(item?.summary) ||
    asText(item?.description) ||
    asText(item?.reason) ||
    "No summary available."
  );
}

function mapItems(
  items: unknown,
  lane: string
): MomentInspectorWorkspaceDerivedViewFamily[] {
  return asArray(items).map((item: any, index: number) => ({
    familyId:
      asText(item?.familyId) ||
      asText(item?.id) ||
      asText(item?.key) ||
      `${lane}-${index + 1}`,
    title: getTitle(item),
    label: asText(item?.label) || getTitle(item),
    summary: getSummary(item),
    lane,
    status: asText(item?.status) || lane,
    count: asCount(item?.count),
  }));
}

export function buildMomentInspectorWorkspaceDerivedView(
  derivedState: MomentInspectorWorkspaceDerivedState | any
): MomentInspectorWorkspaceDerivedView {
  const watchSource =
    derivedState?.watchFamilies ??
    derivedState?.watchQueue ??
    derivedState?.lanes?.watch ??
    [];

  const repairSource =
    derivedState?.repairFamilies ??
    derivedState?.repairQueue ??
    derivedState?.lanes?.repair ??
    [];

  const watchItems = mapItems(watchSource, "watch");
  const repairItems = mapItems(repairSource, "repair");

  return {
    lanes: [
      {
        lane: "watch",
        label: "Watch",
        items: watchItems,
        count: watchItems.length,
      },
      {
        lane: "repair",
        label: "Repair",
        items: repairItems,
        count: repairItems.length,
      },
    ],
    watchItems,
    repairItems,
    totalCount: watchItems.length + repairItems.length,
  };
}