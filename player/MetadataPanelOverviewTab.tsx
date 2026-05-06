"use client";

import type { MetadataEntry } from "../lib/metadata/metadataTypes";
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
      {kind && (
        <MetadataPanelPillButton label={kind} onClick={handleSelect} />
      )}
      {value && (
        <MetadataPanelPillButton label={value} onClick={handleSelect} />
      )}
    </div>
  );
}

function getStrengthStyle(strength?: string) {
  if (strength === "strong") return "border-white text-white";
  if (strength === "medium") return "border-white/40 text-white";
  return "border-white/20 text-white/70";
}

export default function MetadataPanelOverviewTab({
  overviewItem,
  allTags,
  relatedMetadata,
  activeLinkedEntry,
  onCloseLinkedEntry,
  onMetadataSelect,
}: {
  overviewItem: MetadataItemLike | null;
  allTags: string[];
  relatedMetadata: MetadataEntry[];
  activeLinkedEntry: MetadataEntry | null;
  onCloseLinkedEntry: () => void;
  onMetadataSelect?: (entry: MetadataEntry) => void;
}) {
  return (
    <div className="space-y-3">
      {overviewItem && (
        <div className="rounded-xl border border-white/15 bg-black p-3">
          <div className="text-sm font-semibold text-white">
            {cleanText(overviewItem.label) || "Untitled"}
          </div>

          <div className="mt-2 text-sm text-white/70">
            {cleanText(overviewItem.description) || "No description yet."}
          </div>

          {/* NEW: metadata summary */}
          <div className="mt-2 text-[11px] text-white/50">
            {allTags.length} tag{allTags.length !== 1 ? "s" : ""} •{" "}
            {relatedMetadata.length} related
          </div>

          <MetadataValueRow
            item={overviewItem}
            onMetadataSelect={onMetadataSelect}
          />

          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <MetadataPanelPillButton
                  key={`overview-tag-${tag}`}
                  label={tag}
                  rounded="full"
                  onClick={() =>
                    onMetadataSelect?.(
                      buildSyntheticMetadataEntry(overviewItem, {
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
          )}

          {relatedMetadata.length > 0 && (
            <div className="mt-4 border-t border-white/15 pt-3">
              <div className="mb-2 text-xs font-semibold text-white">
                Related (ranked)
              </div>

              <div className="flex flex-wrap gap-2">
                {relatedMetadata.map((entry: any) => {
                  const strength = entry._strength;
                  const confidence = entry._confidence;

                  return (
                    <MetadataPanelPillButton
                      key={`related-${entry.id}`}
                      label={
                        cleanText(entry.label) ||
                        cleanText(entry.value) ||
                        "Untitled"
                      }
                      rounded="full"
                      className={getStrengthStyle(strength)}
                      title={
                        confidence
                          ? `Confidence: ${confidence} (${strength})`
                          : undefined
                      }
                      onClick={() => onMetadataSelect?.(entry)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeLinkedEntry && (
        <div className="rounded-xl border border-white/15 bg-black p-3">
          <div className="flex justify-between">
            <div className="text-sm font-semibold text-white">
              {cleanText(activeLinkedEntry.label) || "Untitled"}
            </div>
            <MetadataPanelPillButton label="Close" onClick={onCloseLinkedEntry} />
          </div>

          <div className="mt-2 text-sm text-white/70">
            {cleanText(activeLinkedEntry.description) || "No description yet."}
          </div>
        </div>
      )}
    </div>
  );
}