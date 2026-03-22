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

export default function MetadataPanel({ targetType, targetId }: Props) {
  const items = (getMetadataByTarget(targetType, targetId) ?? []) as MetadataItemLike[];

  if (!items.length) return null;

  return (
    <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
      <div className="mb-2 font-semibold text-gray-700">Metadata</div>

      <div className="space-y-2">
        {items.map((m) => (
          <div key={String(m.id)} className="rounded border p-2">
            <div className="font-medium">{String(m.label ?? "Untitled")}</div>

            {m.description ? (
              <div className="mt-1 text-xs text-gray-600">
                {String(m.description)}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
