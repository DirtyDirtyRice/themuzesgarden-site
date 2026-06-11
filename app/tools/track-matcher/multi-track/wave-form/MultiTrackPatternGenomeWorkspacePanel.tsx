import {
  buildMultiTrackPatternGenomeBoard,
  buildMultiTrackPatternGenomeIdeaSummaries,
  buildMultiTrackPatternGenomeReviewPacket,
  buildMultiTrackPatternGenomeVersionCoverage,
  formatMultiTrackPatternGenomeRange,
  getMultiTrackPatternGenomeColorLabel,
  getMultiTrackPatternGenomeConfidenceLabel,
  getMultiTrackPatternGenomeReadinessLabel,
  getMultiTrackPatternGenomeRoleLabel,
  validateMultiTrackPatternGenomeState,
} from "./MultiTrackPatternGenomeHelpers";
import { multiTrackPatternGenomeSeed } from "./MultiTrackPatternGenomeSeed";
import type {
  MultiTrackPatternGenomeAction,
  MultiTrackPatternGenomeComparison,
  MultiTrackPatternGenomeEvidence,
  MultiTrackPatternGenomeIdeaSummary,
  MultiTrackPatternGenomeLane,
  MultiTrackPatternGenomeRenderTarget,
  MultiTrackPatternGenomeRisk,
  MultiTrackPatternGenomeVersionCoverage,
  MultiTrackPatternGenomeWorkspaceState,
} from "./MultiTrackPatternGenomeTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const valueClass = "mt-2 text-lg font-semibold text-white";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";
const gridClass = "mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3";

type MultiTrackPatternGenomeWorkspacePanelProps = {
  state?: MultiTrackPatternGenomeWorkspaceState;
};

export function MultiTrackPatternGenomeWorkspacePanel({
  state = multiTrackPatternGenomeSeed,
}: MultiTrackPatternGenomeWorkspacePanelProps) {
  const summaries = buildMultiTrackPatternGenomeIdeaSummaries(state);
  const coverage = buildMultiTrackPatternGenomeVersionCoverage(state);
  const reviewPacket = buildMultiTrackPatternGenomeReviewPacket(
    state,
    state.activeIdeaId,
  );
  const board = buildMultiTrackPatternGenomeBoard(state);
  const validation = validateMultiTrackPatternGenomeState(state);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={labelClass}>Multi Track Pattern Genome</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackPatternGenomeReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "Validated seed map" : "Review required"}
          </p>
        </div>
      </div>

      <div className={gridClass}>
        <GenomeMetricCard
          label="Ideas"
          value={state.ideas.length.toString()}
          detail="Musical ideas being tracked across Suno versions."
        />
        <GenomeMetricCard
          label="Sources"
          value={state.sources.length.toString()}
          detail="Prepared for 10 generated versions."
        />
        <GenomeMetricCard
          label="Ready Ideas"
          value={validation.readyCount.toString()}
          detail="Safe planning targets before page wiring."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <GenomeIdeaList summaries={summaries} />
        <GenomeActiveReview
          activeTitle={reviewPacket.activeIdea?.title ?? "No active idea"}
          activeSummary={
            reviewPacket.activeIdea?.summary ?? "Select an idea later."
          }
          evidence={reviewPacket.activeEvidence}
          actions={reviewPacket.activeActions}
          risks={reviewPacket.activeRisks}
          comparisons={reviewPacket.activeComparisons}
          renderTargets={reviewPacket.renderTargets}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <GenomeVersionCoverage coverage={coverage} />
        <GenomeLanePanel lanes={state.lanes} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <GenomeBoardPanel
          readyCount={board.columns[0]?.ideaIds.length ?? 0}
          reviewCount={board.columns[1]?.ideaIds.length ?? 0}
          futureCount={board.columns[2]?.ideaIds.length ?? 0}
          blockedCount={board.columns[3]?.ideaIds.length ?? 0}
        />
        <GenomeGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
        />
      </div>
    </section>
  );
}

function GenomeMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
      <p className={bodyClass}>{detail}</p>
    </article>
  );
}

function GenomeIdeaList({
  summaries,
}: {
  summaries: MultiTrackPatternGenomeIdeaSummary[];
}) {
  return (
    <article className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={labelClass}>Idea Map</p>
          <h3 className="mt-2 text-xl font-bold text-white">
            Same musical idea tracker
          </h3>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
          {summaries.length} ideas
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {summaries.map((summary) => (
          <div
            key={summary.ideaId}
            className="rounded-2xl border border-white/10 bg-black px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{summary.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white">
                {getMultiTrackPatternGenomeColorLabel(summary.color)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>{getMultiTrackPatternGenomeRoleLabel(summary.role)}</p>
              <p>
                {summary.matchedCount}{" "}
                {summary.matchedCount === 1 ? "version" : "versions"}
              </p>
              <p>
                {getMultiTrackPatternGenomeConfidenceLabel(
                  summary.confidenceBucket,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function GenomeActiveReview({
  activeTitle,
  activeSummary,
  evidence,
  actions,
  risks,
  comparisons,
  renderTargets,
}: {
  activeTitle: string;
  activeSummary: string;
  evidence: MultiTrackPatternGenomeEvidence[];
  actions: MultiTrackPatternGenomeAction[];
  risks: MultiTrackPatternGenomeRisk[];
  comparisons: MultiTrackPatternGenomeComparison[];
  renderTargets: MultiTrackPatternGenomeRenderTarget[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Review</p>
      <h3 className="mt-2 text-xl font-bold text-white">{activeTitle}</h3>
      <p className={bodyClass}>{activeSummary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <GenomeMiniList
          title="Evidence"
          items={evidence.map(
            (item) =>
              `${item.timeRange.label}: ${formatMultiTrackPatternGenomeRange(
                item.timeRange.startSeconds,
                item.timeRange.endSeconds,
              )}`,
          )}
        />
        <GenomeMiniList
          title="Actions"
          items={actions.map((action) => action.label)}
        />
        <GenomeMiniList
          title="Risks"
          items={risks.map((risk) => risk.label)}
        />
        <GenomeMiniList
          title="Comparisons"
          items={comparisons.map(
            (comparison) =>
              `${comparison.fromVersionId} → ${comparison.toVersionId}: ${comparison.similarityPercent}%`,
          )}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Future Render Targets</p>
        <div className="mt-3 space-y-2">
          {renderTargets.map((target) => (
            <p key={target.id} className="text-sm text-white/70">
              {target.label} · {target.targetFormat.toUpperCase()} ·{" "}
              {getMultiTrackPatternGenomeReadinessLabel(
                target.readinessStatus,
              )}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

function GenomeMiniList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-xs leading-5 text-white/70">
              {item}
            </p>
          ))
        ) : (
          <p className="text-xs text-white/70">Nothing listed yet.</p>
        )}
      </div>
    </div>
  );
}

function GenomeVersionCoverage({
  coverage,
}: {
  coverage: MultiTrackPatternGenomeVersionCoverage[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>10 Version Coverage</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Suno version scan map
      </h3>

      <div className="mt-4 space-y-2">
        {coverage.map((item) => (
          <div
            key={item.versionId}
            className="grid gap-2 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-white/70 md:grid-cols-[1fr_1fr_auto]"
          >
            <p className="font-semibold text-white">{item.sourceTitle}</p>
            <p>{item.strongestIdeaTitle}</p>
            <p>{item.averageSimilarityPercent}% avg</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function GenomeLanePanel({
  lanes,
}: {
  lanes: MultiTrackPatternGenomeLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Genome Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Color-code planning lanes
      </h3>

      <div className="mt-4 grid gap-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{lane.label}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackPatternGenomeColorLabel(lane.color)}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.ideaIds.length} linked idea
              {lane.ideaIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function GenomeBoardPanel({
  readyCount,
  reviewCount,
  futureCount,
  blockedCount,
}: {
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Board Status</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Promotion checkpoints
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <GenomeMetricCard
          label="Ready"
          value={readyCount.toString()}
          detail="Can be shown safely."
        />
        <GenomeMetricCard
          label="Review"
          value={reviewCount.toString()}
          detail="Needs confirmation."
        />
        <GenomeMetricCard
          label="Future"
          value={futureCount.toString()}
          detail="Needs engine wiring."
        />
        <GenomeMetricCard
          label="Blocked"
          value={blockedCount.toString()}
          detail="Should not move yet."
        />
      </div>
    </article>
  );
}

function GenomeGuardrailPanel({
  notes,
  validationMessages,
}: {
  notes: string[];
  validationMessages: string[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Guardrails</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Safe engine foundation
      </h3>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-white/70">
            {note}
          </p>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Validation</p>
        <div className="mt-3 space-y-2">
          {validationMessages.length === 0 ? (
            <p className="text-sm text-white/70">No missing seed references.</p>
          ) : (
            validationMessages.map((message) => (
              <p key={message} className="text-sm text-white/70">
                {message}
              </p>
            ))
          )}
        </div>
      </div>
    </article>
  );
}