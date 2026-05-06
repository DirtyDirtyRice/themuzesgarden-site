import type { MetadataKind, MetadataTargetType } from "./metadataTypes";
import type { MetadataQueryInput } from "./metadataQueryTypes";

export const fieldClassName =
  "relative z-30 pointer-events-auto w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-[color:var(--text-normal)] outline-none transition placeholder:text-[color:var(--text-normal)] focus:border-white/30 focus:bg-black focus:ring-1 focus:ring-white/20";

export const controlButtonClassName =
  "rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-[color:var(--text-normal)] transition hover:bg-white/10";

type BuildFilterSummaryInput = {
  query: string;
  mode: MetadataQueryInput["mode"];
  targetType: MetadataTargetType | "all";
  kind: MetadataKind | "all";
  targetId: string;
  tags: string[];
  limit: number;
};

export function buildFilterSummary({
  query,
  mode,
  targetType,
  kind,
  targetId,
  tags,
  limit,
}: BuildFilterSummaryInput): string[] {
  const pieces: string[] = [];

  if (query.trim()) {
    pieces.push(`Query: "${query.trim()}"`);
  } else {
    pieces.push("Query: none");
  }

  pieces.push(`Mode: ${mode ?? "all"}`);
  pieces.push(`Target Type: ${targetType}`);
  pieces.push(`Kind: ${kind}`);

  if (targetId.trim()) {
    pieces.push(`Target Id: ${targetId.trim()}`);
  }

  if (tags.length > 0) {
    pieces.push(`Tags: ${tags.join(", ")}`);
  }

  pieces.push(`Limit: ${limit}`);

  return pieces;
}