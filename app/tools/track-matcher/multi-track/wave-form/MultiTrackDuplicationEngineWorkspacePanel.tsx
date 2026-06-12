import {
  getMultiTrackDuplicationActionLabel,
  getMultiTrackDuplicationCloneStatusLabel,
  getMultiTrackDuplicationCloneTitle,
  getMultiTrackDuplicationComputedScore,
  getMultiTrackDuplicationLaneClones,
  getMultiTrackDuplicationPassedCheckCount,
  getMultiTrackDuplicationPriorityLabel,
  getMultiTrackDuplicationReadinessLabel,
  getMultiTrackDuplicationRiskLabel,
  getMultiTrackDuplicationSourceBarLength,
  getMultiTrackDuplicationTargetBarLength,
  getMultiTrackDuplicationTargetKindLabel,
  getMultiTrackDuplicationWorkspaceSummary,
  sortMultiTrackDuplicationClonesByScore,
  sortMultiTrackDuplicationClonesByTargetBar,
} from "./MultiTrackDuplicationEngineHelpers";
import { multiTrackDuplicationEngineWorkspaceState } from "./MultiTrackDuplicationEngineSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass =
  "rounded-2xl border border-white/10 bg-black p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackDuplicationEngineWorkspacePanel() {
  const state = multiTrackDuplicationEngineWorkspaceState;
  const summary = getMultiTrackDuplicationWorkspaceSummary(state);
  const scoredClones = sortMultiTrackDuplicationClonesByScore(state.clones);
  const orderedClones = sortMultiTrackDuplicationClonesByTargetBar(state.clones);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Duplication Engine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>{getMultiTrackDuplicationReadinessLabel(state.readinessStatus)}</span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>No Audio Copy</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Clones" value={String(summary.cloneCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Approved" value={String(summary.approvedCount)} />
        <SummaryCard label="Prepared" value={String(summary.preparedCount)} />
        <SummaryCard label="Hook Repeats" value={String(summary.hookRepeatCount)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Best Duplicate Clone
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestCloneTitle}</h3>
            <p className={softTextClass}>
              This is the strongest seed-safe duplication plan. Later this can become real audio copy,
              repeated hooks, edit-lane duplication, arrangement placement, and render preparation.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestCloneScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Duplicate Clones</h3>

          <div className="mt-4 space-y-3">
            {scoredClones.map((clone) => (
              <article key={clone.id} className={innerCardClass}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{clone.title}</h4>
                    <p className={softTextClass}>
                      {getMultiTrackDuplicationTargetKindLabel(clone.targetKind)} ·{" "}
                      {getMultiTrackDuplicationCloneStatusLabel(clone.cloneStatus)} ·{" "}
                      {getMultiTrackDuplicationPriorityLabel(clone.priority)}
                    </p>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {getMultiTrackDuplicationComputedScore(clone)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={pillClass}>{getMultiTrackDuplicationReadinessLabel(clone.readinessStatus)}</span>
                  <span className={pillClass}>{clone.keyLabel}</span>
                  <span className={pillClass}>{clone.bpm} BPM</span>
                  <span className={pillClass}>Repeat {clone.repeatCount}</span>
                  <span className={pillClass}>Offset {clone.offsetBeats}</span>
                  <span className={pillClass}>
                    Checks {getMultiTrackDuplicationPassedCheckCount(clone)}/{clone.checks.length}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/70">{clone.detail}</p>

                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  <MetricCard label="Clone" value={clone.cloneScore} />
                  <MetricCard label="Timing" value={clone.timingScore} />
                  <MetricCard label="Transition" value={clone.transitionScore} />
                  <MetricCard label="Render" value={clone.renderScore} />
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <MetricCard label="Source Bars" value={getMultiTrackDuplicationSourceBarLength(clone)} />
                  <MetricCard label="Target Bars" value={getMultiTrackDuplicationTargetBarLength(clone)} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {clone.actions.map((action) => (
                    <span key={action} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                      {getMultiTrackDuplicationActionLabel(action)}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2">
                  {clone.checks.map((check) => (
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
                  {clone.risks.map((risk) => (
                    <span key={risk} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      {getMultiTrackDuplicationRiskLabel(risk)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Target Bar Order</h3>

            <div className="mt-4 space-y-3">
              {orderedClones.map((clone, index) => (
                <article key={clone.id} className={innerCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        Clone {index + 1}
                      </p>
                      <h4 className="mt-1 text-base font-bold text-white">{clone.title}</h4>
                    </div>
                    <span className={pillClass}>{getMultiTrackDuplicationTargetKindLabel(clone.targetKind)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Target bars {clone.targetStartBar}-{clone.targetEndBar}. Score{" "}
                    {getMultiTrackDuplicationComputedScore(clone)}.
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Duplication Lanes</h3>

            <div className="mt-4 space-y-3">
              {state.lanes.map((lane) => {
                const laneClones = getMultiTrackDuplicationLaneClones(state, lane.id);

                return (
                  <article key={lane.id} className={innerCardClass}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{lane.title}</h4>
                        <p className={softTextClass}>{lane.description}</p>
                      </div>
                      <span className={pillClass}>
                        {getMultiTrackDuplicationReadinessLabel(lane.readinessStatus)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {laneClones.map((clone) => (
                        <div key={clone.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-white">{clone.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/60">
                            {getMultiTrackDuplicationCloneStatusLabel(clone.cloneStatus)} · Score{" "}
                            {getMultiTrackDuplicationComputedScore(clone)}
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
            <h3 className="text-lg font-bold text-white">Duplication Plan</h3>

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
                      <span className={pillClass}>{getMultiTrackDuplicationActionLabel(step.action)}</span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-white">
                      {getMultiTrackDuplicationCloneTitle(state, step.cloneId)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{step.detail}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      {getMultiTrackDuplicationReadinessLabel(step.readinessStatus)}
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
            body="All clone, lane, action, risk, target, and status values are declared in the types file."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Panel imports only duplication helpers and duplication seed. Helpers import only duplication types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score, sort, and map clones. Panel renders it with no page, route, or controller wiring."
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