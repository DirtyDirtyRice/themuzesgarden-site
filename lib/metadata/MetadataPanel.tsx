"use client";

import { getMetadataByTarget } from "../../../lib/metadata/metadataApi";
import type { MetadataTargetType } from "../../../lib/metadata/metadataTypes";

type Props = {
  targetType: MetadataTargetType;
  targetId: string;
};

export default function MetadataPanel({ targetType, targetId }: Props) {
  const items = getMetadataByTarget(targetType, targetId);

  if (!items.length) return null;

  return (
    <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
      <div className="mb-2 font-semibold text-gray-700">Metadata</div>

      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="rounded border p-2">
            <div className="font-medium">{m.label}</div>

            {m.description ? (
              <div className="text-gray-600 text-xs mt-1">
                {m.description}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}