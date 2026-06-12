import {
  formatMultiTrackRenderQueueDuration,
  getMultiTrackRenderQueueComputedScore,
  getMultiTrackRenderQueueFormatLabel,
  getMultiTrackRenderQueueJobStatusLabel,
  getMultiTrackRenderQueueJobTitle,
  getMultiTrackRenderQueueLaneJobs,
  getMultiTrackRenderQueuePassedCheckCount,
  getMultiTrackRenderQueuePriorityLabel,
  getMultiTrackRenderQueueReadinessLabel,
  getMultiTrackRenderQueueRiskLabel,
  getMultiTrackRenderQueueTargetLabel,
  getMultiTrackRenderQueueWorkspaceSummary,
  sortMultiTrackRenderQueueJobsByPriority,
  sortMultiTrackRenderQueueJobsByScore,
} from "./MultiTrackRenderQueueEngineHelpers";
import { multiTrackRenderQueueEngineWorkspaceState } from "./MultiTrackRenderQueueEngineSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass =
  "rounded-2xl border border-white/10 bg-black p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackRenderQueueEngineWorkspacePanel() {
  const state = multiTrackRenderQueueEngineWorkspaceState;
  const summary = getMultiTrackRenderQueueWorkspaceSummary(state);
  const scoredJobs = sortMultiTrackRenderQueueJobsByScore(state.jobs);
  const priorityJobs = sortMultiTrackRenderQueueJobsByPriority(state.jobs);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Render Queue Engine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>{getMultiTrackRenderQueueReadinessLabel(state.readinessStatus)}</span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>No Real Render</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Jobs" value={String(summary.jobCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Queued" value={String(summary.queuedCount)} />
        <SummaryCard label="Prepared" value={String(summary.preparedCount)} />
        <SummaryCard label="WAV" value={String(summary.wavCount)} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <SummaryCard label="Estimated Size MB" value={String(summary.totalSizeMb)} />
        <SummaryCard
          label="Estimated Length"
          value={formatMultiTrackRenderQueueDuration(summary.totalLengthSeconds)}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Best Render Job
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestJobTitle}</h3>
            <p className={softTextClass}>
              This is the strongest seed-safe render target. Later this can become a real WAV export,
              keeper preview bounce, arrangement demo, or full song render.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestJobScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Render Jobs</h3>

          <div className="mt-4 space-y-3">
            {scoredJobs.map((job) => (
              <article key={job.id} className={innerCardClass}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{job.title}</h4>
                    <p className={softTextClass}>
                      {getMultiTrackRenderQueueTargetLabel(job.target)} ·{" "}
                      {getMultiTrackRenderQueueFormatLabel(job.format)} ·{" "}
                      {getMultiTrackRenderQueueJobStatusLabel(job.status)}
                    </p>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {getMultiTrackRenderQueueComputedScore(job)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={pillClass}>{getMultiTrackRenderQueueReadinessLabel(job.readinessStatus)}</span>
                  <span className={pillClass}>{getMultiTrackRenderQueuePriorityLabel(job.priority)}</span>
                  <span className={pillClass}>
                    {formatMultiTrackRenderQueueDuration(job.estimatedLengthSeconds)}
                  </span>
                  <span className={pillClass}>{job.estimatedFileSizeMb} MB</span>
                  <span className={pillClass}>
                    Checks {getMultiTrackRenderQueuePassedCheckCount(job)}/{job.checks.length}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/70">{job.detail}</p>

                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  <MetricCard label="Render" value={job.renderScore} />
                  <MetricCard label="Quality" value={job.qualityScore} />
                  <MetricCard label="Export" value={job.exportScore} />
                  <MetricCard label="Delivery" value={job.deliveryScore} />
                </div>

                <div className="mt-4 grid gap-2">
                  {job.checks.map((check) => (
                    <div key={check.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <span className="text-sm font-semibold text-white">{check.label}</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                          {check.passed ? "Passed" : "Needs Review"} · {check.score}/{check.maxScore}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-white/60">{check.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {job.risks.map((risk) => (
                    <span key={risk} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      {getMultiTrackRenderQueueRiskLabel(risk)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Priority Stack</h3>

            <div className="mt-4 space-y-3">
              {priorityJobs.map((job, index) => (
                <article key={job.id} className={innerCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        Priority {index + 1}
                      </p>
                      <h4 className="mt-1 text-base font-bold text-white">{job.title}</h4>
                    </div>
                    <span className={pillClass}>{getMultiTrackRenderQueuePriorityLabel(job.priority)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {getMultiTrackRenderQueueTargetLabel(job.target)} ·{" "}
                    {getMultiTrackRenderQueueJobStatusLabel(job.status)} · Score{" "}
                    {getMultiTrackRenderQueueComputedScore(job)}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Render Lanes</h3>

            <div className="mt-4 space-y-3">
              {state.lanes.map((lane) => {
                const laneJobs = getMultiTrackRenderQueueLaneJobs(state, lane.id);

                return (
                  <article key={lane.id} className={innerCardClass}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{lane.title}</h4>
                        <p className={softTextClass}>{lane.description}</p>
                      </div>
                      <span className={pillClass}>{getMultiTrackRenderQueueReadinessLabel(lane.readinessStatus)}</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {laneJobs.map((job) => (
                        <div key={job.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-white">{job.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/60">
                            {getMultiTrackRenderQueueFormatLabel(job.format)} ·{" "}
                            {getMultiTrackRenderQueueJobStatusLabel(job.status)} · Score{" "}
                            {getMultiTrackRenderQueueComputedScore(job)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Render Plan</h3>

            <div className="mt-4 space-y-3">
              {[...state.planSteps]
                .sort((left, right) => left.order - right.order)
                .map((step) => (
                  <article key={step.id} className={innerCardClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                          Step {step.order}
                        </p>
                        <h4 className="mt-1 text-base font-bold text-white">{step.label}</h4>
                      </div>
                      <span className={pillClass}>{getMultiTrackRenderQueueJobStatusLabel(step.status)}</span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-white">
                      {getMultiTrackRenderQueueJobTitle(state, step.jobId)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{step.detail}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      {getMultiTrackRenderQueueReadinessLabel(step.readinessStatus)}
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
          <ValidationCard
            title="1. Syntax / TypeScript"
            body="All render job, target, status, format, risk, and readiness values are declared in the types file."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Panel imports only render queue helpers and render queue seed. Helpers import only render queue types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score, sort, and map jobs. Panel renders it with no real render or route wiring."
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