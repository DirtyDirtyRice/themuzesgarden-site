"use client";

import { getFullMetadataContext } from "../lib/metadata/metadataApi";
import MetadataPanelLinkRow from "./MetadataPanelLinkRow";
import { cleanText, formatRelationship } from "./metadataPanelUtils";

type Props = {
  entryId: string;
  onOpenLinkedEntry: (id: string) => void;
};

type LinkSectionRow = {
  key: string;
  prefix: string;
  targetLabel: string;
  targetId: string;
};

const MAX_ROWS_PER_SECTION = 6;

function ContextSection({
  title,
  rows,
  onOpenLinkedEntry,
}: {
  title: string;
  rows: LinkSectionRow[];
  onOpenLinkedEntry: (id: string) => void;
}) {
  if (!rows.length) return null;

  const visibleRows = rows.slice(0, MAX_ROWS_PER_SECTION);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-normal)]">
        {title}
      </div>

      <div className="space-y-1">
        {visibleRows.map((row) => (
          <MetadataPanelLinkRow
            key={row.key}
            prefix={row.prefix}
            targetLabel={row.targetLabel}
            targetId={row.targetId}
            onOpenLinkedEntry={onOpenLinkedEntry}
          />
        ))}
      </div>

      {hiddenCount > 0 ? (
        <div className="text-[11px] text-[color:var(--text-normal)]">
          +{hiddenCount} more
        </div>
      ) : null}
    </div>
  );
}

export default function MetadataPanelContextBlock({
  entryId,
  onOpenLinkedEntry,
}: Props) {
  const context = getFullMetadataContext(entryId);
  if (!context) return null;

  const {
    parent,
    children,
    resolvedLinksFrom,
    resolvedLinksTo,
    related,
  } = context;

  const parentRows: LinkSectionRow[] = parent
    ? [
        {
          key: `parent-${cleanText(parent.id)}`,
          prefix: "Parent:",
          targetLabel: cleanText(parent.label) || cleanText(parent.id),
          targetId: cleanText(parent.id),
        },
      ]
    : [];

  const childRows: LinkSectionRow[] = children
    .map((child) => ({
      key: `child-${cleanText(child.id)}`,
      prefix: "Child:",
      targetLabel: cleanText(child.label) || cleanText(child.id),
      targetId: cleanText(child.id),
    }))
    .filter((row) => row.targetId);

  const outgoingRows: LinkSectionRow[] = resolvedLinksFrom
    .map(({ link, entry }, index) => ({
      key:
        cleanText(link.id) ||
        `from-${cleanText(link.sourceId)}-${cleanText(link.targetId)}-${cleanText(link.relationship)}-${index}`,
      prefix: `→ ${formatRelationship(link.relationship)}:`,
      targetLabel: cleanText(entry?.label) || cleanText(link.targetId),
      targetId: cleanText(entry?.id) || cleanText(link.targetId),
    }))
    .filter((row) => row.targetId);

  const incomingRows: LinkSectionRow[] = resolvedLinksTo
    .map(({ link, entry }, index) => ({
      key:
        cleanText(link.id) ||
        `to-${cleanText(link.sourceId)}-${cleanText(link.targetId)}-${cleanText(link.relationship)}-${index}`,
      prefix: `← ${formatRelationship(link.relationship)}:`,
      targetLabel: cleanText(entry?.label) || cleanText(link.sourceId),
      targetId: cleanText(entry?.id) || cleanText(link.sourceId),
    }))
    .filter((row) => row.targetId);

  const relatedRows: LinkSectionRow[] = related
    .map((entry) => ({
      key: `related-${cleanText(entry.id)}`,
      prefix: "Related:",
      targetLabel: cleanText(entry.label) || cleanText(entry.id),
      targetId: cleanText(entry.id),
    }))
    .filter((row) => row.targetId);

  const totalCount =
    parentRows.length +
    childRows.length +
    outgoingRows.length +
    incomingRows.length +
    relatedRows.length;

  if (!totalCount) return null;

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-white/10 bg-black px-2 py-2">
      <div>
        <div className="text-xs font-semibold text-[color:var(--text-strong)]">
          Context
        </div>
        <div className="mt-1 text-[11px] text-[color:var(--text-normal)]">
          {totalCount} connection{totalCount === 1 ? "" : "s"}
        </div>
      </div>

      <ContextSection
        title="Hierarchy"
        rows={[...parentRows, ...childRows]}
        onOpenLinkedEntry={onOpenLinkedEntry}
      />

      <ContextSection
        title="Outgoing Links"
        rows={outgoingRows}
        onOpenLinkedEntry={onOpenLinkedEntry}
      />

      <ContextSection
        title="Incoming Links"
        rows={incomingRows}
        onOpenLinkedEntry={onOpenLinkedEntry}
      />

      <ContextSection
        title="Related"
        rows={relatedRows}
        onOpenLinkedEntry={onOpenLinkedEntry}
      />
    </div>
  );
}