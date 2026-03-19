import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspacePriorityBucket =
  | "high"
  | "medium"
  | "low"
  | "unknown";

export function getMomentInspectorWorkspacePriorityBucket(
  item: MomentInspectorWorkspaceFamilyItem
): MomentInspectorWorkspacePriorityBucket {
  const score = item.repairPriorityScore;

  if (score === null) return "unknown";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getMomentInspectorWorkspacePriorityBucketLabel(
  bucket: MomentInspectorWorkspacePriorityBucket
): string {
  if (bucket === "high") return "High Priority";
  if (bucket === "medium") return "Medium Priority";
  if (bucket === "low") return "Low Priority";
  return "Unknown Priority";
}

export function getMomentInspectorWorkspacePriorityBucketTone(
  bucket: MomentInspectorWorkspacePriorityBucket
): string {
  if (bucket === "high") return "border-red-200 bg-red-50 text-red-700";
  if (bucket === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  if (bucket === "low") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}