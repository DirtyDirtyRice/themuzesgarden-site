import { createElement } from "react";
import type { ReactNode } from "react";
import type {
  MetadataLibraryRecordSummary,
  RecordFilterOption,
} from "./MetadataLibraryPageTypes";

export function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function cleanFilterValue(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function getRecordSearchScore(
  record: MetadataLibraryRecordSummary,
  query: string,
) {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) return 1;

  const title = String(record.title ?? "").toLowerCase();
  const excerpt = String(record.excerpt ?? "").toLowerCase();

  let score = 0;

  if (title === cleanQuery) score += 100;
  if (title.startsWith(cleanQuery)) score += 50;
  if (title.includes(cleanQuery)) score += 25;
  if (excerpt.includes(cleanQuery)) score += 10;

  return score;
}

export function highlightText(value: string, query: string): ReactNode {
  const text = String(value ?? "");
  const cleanQuery = query.trim();

  if (!cleanQuery) return text;

  const safeQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeQuery})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === cleanQuery.toLowerCase()) {
      return createElement(
        "mark",
        {
          key: `${part}-${index}`,
          className: "rounded-sm bg-white px-1 text-black",
        },
        part,
      );
    }

    return part;
  });
}

export function getUniqueFilterOptions(
  values: string[],
): RecordFilterOption[] {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  return uniqueValues
    .sort((a, b) => formatLabel(a).localeCompare(formatLabel(b)))
    .map((value) => ({
      label: formatLabel(value),
      value,
    }));
}

export function filterRecords(params: {
  records: MetadataLibraryRecordSummary[];
  query: string;
  shelf: string;
  visibility: string;
}) {
  const { records, query, shelf, visibility } = params;
  const cleanQuery = query.trim();

  return records
    .map((record) => {
      const score = getRecordSearchScore(record, cleanQuery);
      const matchesShelf = shelf ? record.shelf === shelf : true;
      const matchesVisibility = visibility
        ? record.visibility === visibility
        : true;

      return {
        record,
        score,
        isMatch:
          matchesShelf &&
          matchesVisibility &&
          (cleanQuery ? score > 0 : true),
      };
    })
    .filter((item) => item.isMatch)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.record);
}