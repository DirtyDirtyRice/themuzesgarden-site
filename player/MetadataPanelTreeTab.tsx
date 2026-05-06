"use client";

import { useState } from "react";
import type { MetadataEntry } from "../lib/metadata/metadataTypes";
import MetadataPanelContextBlock from "./MetadataPanelContextBlock";
import MetadataPanelPillButton from "./MetadataPanelPillButton";
import type { MetadataItemLike } from "./metadataPanelTypes";
import {
  buildSyntheticMetadataEntry,
  cleanText,
  formatKind,
  normalizeTags,
  selectRealEntry,
} from "./metadataPanelUtils";

function MetadataTagRow({
  source,
  tags,
  onMetadataSelect,
}: {
  source: MetadataItemLike;
  tags: string[];
  onMetadataSelect?: (entry: MetadataEntry) => void;
}) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <MetadataPanelPillButton
          key={`${source.id}-tag-${tag}`}
          label={tag}
          rounded="full"
          title={`Filter by ${tag}`}
          onClick={() =>
            onMetadataSelect?.(
              buildSyntheticMetadataEntry(source, {
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
  );
}

function MetadataValueRow({
  item,
  onMetadataSelect,
}: {
  item: MetadataItemLike;
  onMetadataSelect?: (entry: MetadataEntry) => void;
}) {
  const kind = formatKind(item.kind);
  const value = cleanText(item.value);

  if (!kind && !value) return null;

  const handleSelect = () =>
    selectRealEntry(cleanText(item.id), onMetadataSelect);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {kind ? (
        <MetadataPanelPillButton label={kind} onClick={handleSelect} />
      ) : null}
      {value ? (
        <MetadataPanelPillButton label={value} onClick={handleSelect} />
      ) : null}
    </div>
  );
}

function MetadataCard({
  item,
  children,
  nested = false,
  onMetadataSelect,
  onOpenLinkedEntry,
}: {
  item: MetadataItemLike;
  children?: MetadataItemLike[];
  nested?: boolean;
  onMetadataSelect?: (entry: MetadataEntry) => void;
  onOpenLinkedEntry: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(!nested);

  const tags = normalizeTags(item.tags);
  const label = cleanText(item.label) || "Untitled";
  const description = cleanText(item.description);
  const childCount = children?.length ?? 0;

  return (
    <div
      className={[
        nested
          ? "rounded-lg border bg-black p-2"
          : "rounded-xl border bg-black p-3",
        "border-white/15",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="!block !w-full !rounded-md !border-0 !bg-black !p-0 !text-left"
          onClick={() => selectRealEntry(cleanText(item.id), onMetadataSelect)}
        >
          <div
            className={
              nested
                ? "text-xs font-medium text-[color:var(--text-strong)]"
                : "text-sm font-semibold text-[color:var(--text-strong)]"
            }
          >
            {label}
          </div>

          <div className="mt-1 text-[11px] text-[color:var(--text-normal)]">
            {formatKind(item.kind) || "metadata"}
            {cleanText(item.value) ? ` • ${cleanText(item.value)}` : ""}
            {childCount > 0 ? ` • ${childCount} child${childCount > 1 ? "ren" : ""}` : ""}
          </div>

          <div className="mt-1 text-sm leading-6 text-[color:var(--text-normal)]">
            {description || "No description yet."}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="!shrink-0 !rounded-lg !border !border-white/20 !bg-black !px-2.5 !py-1 !text-[11px] !text-[color:var(--text-normal)]"
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "Hide" : "Show"}
        </button>
      </div>

      {expanded ? (
        <>
          <MetadataValueRow item={item} onMetadataSelect={onMetadataSelect} />

          <MetadataTagRow
            source={item}
            tags={tags}
            onMetadataSelect={onMetadataSelect}
          />

          <MetadataPanelContextBlock
            entryId={cleanText(item.id)}
            onOpenLinkedEntry={onOpenLinkedEntry}
          />

          {children && children.length > 0 ? (
            <div className="mt-3 space-y-2 border-l border-white/15 pl-3">
              {children.map((child) => (
                <MetadataCard
                  key={child.id}
                  item={child}
                  children={[]}
                  nested
                  onMetadataSelect={onMetadataSelect}
                  onOpenLinkedEntry={onOpenLinkedEntry}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default function MetadataPanelTreeTab({
  roots,
  childrenMap,
  onMetadataSelect,
  onOpenLinkedEntry,
}: {
  roots: MetadataItemLike[];
  childrenMap: Map<string, MetadataItemLike[]>;
  onMetadataSelect?: (entry: MetadataEntry) => void;
  onOpenLinkedEntry: (id: string) => void;
}) {
  if (!roots.length) {
    return (
      <div className="rounded-xl border border-white/15 bg-black p-3">
        <div className="text-sm font-semibold text-[color:var(--text-strong)]">
          Tree
        </div>
        <div className="mt-2 text-sm text-[color:var(--text-normal)]">
          No metadata hierarchy available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/15 bg-black p-3">
        <div className="text-sm font-semibold text-[color:var(--text-strong)]">
          Metadata Tree
        </div>
        <div className="mt-2 text-sm leading-6 text-[color:var(--text-normal)]">
          Explore hierarchical relationships. Expand items to reveal deeper structure.
        </div>
      </div>

      {roots.map((root) => (
        <MetadataCard
          key={root.id}
          item={root}
          children={childrenMap.get(root.id) ?? []}
          onMetadataSelect={onMetadataSelect}
          onOpenLinkedEntry={onOpenLinkedEntry}
        />
      ))}
    </div>
  );
}