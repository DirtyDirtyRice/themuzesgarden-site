"use client";

import type { TrackMatcherLaneMetadata } from "./trackMatcherControllerTypes";
import TrackMatcherLaneCard from "./TrackMatcherLaneCard";

type TrackMatcherLaneSectionProps = {
  columns: string;
  defaultOpen?: boolean;
  lanes: TrackMatcherLaneMetadata[];
  subtitle: string;
  title: string;
};

export default function TrackMatcherLaneSection({
  columns,
  defaultOpen = false,
  lanes,
  subtitle,
  title,
}: TrackMatcherLaneSectionProps) {
  return (
    <details
      className="group rounded-3xl border border-white/10 bg-black/40 p-4"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-2xl p-1 transition-transform duration-150 hover:-translate-y-0.5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black text-lg font-black text-white transition-transform duration-150 group-open:rotate-90">
            ›
          </span>

          <div className="min-w-0">
            <h3 className="text-lg font-black text-white">{title}</h3>

            <p className="mt-1 text-sm leading-6 text-white/60">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            {lanes.length} Lanes
          </span>

          <span className="rounded-full border border-white/10 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 group-open:hidden">
            Open
          </span>

          <span className="hidden rounded-full border border-white/10 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 group-open:inline-flex">
            Close
          </span>
        </div>
      </summary>

      <div className={`mt-4 grid gap-4 border-t border-white/10 pt-4 ${columns}`}>
        {lanes.map((lane) => (
          <TrackMatcherLaneCard key={lane.laneId} lane={lane} />
        ))}
      </div>
    </details>
  );
}
