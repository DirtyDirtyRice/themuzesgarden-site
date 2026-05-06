"use client";

import type { MetadataEntry } from "../lib/metadata/metadataTypes";
import MetadataPanelContextBlock from "./MetadataPanelContextBlock";
import MetadataPanelPillButton from "./MetadataPanelPillButton";
import type { MetadataItemLike } from "./metadataPanelTypes";
import {
  buildSyntheticMetadataEntry,
  cleanText,
  formatKind,
  normalizeTags,
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
  const kind = formatKind(entry.kind);
  const value = cleanText(entry.value);

  return (
    <div className="mt-3 rounded-xl border border-white/15 bg-black p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:var(--text-strong)]">
            {cleanText(entry.label) || "Untitled"}
          </div>
          <div className="mt-1 text-[11px] text-[color:var(--text-normal)]">
            {cleanText(entry.targetType)}
            {cleanText(entry.targetId) ? ` • ${cleanText(entry.targetId)}` : ""}
          </div>
        </div>

        <MetadataPanelPillButton label="Close" onClick={onClose} />
      </div>

      <div className="text-sm leading-6 text-[color:var(--text-normal)]">
        {cleanText(entry.description) || "No description yet."}
      </div>

      {kind || value ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {kind ? (
            <MetadataPanelPillButton
              label={kind}
              onClick={() => onMetadataSelect?.(entry)}
            />
          ) : null}
          {value ? (
            <MetadataPanelPillButton
              label={value}
              onClick={() => onMetadataSelect?.(entry)}
            />
          ) : null}
        </div>
      ) : null}

      <MetadataTagRow
        source={entry}
        tags={tags}
        onMetadataSelect={onMetadataSelect}
      />
    </div>
  );
}

export default function MetadataPanelLinksTab({
  roots,
  activeLinkedEntry,
  onOpenLinkedEntry,
  onCloseLinkedEntry,
  onMetadataSelect,
}: {
  roots: MetadataItemLike[];
  activeLinkedEntry: MetadataEntry | null;
  onOpenLinkedEntry: (id: string) => void;
  onCloseLinkedEntry: () => void;
  onMetadataSelect?: (entry: MetadataEntry) => void;
}) {
  if (!roots.length) {
    return (
      <div className="rounded-xl border border-white/15 bg-black p-3">
        <div className="text-sm font-semibold text-[color:var(--text-strong)]">
          Links
        </div>
        <div className="mt-2 text-sm text-[color:var(--text-normal)]">
          No linked metadata is available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/15 bg-black p-3">
        <div className="text-sm font-semibold text-[color:var(--text-strong)]">
          Linked Context
        </div>
        <div className="mt-2 text-sm leading-6 text-[color:var(--text-normal)]">
          Open linked metadata from any root item below. The selected preview
          appears at the bottom of this tab.
        </div>

        {activeLinkedEntry ? (
          <div className="mt-3">
            <MetadataPanelPillButton
              label="Clear Preview"
              rounded="full"
              onClick={onCloseLinkedEntry}
            />
          </div>
        ) : null}
      </div>

      {roots.map((root) => {
        const rootId = cleanText(root.id);
        const isActiveRoot =
          cleanText(activeLinkedEntry?.targetId) === rootId ||
          cleanText(activeLinkedEntry?.id) === rootId;

        return (
          <div
            key={`links-${root.id}`}
            className={[
              "rounded-xl border bg-black p-3",
              isActiveRoot ? "border-white" : "border-white/15",
            ].join(" ")}
          >
            <div className="text-sm font-semibold text-[color:var(--text-strong)]">
              {cleanText(root.label) || "Untitled"}
            </div>

            <div className="mt-1 text-[11px] text-[color:var(--text-normal)]">
              {formatKind(root.kind) || "metadata"}
              {cleanText(root.value) ? ` • ${cleanText(root.value)}` : ""}
            </div>

            <MetadataPanelContextBlock
              entryId={rootId}
              onOpenLinkedEntry={onOpenLinkedEntry}
            />
          </div>
        );
      })}

      {activeLinkedEntry ? (
        <LinkedMetadataPreview
          entry={activeLinkedEntry}
          onClose={onCloseLinkedEntry}
          onMetadataSelect={onMetadataSelect}
        />
      ) : null}
    </div>
  );
}