"use client";

type Props = {
  prefix: string;
  targetLabel: string;
  targetId: string;
  onOpenLinkedEntry: (id: string) => void;
};

export default function MetadataPanelLinkRow({
  prefix,
  targetLabel,
  targetId,
  onOpenLinkedEntry,
}: Props) {
  const cleanPrefix = prefix.trim();
  const cleanLabel = targetLabel.trim() || "Untitled";
  const cleanTargetId = targetId.trim();

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-[color:var(--text-normal)]">{cleanPrefix}</span>

      {cleanTargetId ? (
        <button
          type="button"
          onClick={() => onOpenLinkedEntry(cleanTargetId)}
          className="rounded-sm text-[color:var(--text-strong)] underline underline-offset-2 transition-opacity hover:opacity-80"
          title={`Open ${cleanLabel}`}
        >
          {cleanLabel}
        </button>
      ) : (
        <span className="text-[color:var(--text-strong)]">{cleanLabel}</span>
      )}
    </div>
  );
}