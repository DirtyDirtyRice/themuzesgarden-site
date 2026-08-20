import type { LyricEntry } from "./lyricsTypes";

const SECTION_HEADING = /^\s*(?:\[(?:verse|chorus|pre[- ]?chorus|bridge|intro|outro|hook|refrain|breakdown|interlude|solo|instrumental)(?:\s+\d+)?\]|(?:verse|chorus|pre[- ]?chorus|bridge|intro|outro|hook|refrain|breakdown|interlude|solo|instrumental)(?:\s+\d+)?\s*:?)\s*$/i;

export type LyricFileFormat = "txt" | "pdf" | "other";

export function formatLyricSectionSpacing(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").trim();
  if (!normalized) return "";

  const output: string[] = [];
  for (const line of normalized.split("\n")) {
    const heading = SECTION_HEADING.test(line);
    if (heading && output.length > 0 && output.at(-1) !== "") output.push("");
    output.push(line.trimEnd());
    if (heading) output.push("");
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function getLyricFileFormat(entry: LyricEntry): LyricFileFormat {
  const explicit = entry.sourceFileExtension?.replace(/^\./, "").toLowerCase();
  const tags = entry.tags.toLowerCase().split(/[,\s]+/).filter(Boolean);
  if (explicit === "pdf" || tags.includes("pdf")) return "pdf";
  if (["txt", "text", "md", "markdown"].includes(explicit || "") || tags.some((tag) => ["txt", "text", "md", "markdown"].includes(tag))) return "txt";
  return "other";
}
