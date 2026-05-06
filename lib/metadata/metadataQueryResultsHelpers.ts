import { Fragment, createElement, type ReactNode } from "react";

export type DisplayField = {
  label: string;
  value: string;
};

export type DisplayRow = {
  title: string;
  subtitle?: string;
  fields: DisplayField[];
};

export function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function pickFirstString(
  source: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return undefined;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(text: string, query: string): ReactNode {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi");
  const parts = text.split(regex);

  return createElement(
    Fragment,
    null,
    ...parts.map((part, index) => {
      if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
        return createElement(
          "mark",
          {
            key: `${part}-${index}`,
            className: "rounded bg-yellow-400 px-1 text-black",
          },
          part
        );
      }

      return createElement("span", { key: `${part}-${index}` }, part);
    })
  );
}

export function getHighlightQuery(resultRecord: Record<string, unknown>): string {
  const directQuery =
    typeof resultRecord.query === "string" ? resultRecord.query : "";

  if (directQuery.trim()) {
    return directQuery.trim();
  }

  const normalizedQuery =
    typeof resultRecord.normalizedQuery === "string"
      ? resultRecord.normalizedQuery
      : "";

  if (normalizedQuery.trim()) {
    return normalizedQuery.trim();
  }

  const inputRecord = asRecord(resultRecord.input);
  const inputQuery =
    inputRecord && typeof inputRecord.query === "string"
      ? inputRecord.query
      : "";

  return inputQuery.trim();
}

export function buildDisplayRow(item: unknown, index: number): DisplayRow {
  const record = asRecord(item);

  if (!record) {
    return {
      title: `Result ${index + 1}`,
      fields: [
        {
          label: "Value",
          value: formatValue(item),
        },
      ],
    };
  }

  const title =
    pickFirstString(record, [
      "label",
      "name",
      "title",
      "id",
      "targetId",
      "entryId",
    ]) ?? `Result ${index + 1}`;

  const subtitle = pickFirstString(record, [
    "kind",
    "targetType",
    "scope",
    "source",
    "layer",
  ]);

  const preferredFieldOrder = [
    "id",
    "entryId",
    "label",
    "name",
    "title",
    "kind",
    "targetType",
    "targetId",
    "scope",
    "source",
    "layer",
    "score",
    "weight",
    "reason",
    "matchedText",
    "text",
    "value",
    "tags",
    "slug",
  ];

  const used = new Set<string>();
  const fields: DisplayField[] = [];

  for (const key of preferredFieldOrder) {
    if (!(key in record)) continue;
    used.add(key);

    fields.push({
      label: key,
      value: formatValue(record[key]),
    });
  }

  for (const [key, value] of Object.entries(record)) {
    if (used.has(key)) continue;

    fields.push({
      label: key,
      value: formatValue(value),
    });
  }

  return {
    title,
    subtitle,
    fields,
  };
}

export function getPrimaryList(resultRecord: Record<string, unknown>): unknown[] {
  const candidates = [
    resultRecord.results,
    resultRecord.items,
    resultRecord.matches,
    resultRecord.entries,
    resultRecord.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

export function getFieldValue(row: DisplayRow, label: string): string {
  return (
    row.fields.find(
      (field) => field.label.toLowerCase() === label.toLowerCase()
    )?.value ?? ""
  );
}

export function getPreviewValue(row: DisplayRow): string {
  const matchedText = getFieldValue(row, "matchedText");
  if (matchedText.trim()) return matchedText;

  const text = getFieldValue(row, "text");
  if (text.trim()) return text;

  const value = getFieldValue(row, "value");
  if (value.trim()) return value;

  const reason = getFieldValue(row, "reason");
  if (reason.trim()) return reason;

  const targetId = getFieldValue(row, "targetId");
  if (targetId.trim()) return targetId;

  const firstUsefulField = row.fields.find((field) => {
    const lowered = field.label.toLowerCase();
    return (
      field.value.trim() &&
      ![
        "id",
        "slug",
        "score",
        "weight",
        "kind",
        "targettype",
        "source",
        "layer",
      ].includes(lowered)
    );
  });

  return firstUsefulField?.value ?? "";
}

export function getTagList(row: DisplayRow): string[] {
  const tagsValue = getFieldValue(row, "tags").trim();

  if (!tagsValue || tagsValue === "—") {
    return [];
  }

  try {
    const parsed = JSON.parse(tagsValue);
    if (Array.isArray(parsed)) {
      return parsed
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 6);
    }
  } catch {
    // ignore parse failure and fall back below
  }

  return tagsValue
    .split(",")
    .map((tag) => tag.replace(/[\[\]"]/g, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function getSourceBadge(row: DisplayRow): string {
  const source = getFieldValue(row, "source").trim();
  if (source) return source;

  const layer = getFieldValue(row, "layer").trim();
  if (layer) return layer;

  const kind = getFieldValue(row, "kind").trim();
  if (kind) return kind;

  return row.subtitle?.trim() ?? "";
}

export function truncatePreview(value: string, maxLength = 180): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}…`;
}