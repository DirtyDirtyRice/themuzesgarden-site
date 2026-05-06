"use client";

import { getCardActionHint } from "./RelationshipRecordCardHelpers";

export function RecordCardFooter({
  expanded,
  onToggleExpanded,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  return (
    <div className="mt-3 flex justify-between items-center">
      <div>
        <p className="text-[10px] text-white/35">
          {expanded ? "Expanded view" : "Compact view"}
        </p>
        <p className="text-[10px] text-white/30">
          {getCardActionHint(expanded)}
        </p>
      </div>

      <button
        onClick={onToggleExpanded}
        className="border border-white/30 px-2 py-1 text-xs text-white"
      >
        {expanded ? "Hide" : "Why this?"}
      </button>
    </div>
  );
}