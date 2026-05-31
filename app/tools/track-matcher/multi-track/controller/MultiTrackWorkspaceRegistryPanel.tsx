"use client";

import { useMultiTrackWorkspaceMetrics } from "./useMultiTrackWorkspaceMetrics";

export function MultiTrackWorkspaceRegistryPanel() {
  const {
    groups,
    largestGroupLabel,
    metrics,
    summary,
  } = useMultiTrackWorkspaceMetrics();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Workspace Registry
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            Multi-Track Workspace Map
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            Tracks every major Multi-Track workspace before controller
            routing, runtime integration, timeline analysis, save systems,
            metadata systems, and AI systems are connected.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
          <p className="text-xs font-black text-white/75">
            {summary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
            Total Workspaces
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {metrics.totalWorkspaces}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
            Foundation
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {metrics.foundationCount}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
            Planned
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {metrics.plannedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
            Largest Group
          </p>

          <p className="mt-2 text-sm font-black text-white">
            {largestGroupLabel}
          </p>
        </article>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {groups.map((group) => (
          <article
            key={group.label}
            className="rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <h3 className="text-sm font-black text-white">
              {group.label}
            </h3>

            <div className="mt-3 grid gap-2">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <p className="text-xs font-black text-white/80">
                    {item.label}
                  </p>

                  <p className="mt-1 text-[0.65rem] text-white/50">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}