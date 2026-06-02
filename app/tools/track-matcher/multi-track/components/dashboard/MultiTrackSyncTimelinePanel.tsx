"use client";

import type { MultiTrackEngineSyncAnchor } from "../../engine/multiTrackEngineSyncTypes";

type Props = {
  anchors: MultiTrackEngineSyncAnchor[];
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

export function MultiTrackSyncTimelinePanel({
  anchors,
}: Props) {
  return (
    <section className={panelClass}>
      <h2 className="text-2xl font-black">
        Sync Timeline
      </h2>

      <div className="mt-5 space-y-3">
        {anchors.map((anchor) => (
          <div
            key={anchor.id}
            className="rounded-2xl border border-white/10 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-black">
                {anchor.label}
              </span>

              <span className="text-sm text-white/70">
                {anchor.seconds.toFixed(3)}s
              </span>
            </div>

            <p className="mt-3 text-sm text-white/70">
              {anchor.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}