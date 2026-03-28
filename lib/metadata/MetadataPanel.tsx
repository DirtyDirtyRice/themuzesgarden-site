"use client";

import {
  getMetadataByTarget,
  getMetadataContext,
} from "./metadataApi";
import type { MetadataTargetType, MetadataEntry } from "./metadataTypes";

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

      <div className="space-y-3">
        {items.map((m) => {
          const ctx = getMetadataContext(m.id);

          return (
            <div key={m.id} className="rounded border p-2">
              <div className="font-medium">{m.label}</div>

              {m.description ? (
                <div className="mt-1 text-xs text-gray-600">
                  {m.description}
                </div>
              ) : null}

              {/* Parent */}
              {ctx?.parent ? (
                <div className="mt-2 text-xs text-gray-500">
                  Parent: {ctx.parent.label}
                </div>
              ) : null}

              {/* Children */}
              {ctx?.children?.length ? (
                <div className="mt-2 text-xs text-gray-500">
                  Children:{" "}
                  {ctx.children.map((c) => c.label).join(", ")}
                </div>
              ) : null}

              {/* Links */}
              {ctx?.linksFrom?.length ? (
                <div className="mt-2 text-xs text-gray-500">
                  Related:{" "}
                  {ctx.linksFrom.map((l) => l.targetId).join(", ")}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}