import {
  buildMultiTrackRenderQueueBatchSummaries,
  buildMultiTrackRenderQueueJobSummaries,
  buildMultiTrackRenderQueueReviewPacket,
  buildMultiTrackRenderQueueVersionCoverage,
  formatMultiTrackRenderQueueRange,
  getMultiTrackRenderQueueConfidenceLabel,
  getMultiTrackRenderQueueJobKindLabel,
  getMultiTrackRenderQueueOutputLabel,
  getMultiTrackRenderQueueReadinessLabel,
  validateMultiTrackRenderQueueState,
} from "./MultiTrackRenderQueueHelpers";
import { multiTrackRenderQueueSeed } from "./MultiTrackRenderQueueSeed";
import type {
  MultiTrackRenderQueueBatchSummary,
  MultiTrackRenderQueueJobSummary,
  MultiTrackRenderQueueLane,
  MultiTrackRenderQueueRisk,
  MultiTrackRenderQueueSetting,
  MultiTrackRenderQueueSource,
  MultiTrackRenderQueueVersionCoverage,
  MultiTrackRenderQueueWorkspaceState,
} from "./MultiTrackRenderQueueTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackRenderQueueWorkspacePanelProps = {
  state?: MultiTrackRenderQueueWorkspaceState;
};

export function MultiTrackRenderQueueWorkspacePanel({
  state = multiTrackRenderQueueSeed,
}: MultiTrackRenderQueueWorkspacePanelProps) {
  const validation = validateMultiTrackRenderQueueState(state);
  const jobSummaries = buildMultiTrackRenderQueueJobSummaries(state);
  const batchSummaries = buildMultiTrackRenderQueueBatchSummaries(state);
  const coverage = buildMultiTrackRenderQueueVersionCoverage(state);
  const reviewPacket = buildMultiTrackRenderQueueReviewPacket(
    state,
    state.activeJobId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Render Queue</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackRenderQueueReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RenderMetricCard
          label="Jobs"
          value={state.jobs.length.toString()}
          detail="Future output jobs."
        />
        <RenderMetricCard
          label="Batches"
          value={state.batches.length.toString()}
          detail="Grouped render plans."
        />
        <RenderMetricCard
          label="Future"
          value={validation.futureCount.toString()}
          detail="Waiting for real renderer."
        />
        <RenderMetricCard
          label="Review"
          value={validation.reviewCount.toString()}
          detail="Needs approval or analysis."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <RenderJobPanel jobs={jobSummaries} />
        <RenderActiveJobPanel
          activeTitle={reviewPacket.activeJob?.title ?? "No active render job"}
          activeDetail={
            reviewPacket.activeJob?.outputName ??
            "Select a render job after wiring."
          }
          destinationLabel={
            reviewPacket.activeJob?.destinationLabel ?? "Future destination"
          }
          sources={reviewPacket.sources}
          setting={reviewPacket.setting}
          risks={reviewPacket.risks}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <RenderBatchPanel batches={batchSummaries} />
        <RenderVersionCoveragePanel coverage={coverage} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <RenderLanePanel lanes={state.lanes} />
        <RenderGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
          readyCount={validation.readyCount}
          blockedCount={validation.blockedCount}
        />
      </div>
    </section>
  );
}

function RenderMetricCard({
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
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className={bodyClass}>{detail}</p>
    </article>
  );
}

function RenderJobPanel({
  jobs,
}: {
  jobs: MultiTrackRenderQueueJobSummary[];
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={labelClass}>Render Jobs</p>
          <h3 className="mt-2 text-xl font-bold text-white">
            Output queue plan
          </h3>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
          {jobs.length} jobs
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{job.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackRenderQueueOutputLabel(job.outputFormat)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>{getMultiTrackRenderQueueJobKindLabel(job.jobKind)}</p>
              <p>{job.priority}</p>
              <p>
                {getMultiTrackRenderQueueConfidenceLabel(
                  job.confidenceBucket,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function RenderActiveJobPanel({
  activeTitle,
  activeDetail,
  destinationLabel,
  sources,
  setting,
  risks,
}: {
  activeTitle: string;
  activeDetail: string;
  destinationLabel: string;
  sources: MultiTrackRenderQueueSource[];
  setting: MultiTrackRenderQueueSetting | null;
  risks: MultiTrackRenderQueueRisk[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Render Job</p>
      <h3 className="mt-2 text-xl font-bold text-white">{activeTitle}</h3>
      <p className={bodyClass}>{activeDetail}</p>
      <p className="mt-3 rounded-full border border-white/15 px-3 py-2 text-xs text-white/70">
        Destination: {destinationLabel}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RenderMiniList
          title="Sources"
          items={sources.map(
            (source) =>
              `${source.title}: ${formatMultiTrackRenderQueueRange(
                source.timeRange.startSeconds,
                source.timeRange.endSeconds,
              )}`,
          )}
        />
        <RenderMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Render Setting</p>
        {setting ? (
          <div className="mt-3 space-y-2 text-xs leading-5 text-white/70">
            <p>{setting.label}</p>
            <p>{setting.detail}</p>
            <p>
              {getMultiTrackRenderQueueOutputLabel(setting.outputFormat)} · tail{" "}
              {setting.tailMs}ms ·{" "}
              {setting.normalizeOutput ? "normalize" : "no normalize"}
            </p>
            <p>
              Pitch:{" "}
              {setting.preserveOriginalPitch ? "preserve" : "allow change"} ·
              Tempo:{" "}
              {setting.preserveOriginalTempo ? "preserve" : "allow change"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-white/70">No setting found.</p>
        )}
      </div>
    </article>
  );
}

function RenderMiniList({
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

function RenderBatchPanel({
  batches,
}: {
  batches: MultiTrackRenderQueueBatchSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Render Batches</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Grouped output plans
      </h3>

      <div className="mt-4 space-y-3">
        {batches.map((batch) => (
          <div
            key={batch.batchId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{batch.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackRenderQueueOutputLabel(batch.outputFormat)}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70">
              {batch.jobCount} job{batch.jobCount === 1 ? "" : "s"} ·{" "}
              {batch.readyJobCount} ready ·{" "}
              {getMultiTrackRenderQueueReadinessLabel(batch.readinessStatus)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RenderVersionCoveragePanel({
  coverage,
}: {
  coverage: MultiTrackRenderQueueVersionCoverage[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>10 Version Output Map</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Which versions have render jobs?
      </h3>

      <div className="mt-4 space-y-2">
        {coverage.map((item) => (
          <div
            key={item.versionId}
            className="grid gap-2 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-white/70 md:grid-cols-[auto_1fr_auto]"
          >
            <p className="font-semibold text-white">{item.versionId}</p>
            <p>{item.strongestJobTitle}</p>
            <p>
              {item.jobCount} job{item.jobCount === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RenderLanePanel({
  lanes,
}: {
  lanes: MultiTrackRenderQueueLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Queue Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Future output destinations
      </h3>

      <div className="mt-4 space-y-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{lane.label}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackRenderQueueReadinessLabel(lane.readinessStatus)}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.jobIds.length} job{lane.jobIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RenderGuardrailPanel({
  notes,
  validationMessages,
  readyCount,
  blockedCount,
}: {
  notes: string[];
  validationMessages: string[];
  readyCount: number;
  blockedCount: number;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Guardrails</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Planning only, no file output
      </h3>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-white/70">
            {note}
          </p>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RenderMetricCard
          label="Ready"
          value={readyCount.toString()}
          detail="Approved render jobs later."
        />
        <RenderMetricCard
          label="Blocked"
          value={blockedCount.toString()}
          detail="Stopped jobs."
        />
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