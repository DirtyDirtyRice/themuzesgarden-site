import { createHash } from "node:crypto";

export type TimelineDawPrivateFreezeRecipe = {
  sourceKind: "lane" | "bus";
  sourceId: string;
  laneIds: string[];
  routing: unknown;
  inserts: unknown[];
  sends: unknown[];
  automation?: unknown[];
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function timelineDawPrivateFreezeRecipeChecksum(recipe: TimelineDawPrivateFreezeRecipe): string {
  return `sha256:${createHash("sha256").update(canonical(recipe)).digest("hex")}`;
}

export function parseTimelineDawPrivateFreezeTarget(value: unknown): { sourceKind: "lane" | "bus"; sourceId: string } {
  if (!value || typeof value !== "object") throw new Error("Private freeze target is required.");
  const input = value as Record<string, unknown>; const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  if ((input.sourceKind !== "lane" && input.sourceKind !== "bus") || !sourceId) throw new Error("Private freeze target must identify a lane or bus.");
  return { sourceKind: input.sourceKind, sourceId };
}

export function isTimelineDawPrivateFreezeStale(savedChecksum: string, currentRecipe: TimelineDawPrivateFreezeRecipe): boolean {
  return savedChecksum !== timelineDawPrivateFreezeRecipeChecksum(currentRecipe);
}
