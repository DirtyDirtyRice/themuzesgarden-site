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
  targetType?: MetadataTargetType;
  targetId?: string | null;
};

type Props = {
  targetType: MetadataTargetType;
  targetId: string;
  onMetadataSelect?: (entry: MetadataEntry) => void;
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

function buildSyntheticMetadataEntry(
  source: MetadataItemLike,
  override: {
    idSuffix: string;
    label: string;
    value?: string;
    tags?: string[];
    kind?: string;
  }
): MetadataEntry {
  const sourceId = cleanText(source.id) || "metadata";
  const nextLabel = cleanText(override.label) || "Metadata";
  const nextValue = cleanText(override.value);
  const nextKind = cleanText(override.kind) || "tag";
  const nextTags = Array.isArray(override.tags)
    ? override.tags.map((tag) => cleanText(tag)).filter(Boolean)
    : [];

  return {
    id: `${sourceId}::${override.idSuffix}`,
    targetType: source.targetType ?? "track",
    targetId: cleanText(source.targetId) || "",
    kind: nextKind as MetadataEntry["kind"],
    label: nextLabel,
    value: nextValue || undefined,
    description: source.description ? cleanText(source.description) : undefined,
    parentId: cleanText(source.parentId) || undefined,
    createdAt: new Date(0).toISOString(),
    tags: nextTags,
  };
}

function MetadataChipButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
      onClick={onClick}
      title={title}
    >
      {label}
    </button>
  );
}

function LinkedMetadataPreview({
  entry,
  onClose,
  onMetadataSelect,
}: {
  entry: MetadataEntry;
  onClose: () => void;
  onMetadataSelect?: (entry: MetadataEntry) => void;
}) {
  const tags = normalizeTags(entry.tags);

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-zinc-800">
            {cleanText(entry.label) || "Untitled"}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {cleanText(entry.targetType)}
            {cleanText(entry.targetId)
              ? ` • ${cleanText(entry.targetId)}`
              : ""}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
        >
          Close
        </button>
      </div>

      {cleanText(entry.description) ? (
        <div className="text-xs leading-5 text-zinc-600">
          {cleanText(entry.description)}
        </div>
      ) : (
        <div className="text-xs italic text-zinc-400">
          No description yet.
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        {cleanText(entry.kind) ? (
          <button
            type="button"
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
            onClick={() => onMetadataSelect?.(entry)}
          >
            {formatKind(entry.kind)}
          </button>
        ) : null}

        {cleanText(entry.value) ? (
          <button
            type="button"
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
            onClick={() => onMetadataSelect?.(entry)}
          >
            {cleanText(entry.value)}
          </button>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <MetadataChipButton
              key={`${entry.id}-preview-tag-${tag}`}
              label={tag}
              title={`Filter by ${tag}`}
              onClick={() =>
                onMetadataSelect?.(
                  buildSyntheticMetadataEntry(entry, {
                    idSuffix: `tag-${tag}`,
                    label: tag,
                    value: tag,
                    tags: [tag],
                    kind: "tag",
                  })
                )
              }
            />
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
    <div className="flex flex-wrap items-center gap-1 text-[10px] text-zinc-500">
      <span>{prefix}</span>
      {targetId ? (
        <button
          type="button"
          onClick={() => onOpenLinkedEntry(targetId)}
          className="cursor-pointer underline underline-offset-2 transition hover:text-zinc-800 active:scale-[0.98]"
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

  const {
    parent,
    children,
    resolvedLinksFrom,
    resolvedLinksTo,
    related,
  } = context;

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
          key={
            link.id ??
            `from-${link.sourceId}-${link.targetId}-${link.relationship}-${index}`
          }
          prefix={`→ ${formatRelationship(link.relationship)}:`}
          targetLabel={cleanText(entry?.label) || cleanText(link.targetId)}
          targetId={cleanText(entry?.id)}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ))}

      {resolvedLinksTo.map(({ link, entry }, index) => (
        <LinkRow
          key={
            link.id ??
            `to-${link.sourceId}-${link.targetId}-${link.relationship}-${index}`
          }
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

export default function MetadataPanel({
  targetType,
  targetId,
  onMetadataSelect,
}: Props) {
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
      <div className="mt-3 rounded-xl border bg-white p-3 text-sm">
        <div className="text-xs text-zinc-600">
          No metadata yet for this {targetType}.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      <div className="font-semibold text-zinc-800">Metadata</div>

      {roots.map((root) => {
        const children = childrenMap.get(root.id) ?? [];
        const rootTags = normalizeTags(root.tags);

        return (
          <div
            key={root.id}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm"
          >
            <button
              type="button"
              className="block w-full cursor-pointer rounded-lg text-left transition hover:bg-white/70 active:scale-[0.998] focus:outline-none focus:ring-2 focus:ring-black/10"
              onClick={() => {
                const ctx = getFullMetadataContext(root.id);
                if (ctx && onMetadataSelect) {
                  onMetadataSelect(ctx.entry);
                }
              }}
            >
              <div className="font-medium text-zinc-800">
                {cleanText(root.label)}
              </div>

              <div className="mt-1 text-xs leading-5 text-zinc-600">
                {cleanText(root.description)}
              </div>
            </button>

            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {cleanText(root.kind) ? (
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
                  onClick={() =>
                    onMetadataSelect?.(
                      buildSyntheticMetadataEntry(root, {
                        idSuffix: `kind-${cleanText(root.kind).toLowerCase()}`,
                        label: cleanText(root.kind),
                        value: cleanText(root.kind),
                        tags: [cleanText(root.kind)],
                        kind: "tag",
                      })
                    )
                  }
                >
                  {formatKind(root.kind)}
                </button>
              ) : null}

              {root.value ? (
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
                  onClick={() =>
                    onMetadataSelect?.(
                      buildSyntheticMetadataEntry(root, {
                        idSuffix: `value-${cleanText(root.value).toLowerCase()}`,
                        label: cleanText(root.value),
                        value: cleanText(root.value),
                        tags: [cleanText(root.value)],
                        kind: "tag",
                      })
                    )
                  }
                >
                  {cleanText(root.value)}
                </button>
              ) : null}
            </div>

            {rootTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rootTags.map((tag) => (
                  <MetadataChipButton
                    key={`${root.id}-tag-${tag}`}
                    label={tag}
                    title={`Filter by ${tag}`}
                    onClick={() =>
                      onMetadataSelect?.(
                        buildSyntheticMetadataEntry(root, {
                          idSuffix: `tag-${tag}`,
                          label: tag,
                          value: tag,
                          tags: [tag],
                          kind: "tag",
                        })
                      )
                    }
                  />
                ))}
              </div>
            ) : null}

            <ContextBlock
              entryId={root.id}
              onOpenLinkedEntry={setActiveLinkedEntryId}
            />

            {children.length > 0 ? (
              <div className="mt-3 space-y-2 border-l border-zinc-300 pl-3">
                {children.map((child) => {
                  const childTags = normalizeTags(child.tags);

                  return (
                    <div key={child.id} className="rounded-lg bg-white/80 p-2">
                      <button
                        type="button"
                        className="block w-full cursor-pointer rounded-md text-left transition hover:bg-zinc-50 active:scale-[0.998] focus:outline-none focus:ring-2 focus:ring-black/10"
                        onClick={() => {
                          const childCtx = getFullMetadataContext(child.id);
                          if (childCtx && onMetadataSelect) {
                            onMetadataSelect(childCtx.entry);
                          }
                        }}
                      >
                        <div className="text-xs font-medium text-zinc-700">
                          {cleanText(child.label)}
                        </div>

                        <div className="text-xs leading-5 text-zinc-500">
                          {cleanText(child.description)}
                        </div>
                      </button>

                      <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                        {cleanText(child.kind) ? (
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
                            onClick={() =>
                              onMetadataSelect?.(
                                buildSyntheticMetadataEntry(child, {
                                  idSuffix: `kind-${cleanText(child.kind).toLowerCase()}`,
                                  label: cleanText(child.kind),
                                  value: cleanText(child.kind),
                                  tags: [cleanText(child.kind)],
                                  kind: "tag",
                                })
                              )
                            }
                          >
                            {formatKind(child.kind)}
                          </button>
                        ) : null}

                        {child.value ? (
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 active:scale-[0.97] active:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/15"
                            onClick={() =>
                              onMetadataSelect?.(
                                buildSyntheticMetadataEntry(child, {
                                  idSuffix: `value-${cleanText(child.value).toLowerCase()}`,
                                  label: cleanText(child.value),
                                  value: cleanText(child.value),
                                  tags: [cleanText(child.value)],
                                  kind: "tag",
                                })
                              )
                            }
                          >
                            {cleanText(child.value)}
                          </button>
                        ) : null}
                      </div>

                      {childTags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {childTags.map((tag) => (
                            <MetadataChipButton
                              key={`${child.id}-tag-${tag}`}
                              label={tag}
                              title={`Filter by ${tag}`}
                              onClick={() =>
                                onMetadataSelect?.(
                                  buildSyntheticMetadataEntry(child, {
                                    idSuffix: `tag-${tag}`,
                                    label: tag,
                                    value: tag,
                                    tags: [tag],
                                    kind: "tag",
                                  })
                                )
                              }
                            />
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
          onMetadataSelect={onMetadataSelect}
        />
      ) : null}
    </div>
  );
}