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

type MetadataItemLike = {
  id: string;
  label?: string | null;
  description?: string | null;
  kind?: string | null;
  value?: string | number | boolean | null;
  tags?: string[] | null;
  parentId?: string | null;
};

type Props = {
  targetType: MetadataTargetType;
  targetId: string;
};

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function formatKind(kind: unknown) {
  const k = cleanText(kind);
  if (!k) return "";
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function formatRelationship(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  return text
    .split("-")
    .map((part) => {
      const p = cleanText(part);
      return p ? p.charAt(0).toUpperCase() + p.slice(1) : "";
    })
    .filter(Boolean)
    .join(" ");
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => cleanText(tag)).filter(Boolean);
}

function groupMetadata(items: MetadataItemLike[]) {
  const childrenMap = new Map<string, MetadataItemLike[]>();

  items.forEach((item) => {
    const parent = cleanText(item.parentId);
    if (!parent) return;

    if (!childrenMap.has(parent)) {
      childrenMap.set(parent, []);
    }

    childrenMap.get(parent)!.push(item);
  });

  const roots = items.filter((i) => !cleanText(i.parentId));

  return { roots, childrenMap };
}

function LinkedMetadataPreview({
  entry,
  onClose,
}: {
  entry: MetadataEntry;
  onClose: () => void;
}) {
  const tags = normalizeTags(entry.tags);

  return (
    <div className="mt-3 rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-gray-800">
            {cleanText(entry.label) || "Untitled"}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {cleanText(entry.targetType)}
            {cleanText(entry.targetId) ? ` • ${cleanText(entry.targetId)}` : ""}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded border px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {cleanText(entry.description) ? (
        <div className="text-xs leading-5 text-gray-600">
          {cleanText(entry.description)}
        </div>
      ) : (
        <div className="text-xs italic text-gray-400">No description yet.</div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        {cleanText(entry.kind) ? (
          <span className="rounded border px-2 py-1">
            {formatKind(entry.kind)}
          </span>
        ) : null}

        {cleanText(entry.value) ? (
          <span className="rounded border px-2 py-1">
            {cleanText(entry.value)}
          </span>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={`${entry.id}-preview-tag-${tag}`}
              className="rounded-full border px-2 py-1 text-[10px] text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LinkRow({
  prefix,
  targetLabel,
  targetId,
  onOpenLinkedEntry,
}: {
  prefix: string;
  targetLabel: string;
  targetId: string;
  onOpenLinkedEntry: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
      <span>{prefix}</span>
      {targetId ? (
        <button
          type="button"
          onClick={() => onOpenLinkedEntry(targetId)}
          className="underline underline-offset-2 hover:text-gray-700"
        >
          {targetLabel}
        </button>
      ) : (
        <span>{targetLabel}</span>
      )}
    </div>
  );
}

function ContextBlock({
  entryId,
  onOpenLinkedEntry,
}: {
  entryId: string;
  onOpenLinkedEntry: (id: string) => void;
}) {
  const context = getFullMetadataContext(entryId);

  if (!context) return null;

  const { parent, children, resolvedLinksFrom, resolvedLinksTo, related } = context;

  const hasAnything =
    !!parent ||
    children.length > 0 ||
    resolvedLinksFrom.length > 0 ||
    resolvedLinksTo.length > 0 ||
    related.length > 0;

  if (!hasAnything) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {parent ? (
        <LinkRow
          prefix="Parent:"
          targetLabel={cleanText(parent.label) || cleanText(parent.id)}
          targetId={cleanText(parent.id)}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ) : null}

      {children.map((child) => (
        <LinkRow
          key={`child-${child.id}`}
          prefix="Child:"
          targetLabel={cleanText(child.label) || cleanText(child.id)}
          targetId={cleanText(child.id)}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ))}

      {resolvedLinksFrom.map(({ link, entry }, index) => (
        <LinkRow
          key={link.id ?? `from-${link.sourceId}-${link.targetId}-${link.relationship}-${index}`}
          prefix={`→ ${formatRelationship(link.relationship)}:`}
          targetLabel={cleanText(entry?.label) || cleanText(link.targetId)}
          targetId={cleanText(entry?.id)}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ))}

      {resolvedLinksTo.map(({ link, entry }, index) => (
        <LinkRow
          key={link.id ?? `to-${link.sourceId}-${link.targetId}-${link.relationship}-${index}`}
          prefix={`← ${formatRelationship(link.relationship)}:`}
          targetLabel={cleanText(entry?.label) || cleanText(link.sourceId)}
          targetId={cleanText(entry?.id)}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ))}

      {related.map((entry) => (
        <LinkRow
          key={`related-${entry.id}`}
          prefix="Related:"
          targetLabel={cleanText(entry.label) || cleanText(entry.id)}
          targetId={cleanText(entry.id)}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ))}
    </div>
  );
}

export default function MetadataPanel({ targetType, targetId }: Props) {
  const [activeLinkedEntryId, setActiveLinkedEntryId] = useState("");

  const items = getMetadataByTarget(targetType, targetId) as MetadataItemLike[];
  const { roots, childrenMap } = groupMetadata(items);

  const activeLinkedContext = useMemo(() => {
    const id = cleanText(activeLinkedEntryId);
    if (!id) return null;
    return getFullMetadataContext(id);
  }, [activeLinkedEntryId]);

  const activeLinkedEntry = activeLinkedContext?.entry ?? null;

  if (!items.length) {
    return (
      <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
        <div className="text-xs text-gray-600">
          No metadata yet for this {targetType}.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border bg-white p-3 text-sm space-y-3">
      <div className="font-semibold text-gray-800">Metadata</div>

      {roots.map((root) => {
        const children = childrenMap.get(root.id) ?? [];
        const rootTags = normalizeTags(root.tags);

        return (
          <div key={root.id} className="border rounded p-3 bg-gray-50">
            <div className="font-medium text-gray-800">
              {cleanText(root.label)}
            </div>

            <div className="mt-1 text-xs text-gray-600">
              {cleanText(root.description)}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded border px-2 py-1">
                {formatKind(root.kind)}
              </span>
              {root.value ? (
                <span className="rounded border px-2 py-1">
                  {cleanText(root.value)}
                </span>
              ) : null}
            </div>

            {rootTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rootTags.map((tag) => (
                  <span
                    key={`${root.id}-tag-${tag}`}
                    className="rounded-full border px-2 py-1 text-[10px] text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <ContextBlock
              entryId={root.id}
              onOpenLinkedEntry={setActiveLinkedEntryId}
            />

            {children.length > 0 ? (
              <div className="mt-3 space-y-2 border-l pl-3">
                {children.map((child) => {
                  const childTags = normalizeTags(child.tags);

                  return (
                    <div key={child.id}>
                      <div className="text-xs font-medium text-gray-700">
                        {cleanText(child.label)}
                      </div>

                      <div className="text-xs text-gray-500">
                        {cleanText(child.description)}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                        <span className="rounded border px-2 py-0.5">
                          {formatKind(child.kind)}
                        </span>
                        {child.value ? (
                          <span className="rounded border px-2 py-0.5">
                            {cleanText(child.value)}
                          </span>
                        ) : null}
                      </div>

                      {childTags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {childTags.map((tag) => (
                            <span
                              key={`${child.id}-tag-${tag}`}
                              className="rounded-full border px-2 py-0.5 text-[10px] text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <ContextBlock
                        entryId={child.id}
                        onOpenLinkedEntry={setActiveLinkedEntryId}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      {activeLinkedEntry ? (
        <LinkedMetadataPreview
          entry={activeLinkedEntry}
          onClose={() => setActiveLinkedEntryId("")}
        />
      ) : null}
    </div>
  );
}