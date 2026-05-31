"use client";

import type {
  MultiTrackSaveDestination,
  MultiTrackSaveRecordPreview,
  MultiTrackSaveRouteOption,
} from "../session/multiTrackSaveTypes";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

function destinationLabel(destination: MultiTrackSaveDestination) {
  if (destination === "project") return "Project";
  if (destination === "library") return "Library";
  if (destination === "metadata") return "Metadata";
  if (destination === "finder") return "Finder";
  return "Export";
}

export function MultiTrackSavePreviewPanel({
  activeDestination,
  onSelectDestination,
  routeOptions,
  savePreview,
}: {
  activeDestination: MultiTrackSaveDestination;
  onSelectDestination: (destination: MultiTrackSaveDestination) => void;
  routeOptions: MultiTrackSaveRouteOption[];
  savePreview: MultiTrackSaveRecordPreview;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Save Preview
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            {savePreview.title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            Prepares the future saved analysis record without writing to a
            database. This keeps save logic outside the controller body and
            prevents a giant save/runtime tangle.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
          {destinationLabel(activeDestination)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {routeOptions.map((option) => (
          <button
            key={option.destination}
            className={`${buttonClass} ${
              activeDestination === option.destination
                ? "border-white/25 bg-white/[0.14] text-white"
                : ""
            }`}
            type="button"
            onClick={() => onSelectDestination(option.destination)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <article className={cardClass}>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Track Pair Snapshot
          </p>

          <div className="mt-3 grid gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-xs font-black text-white/80">
                Track A
              </p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                {savePreview.trackASelection?.title ?? "No Track A selected"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-xs font-black text-white/80">
                Track B
              </p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                {savePreview.trackBSelection?.title ?? "No Track B selected"}
              </p>
            </div>
          </div>
        </article>

        <article className={cardClass}>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Decision Snapshot
          </p>
          <p className="mt-2 text-sm font-black text-white/80">
            {savePreview.decision.label}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/55">
            {savePreview.decision.detail}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {savePreview.readiness.map((item) => (
          <article key={item.label} className={cardClass}>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
              {item.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/55">
              {item.detail}
            </p>
            <p className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/55">
              {item.status}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}