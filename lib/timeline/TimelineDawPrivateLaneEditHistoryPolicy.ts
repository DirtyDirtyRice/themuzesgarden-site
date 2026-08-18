export const timelineDawPrivateLaneEditLabels = {
  arrange: "Move or trim track",
  split: "Cut track into two",
  duplicate: "Make track copy",
  fade: "Change track fades",
  remove: "Remove track from song",
  group: "Edit selected tracks",
  transform: "Change track speed or pitch",
} as const;

export type TimelineDawPrivateLaneEditOperation = keyof typeof timelineDawPrivateLaneEditLabels;

export function createTimelineDawPrivateLaneEditReceipt(input: {
  operation: unknown;
  beforeRows: Array<Record<string, unknown>>;
  afterRows: Array<Record<string, unknown>>;
}) {
  if (typeof input.operation !== "string" || !(input.operation in timelineDawPrivateLaneEditLabels)) {
    throw new Error("Private lane edit operation is invalid.");
  }
  const operation = input.operation as TimelineDawPrivateLaneEditOperation;
  const beforeRows = [...input.beforeRows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const afterRows = [...input.afterRows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (!beforeRows.length && !afterRows.length) throw new Error("Private lane edit receipt requires changed rows.");
  const ids = new Set([...beforeRows, ...afterRows].map((row) => String(row.id ?? "")));
  if (ids.has("")) throw new Error("Private lane edit receipt rows require IDs.");
  if (JSON.stringify(beforeRows) === JSON.stringify(afterRows)) throw new Error("Private lane edit receipt must change lane state.");
  return { operation, label: timelineDawPrivateLaneEditLabels[operation], beforeRows, afterRows };
}
