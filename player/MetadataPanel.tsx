"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getFullMetadataContext,
  getMetadataByTarget,
} from "../lib/metadata/metadataApi";
import MetadataPanelLinksTab from "./MetadataPanelLinksTab";
import MetadataPanelOverviewTab from "./MetadataPanelOverviewTab";
import MetadataPanelTreeTab from "./MetadataPanelTreeTab";
import type {
  MetadataItemLike,
  MetadataPanelProps,
} from "./metadataPanelTypes";
import { getRankedRelatedMetadata } from "./metadataPanelRelated";
import { cleanText, groupMetadata, normalizeTags } from "./metadataPanelUtils";

type MetadataViewTab = "overview" | "tree" | "links";

function MetadataTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "!rounded-lg !border !px-3 !py-1.5 !text-xs !font-medium",
        active
          ? "!border-white !bg-black !text-[color:var(--text-strong)]"
          : "!border-white/20 !bg-black !text-[color:var(--text-normal)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function MetadataPanel({
  targetType,
  targetId,
  onMetadataSelect,
}: MetadataPanelProps) {
  const [activeLinkedEntryId, setActiveLinkedEntryId] = useState("");
  const [activeTab, setActiveTab] = useState<MetadataViewTab>("overview");

  const items = useMemo(() => {
    return getMetadataByTarget(targetType, targetId) as MetadataItemLike[];
  }, [targetType, targetId]);

  const { roots, childrenMap } = useMemo(() => {
    return groupMetadata(items);
  }, [items]);

  const activeLinkedEntry = useMemo(() => {
    const id = cleanText(activeLinkedEntryId);
    if (!id) return null;
    return getFullMetadataContext(id)?.entry ?? null;
  }, [activeLinkedEntryId]);

  const allTags = useMemo(() => {
    return Array.from(
      new Set(items.flatMap((item) => normalizeTags(item.tags)))
    ).slice(0, 12);
  }, [items]);

  const overviewItem = useMemo(() => {
    return roots[0] ?? items[0] ?? null;
  }, [roots, items]);

  const relatedMetadata = useMemo(() => {
    if (!overviewItem) return [];

    return getRankedRelatedMetadata({
      id: cleanText(overviewItem.id),
      label: cleanText(overviewItem.label),
      value: cleanText(overviewItem.value),
      description: cleanText(overviewItem.description),
      kind: cleanText(overviewItem.kind),
      tags: normalizeTags(overviewItem.tags),
    });
  }, [overviewItem]);

  const linkableCount = useMemo(() => {
    return items.filter((item) => {
      return Boolean(cleanText(item.id));
    }).length;
  }, [items]);

  useEffect(() => {
    setActiveLinkedEntryId("");
    setActiveTab("overview");
  }, [targetType, targetId]);

  function handleCloseLinkedEntry() {
    setActiveLinkedEntryId("");
  }

  function handleOpenLinkedEntry(entryId: string) {
    setActiveLinkedEntryId(entryId);
    setActiveTab("links");
  }

  if (!items.length) {
    return (
      <div className="mt-3 rounded-xl border border-white/15 bg-black p-3 text-sm">
        <div className="text-[color:var(--text-normal)]">
          No metadata yet for this {targetType}.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/15 bg-black p-3 text-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-[color:var(--text-strong)]">
            Metadata
          </div>
          <div className="mt-1 text-xs text-[color:var(--text-normal)]">
            {items.length} item{items.length === 1 ? "" : "s"} • {allTags.length}{" "}
            tag{allTags.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetadataTabButton
            active={activeTab === "overview"}
            label={`Overview${overviewItem ? " (1)" : ""}`}
            onClick={() => setActiveTab("overview")}
          />
          <MetadataTabButton
            active={activeTab === "tree"}
            label={`Tree (${roots.length})`}
            onClick={() => setActiveTab("tree")}
          />
          <MetadataTabButton
            active={activeTab === "links"}
            label={`Links (${linkableCount})`}
            onClick={() => setActiveTab("links")}
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto pr-1">
        {activeTab === "overview" ? (
          <MetadataPanelOverviewTab
            overviewItem={overviewItem}
            allTags={allTags}
            relatedMetadata={relatedMetadata}
            activeLinkedEntry={activeLinkedEntry}
            onCloseLinkedEntry={handleCloseLinkedEntry}
            onMetadataSelect={onMetadataSelect}
          />
        ) : null}

        {activeTab === "tree" ? (
          <MetadataPanelTreeTab
            roots={roots}
            childrenMap={childrenMap}
            onMetadataSelect={onMetadataSelect}
            onOpenLinkedEntry={handleOpenLinkedEntry}
          />
        ) : null}

        {activeTab === "links" ? (
          <MetadataPanelLinksTab
            roots={roots}
            activeLinkedEntry={activeLinkedEntry}
            onOpenLinkedEntry={handleOpenLinkedEntry}
            onCloseLinkedEntry={handleCloseLinkedEntry}
            onMetadataSelect={onMetadataSelect}
          />
        ) : null}
      </div>
    </div>
  );
}