import {
  getMultiTrackKeeperComparisonBandLabel,
  getMultiTrackKeeperComparisonDecisionLabel,
  getMultiTrackKeeperComparisonDecisionTone,
  getMultiTrackKeeperComparisonPairScore,
  getMultiTrackKeeperComparisonReadinessLabel,
  getMultiTrackKeeperComparisonRiskCount,
  getMultiTrackKeeperComparisonRoleLabel,
  getMultiTrackKeeperComparisonSignalKindLabel,
  getMultiTrackKeeperComparisonVersionScore,
  getMultiTrackKeeperComparisonVersionTitle,
  getMultiTrackKeeperComparisonWorkspaceSummary,
  sortMultiTrackKeeperComparisonVersionsByScore,
} from "./MultiTrackKeeperComparisonHelpers";
import { multiTrackKeeperComparisonWorkspaceState } from "./MultiTrackKeeperComparisonSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass =
  "rounded-2xl border border-white/10 bg-black p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackKeeperComparisonWorkspacePanel() {
  const state = multiTrackKeeperComparisonWorkspaceState;
  const summary = getMultiTrackKeeperComparisonWorkspaceSummary(state);
  const sortedVersions = sortMultiTrackKeeperComparisonVersionsByScore(state.versions);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Keeper Comparison
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>
            {getMultiTrackKeeperComparisonReadinessLabel(state.readinessStatus)}
          </span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>No Wiring</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Versions" value={String(summary.versionCount)} />
        <SummaryCard label="Promote" value={String(summary.promoteCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Archive" value={String(summary.archiveCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Best Comparison Winner
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestVersionTitle}</h3>
            <p className={softTextClass}>
              Compared against {summary.originalTitle}. This score is seed-safe and ready for later
              real waveform, lineage, survivor, and mutation analysis.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestVersionScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Version Comparison Board</h3>

          <div className="mt-4 space-y-3">
            {sortedVersions.map((version) => (
              <article key={version.id} className={innerCardClass}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{version.title}</h4>
                    <p className={softTextClass}>
                      {version.versionLabel} · {getMultiTrackKeeperComparisonRoleLabel(version.role)} ·{" "}
                      {getMultiTrackKeeperComparisonDecisionLabel(version.decision)}
                    </p>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {getMultiTrackKeeperComparisonVersionScore(version)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={pillClass}>
                    {getMultiTrackKeeperComparisonReadinessLabel(version.readinessStatus)}
                  </span>
                  <span className={pillClass}>
                    {getMultiTrackKeeperComparisonDecisionTone(version.decision)}
                  </span>
                  <span className={pillClass}>Risks {getMultiTrackKeeperComparisonRiskCount(version)}</span>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <MetricCard label="Original" value={version.originalIdeaMatchScore} />
                  <MetricCard label="Hook" value={version.hookPreservationScore} />
                  <MetricCard label="Survivor" value={version.survivorScore} />
                  <MetricCard label="Mutation" value={version.mutationDistanceScore} />
                  <MetricCard label="Arrange" value={version.arrangementScore} />
                  <MetricCard label="Extract" value={version.extractionScore} />
                </div>

                <div className="mt-4 space-y-2">
                  {version.signals.map((signal) => (
                    <div key={signal.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <span className="text-sm font-semibold text-white">{signal.label}</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                          {getMultiTrackKeeperComparisonSignalKindLabel(signal.kind)} ·{" "}
                          {getMultiTrackKeeperComparisonBandLabel(signal.band)}
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
            <h3 className="text-lg font-bold text-white">Pair Checks</h3>

            <div className="mt-4 space-y-3">
              {state.pairs.map((pair) => (
                <article key={pair.id} className={innerCardClass}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{pair.label}</h4>
                      <p className={softTextClass}>{pair.detail}</p>
                    </div>
                    <div className="text-3xl font-black text-white">
                      {getMultiTrackKeeperComparisonPairScore(pair)}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <MetricCard label="Shared Idea" value={pair.sharedIdeaScore} />
                    <MetricCard label="Mutation Difference" value={pair.mutationDifferenceScore} />
                  </div>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    {getMultiTrackKeeperComparisonVersionTitle(state, pair.leftVersionId)} →{" "}
                    {getMultiTrackKeeperComparisonVersionTitle(state, pair.rightVersionId)}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Ranking</h3>

            <div className="mt-4 space-y-3">
              {[...state.ranks]
                .sort((left, right) => left.rank - right.rank)
                .map((rank) => (
                  <article key={rank.id} className={innerCardClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                          Rank {rank.rank}
                        </p>
                        <h4 className="mt-1 text-base font-bold text-white">{rank.label}</h4>
                        <p className={softTextClass}>{getMultiTrackKeeperComparisonVersionTitle(state, rank.versionId)}</p>
                      </div>
                      <div className="text-2xl font-black text-white">{rank.score}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/70">{rank.reason}</p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-lg font-bold text-white">Validation Lock</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <ValidationCard
            title="1. Syntax / TypeScript"
            body="All union values are declared in the types file and used directly by seed, helpers, and panel."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Panel imports only comparison helpers and comparison seed. Helpers import only comparison types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score and sort it. Panel renders it. No controller, page, or route wiring."
          />
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
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