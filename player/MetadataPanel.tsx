"use client";

import { getMetadataByTarget } from "../lib/metadata/metadataApi";
import type { MetadataTargetType } from "../lib/metadata/metadataTypes";

type MetadataItemLike = {
  id: string;
  label?: string | null;
  description?: string | null;
};

type Props = {
  targetType: MetadataTargetType;
  targetId: string;
};

function formatTargetTypeLabel(targetType: MetadataTargetType): string {
  switch (targetType) {
    case "track":
      return "Track";
    case "section":
      return "Section";
    case "moment":
      return "Moment";
    default:
      return "Metadata";
  }
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

export default function MetadataPanel({ targetType, targetId }: Props) {
  const safeTargetId = cleanText(targetId);
  const safeTargetType = targetType;

  let items = (
    getMetadataByTarget(safeTargetType, safeTargetId) ?? []
  ) as MetadataItemLike[];

  if (!items.length && safeTargetType === "track") {
    items = [
      {
        id: "fallback",
        label: "No specific metadata yet",
        description:
          "This track does not yet have metadata linked. General metadata support is ready for future expansion.",
      },
    ];
  }

  const targetTypeLabel = formatTargetTypeLabel(safeTargetType);
  const itemCount = items.length;

  return (
    <div className="mt-3 rounded-lg border bg-white p-3 text-sm shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-800">Metadata</div>
          <div className="mt-1 text-xs text-gray-500">
            {targetTypeLabel}
            {safeTargetId ? ` • ${safeTargetId}` : ""}
          </div>
        </div>

        <div className="shrink-0 rounded-full border px-2 py-1 text-[11px] text-gray-600">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </div>
      </div>

      {!items.length ? (
        <div className="rounded-lg border border-dashed bg-gray-50 px-3 py-4 text-xs text-gray-600">
          No metadata found for this {targetTypeLabel.toLowerCase()} yet.
        </div>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {items.map((m, index) => {
            const label = cleanText(m.label) || `Metadata Item ${index + 1}`;
            const description = cleanText(m.description);

            return (
              <div
                key={String(m.id ?? `${label}-${index}`)}
                className="rounded-lg border bg-gray-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800">{label}</div>

                    {description ? (
                      <div className="mt-1 whitespace-pre-wrap text-xs leading-5 text-gray-600">
                        {description}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs italic text-gray-400">
                        No description yet.
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
                    {targetTypeLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}