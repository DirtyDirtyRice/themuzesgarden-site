"use client";

import {
  getMultiTrackAdapterDemoCandidateGroups,
} from "../adapters/multiTrackAdapterDemoSeed";
import type {
  MultiTrackAdapterSource,
  MultiTrackAdapterTrackCandidate,
} from "../adapters/multiTrackAdapterTypes";
import type {
  MultiTrackControllerTrackSlot,
} from "./multiTrackControllerTypes";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

type CandidateSource = Extract<
  MultiTrackAdapterSource,
  "finder" | "library" | "metadata"
>;

type Props = {
  onSelectCandidate: (
    source: CandidateSource,
    trackSlotId: MultiTrackControllerTrackSlot["id"],
    candidate: MultiTrackAdapterTrackCandidate,
  ) => void;
};

function sourceLabel(source: CandidateSource) {
  if (source === "finder") return "Finder";
  if (source === "library") return "Library";
  return "Metadata";
}

export function MultiTrackAdapterCandidatePanel({
  onSelectCandidate,
}: Props) {
  const groups = getMultiTrackAdapterDemoCandidateGroups();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Adapter Candidate Lab
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            Finder / Library / Metadata Candidates
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            Demo candidates prove that external systems can feed Multi-Track
            through adapters instead of bloating the controller with Finder,
            Library, or Metadata imports.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
          {groups.reduce((count, group) => count + group.candidates.length, 0)} candidates
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {groups.map((group) => (
          <article key={group.source} className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
                  {sourceLabel(group.source)}
                </p>
                <h3 className="mt-2 text-sm font-black text-white">
                  {group.label}
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/60">
                {group.candidates.length}
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-white/55">
              {group.detail}
            </p>

            <div className="mt-4 grid gap-3">
              {group.candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <p className="text-xs font-black text-white/85">
                    {candidate.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/55">
                    {candidate.detail}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className={buttonClass}
                      type="button"
                      onClick={() =>
                        onSelectCandidate(group.source, "track-a", candidate)
                      }
                    >
                      Send to Track A
                    </button>

                    <button
                      className={buttonClass}
                      type="button"
                      onClick={() =>
                        onSelectCandidate(group.source, "track-b", candidate)
                      }
                    >
                      Send to Track B
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}