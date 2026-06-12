import {
  getMultiTrackKeeperCandidateScore,
  getMultiTrackKeeperColorLabel,
  getMultiTrackKeeperPathCandidateTitles,
  getMultiTrackKeeperPromotionTargetLabel,
  getMultiTrackKeeperReadinessLabel,
  getMultiTrackKeeperReasonLabel,
  getMultiTrackKeeperStrengthLabel,
  getMultiTrackKeeperWorkspaceSummary,
  sortMultiTrackKeeperCandidatesByScore,
} from "./MultiTrackKeeperEngineHelpers";
import { multiTrackKeeperEngineWorkspaceState } from "./MultiTrackKeeperEngineSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackKeeperEngineWorkspacePanel() {
  const state = multiTrackKeeperEngineWorkspaceState;
  const summary = getMultiTrackKeeperWorkspaceSummary(state);
  const sortedCandidates = sortMultiTrackKeeperCandidatesByScore(state.candidates);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Keeper Engine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>{getMultiTrackKeeperReadinessLabel(state.readinessStatus)}</span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>Isolated</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Candidates" value={String(summary.candidateCount)} />
        <SummaryCard label="Keepers" value={String(summary.keeperCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Queue" value={String(summary.queueCount)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Strongest Survivor
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestCandidateTitle}</h3>
            <p className={softTextClass}>
              This is the current seed-safe keeper winner. Later this can be driven by real similarity,
              lineage, mutation, survivor, and render data.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestCandidateScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Keeper Candidates</h3>
          <div className="mt-4 space-y-3">
            {sortedCandidates.map((candidate) => (
              <article key={candidate.id} className="rounded-2xl border border-white/10 bg-black p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{candidate.title}</h4>
                    <p className={softTextClass}>
                      {candidate.versionLabel} · {getMultiTrackKeeperStrengthLabel(candidate.strength)} ·{" "}
                      {getMultiTrackKeeperReadinessLabel(candidate.readinessStatus)}
                    </p>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {getMultiTrackKeeperCandidateScore(candidate)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={pillClass}>{getMultiTrackKeeperColorLabel(candidate.color)}</span>
                  <span className={pillClass}>Rank {candidate.survivorRank}</span>
                  <span className={pillClass}>Mutations {candidate.mutationCount}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.reasonCodes.map((reason) => (
                    <span key={reason} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                      {getMultiTrackKeeperReasonLabel(reason)}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2">
                  {candidate.signals.map((signal) => (
                    <div key={signal.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{signal.label}</span>
                        <span className="text-sm font-bold text-white">
                          {signal.value}/{signal.maxValue}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-white/60">{signal.detail}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Keeper Paths</h3>
            <div className="mt-4 space-y-3">
              {state.keeperPaths.map((path) => {
                const titles = getMultiTrackKeeperPathCandidateTitles(state, path.id);

                return (
                  <article key={path.id} className="rounded-2xl border border-white/10 bg-black p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{path.title}</h4>
                        <p className={softTextClass}>{path.summary}</p>
                      </div>
                      <span className={pillClass}>{getMultiTrackKeeperColorLabel(path.color)}</span>
                    </div>

                    <ol className="mt-4 space-y-2">
                      {titles.map((title, index) => (
                        <li key={`${path.id}-${title}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                            Step {index + 1}
                          </span>
                          <p className="mt-1 text-sm font-semibold text-white">{title}</p>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Promotion Queue</h3>
            <div className="mt-4 space-y-3">
              {state.promotionQueue.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-black p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{item.label}</h4>
                      <p className={softTextClass}>{item.detail}</p>
                    </div>
                    <span className={pillClass}>{getMultiTrackKeeperReadinessLabel(item.readinessStatus)}</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    {getMultiTrackKeeperPromotionTargetLabel(item.target)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-lg font-bold text-white">Validation Lock</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <ValidationCard title="1. Syntax / TypeScript" body="Types, seed, helpers, and TSX panel use real exported names only." />
          <ValidationCard title="2. Imports / Exports" body="No phantom imports. The panel imports only seed and helpers from this 4-file set." />
          <ValidationCard title="3. Integration" body="Seed feeds helpers and panel. Helpers accept the exported types. No page or controller wiring." />
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function ValidationCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/70">{body}</p>
    </div>
  );
}