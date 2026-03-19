export type WorkspaceFamily = {
  familyId: string;
  title: string;
  summary: string;
  lane: "watch" | "repair";
  status: string;
  count: number;
};

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function text(v: unknown): string {
  return String(v ?? "").trim();
}

function num(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function mapFamily(item: any, lane: "watch" | "repair"): WorkspaceFamily {
  return {
    familyId: text(item?.familyId || item?.id),
    title: text(item?.title || item?.label || item?.familyId || "Untitled"),
    summary: text(item?.summary || item?.reason || ""),
    lane,
    status: text(item?.status || lane),
    count: num(item?.count),
  };
}

export function adaptInspectorToWorkspace(input: any) {
  const watch = asArray(
    input?.watchFamilies ?? input?.watchQueue ?? input?.lanes?.watch
  ).map((f) => mapFamily(f, "watch"));

  const repair = asArray(
    input?.repairFamilies ?? input?.repairQueue ?? input?.lanes?.repair
  ).map((f) => mapFamily(f, "repair"));

  return {
    watch,
    repair,
    all: [...watch, ...repair],
  };
}