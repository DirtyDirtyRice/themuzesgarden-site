"use client";

import { useMemo, useState } from "react";
import {
  getFullMetadataContext,
  getMetadataByTarget,
} from "../lib/metadata/metadataApi";
import type {
  MetadataEntry,
  MetadataTargetType,
} from "../lib/metadata/metadataTypes";

function cleanText(v: unknown) {
  return String(v ?? "").trim();
}

export default function MetadataPanel({ targetType, targetId }: {
  targetType: MetadataTargetType;
  targetId: string;
}) {
  const [activeId, setActiveId] = useState("");

  const items = getMetadataByTarget(targetType, targetId);

  const activeContext = useMemo(() => {
    if (!activeId) return null;
    return getFullMetadataContext(activeId);
  }, [activeId]);

  if (!items.length) {
    return (
      <div className="mt-3 border p-3 text-sm">
        No metadata yet for this {targetType}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      {items.map((item) => {
        const ctx = getFullMetadataContext(item.id);
        if (!ctx) return null;

        return (
          <div key={item.id} className="border p-3">

            <div className="font-medium">
              {cleanText(item.label)}
            </div>

            <div className="text-xs text-gray-600">
              {cleanText(item.description)}
            </div>

            {/* RELATED */}
            {ctx.related.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Related:
                {ctx.related.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveId(r.id)}
                    className="ml-2 underline"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* CHILDREN */}
            {ctx.children.length > 0 && (
              <div className="mt-2 text-xs">
                Children:
                {ctx.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className="ml-2 underline"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

          </div>
        );
      })}

      {/* ACTIVE PREVIEW */}
      {activeContext && (
        <div className="border p-3 bg-white">
          <div className="font-medium">
            {activeContext.entry.label}
          </div>
          <div className="text-xs text-gray-600">
            {activeContext.entry.description}
          </div>

          {activeContext.related.length > 0 && (
            <div className="mt-2 text-xs">
              Related:
              {activeContext.related.map((r) => (
                <span key={r.id} className="ml-2">
                  {r.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}