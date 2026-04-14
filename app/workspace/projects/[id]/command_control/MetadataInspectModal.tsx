"use client";

import MetadataPanel from "../../../../../player/MetadataPanel";
import type { MetadataEntry } from "../../../../../lib/metadata/metadataTypes";
import type { PanelState } from "./panelTypes";

type Props = {
  panel: PanelState | null;
  onClose: () => void;
  onMetadataSelect: (entry: MetadataEntry) => void;
};

export default function MetadataInspectModal({
  panel,
  onClose,
  onMetadataSelect,
}: Props) {
  if (!panel || !panel.isOpen) return null;

  const trackId = String(panel.target.trackId ?? "").trim();
  if (!trackId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={panel.title || "Metadata inspector"}
    >
      <div
        className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-900">
              {panel.title || "Inspect Track Metadata"}
            </div>

            {panel.subtitle ? (
              <div className="mt-1 truncate text-xs text-zinc-500">
                {panel.subtitle}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-xs transition hover:bg-zinc-50 active:scale-[0.98]"
              onClick={onClose}
              aria-label="Close metadata window"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-3 py-3 sm:px-4 sm:py-4">
          <div className="mx-auto w-full max-w-5xl rounded-xl border bg-white p-3 shadow-sm sm:p-4">
            <MetadataPanel
              targetType="track"
              targetId={trackId}
              onMetadataSelect={onMetadataSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}