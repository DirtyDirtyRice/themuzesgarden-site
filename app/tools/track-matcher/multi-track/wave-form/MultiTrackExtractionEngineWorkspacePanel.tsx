"use client";

import {
  buildExtractionEnginePlanningSentence,
  getExtractionEngineBooleanLabel,
  getExtractionEngineDecisionLabel,
  getExtractionEngineDurationLabel,
  getExtractionEngineExtractCount,
  getExtractionEngineFindingAction,
  getExtractionEngineHeldCount,
  getExtractionEngineOriginalTimeLabel,
  getExtractionEnginePassedGateCount,
  getExtractionEnginePlanSummary,
  getExtractionEngineReadinessLabel,
  getExtractionEngineRejectedCount,
  getExtractionEngineRiskLabel,
  getExtractionEngineScoreWidth,
  getExtractionEngineStatusLabel,
  getExtractionEngineTimeLabel,
  getExtractionEngineWindowSummary,
  getExtractionEngineWindowTimeLabel,
  getMultiTrackExtractionEngineWorkspace,
} from "./MultiTrackExtractionEngineHelpers";

export default function MultiTrackExtractionEngineWorkspacePanel() {
  const workspace = getMultiTrackExtractionEngineWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
            Real Engine Work
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-white/70">
            {workspace.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 xl:text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Readiness
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {getExtractionEngineReadinessLabel(workspace.readiness)}
          </p>
          <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-white/70">
            {workspace.readinessLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine goal</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            {workspace.engineGoal}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine boundary</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            {workspace.engineBoundary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <MetricCard label="Extract" value={getExtractionEngineExtractCount(workspace.cutWindows)} />
        <MetricCard label="Hold" value={getExtractionEngineHeldCount(workspace.cutWindows)} />
        <MetricCard label="Reject" value={getExtractionEngineRejectedCount(workspace.cutWindows)} />
        <MetricCard
          label="Review Gates"
          value={`${getExtractionEnginePassedGateCount(workspace.reviewGates)}/${workspace.reviewGates.length}`}
        />
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Cut windows</h3>
        <div className="mt-3 grid gap-3">
          {workspace.cutWindows.map((window) => (
            <article
              key={window.cutWindowId}
              className="rounded-3xl border border-white/10 bg-black p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                    {window.role}
                  </p>
                  <h4 className="mt-2 text-xl font-black text-white">{window.title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    {getExtractionEngineWindowSummary(window)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 lg:text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Decision
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {getExtractionEngineDecisionLabel(window.decision)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {getExtractionEngineDurationLabel(window)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                <InfoCard label="Original" value={getExtractionEngineOriginalTimeLabel(window)} />
                <InfoCard label="Corrected" value={getExtractionEngineWindowTimeLabel(window)} />
                <InfoCard label="Pre/Post" value={`${window.preRollMs}/${window.postRollMs}ms`} />
                <InfoCard label="Drift" value={`${window.driftCorrectionMs}ms`} />
              </div>

              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/50">
                  Confidence
                </p>
                <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-white/50"
                    style={{ width: getExtractionEngineScoreWidth(window.confidence) }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h5 className="text-base font-black text-white">Boundaries</h5>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {window.boundaries.map((boundary) => (
                    <div
                      key={boundary.boundaryId}
                      className="rounded-2xl border border-white/10 bg-black p-3"
                    >
                      <p className="font-black text-white">{boundary.label}</p>
                      <p className="mt-1 text-xs font-semibold text-white/60">
                        {boundary.kind} / {getExtractionEngineTimeLabel(boundary.timeMs)}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                        {boundary.detail}
                      </p>
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                        {getExtractionEngineStatusLabel(boundary.status)} / Risk{" "}
                        {getExtractionEngineRiskLabel(boundary.risk)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {window.notes.map((note) => (
                  <p
                    key={note}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-5 text-white/70"
                  >
                    {note}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Extraction plans</h3>
        <div className="mt-3 grid gap-2">
          {workspace.plans.map((plan) => (
            <div key={plan.planId} className="rounded-2xl border border-white/10 bg-black p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-white">{plan.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                    {plan.detail}
                  </p>
                </div>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/70">
                  {getExtractionEngineDecisionLabel(plan.decision)}
                </p>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ScoreBar label="Extraction" value={plan.extractionScore} />
                <ScoreBar label="Timing Safety" value={plan.timingSafetyScore} />
                <ScoreBar label="Review" value={plan.reviewScore} />
              </div>

              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getExtractionEnginePlanSummary(plan)} / Risk{" "}
                {getExtractionEngineRiskLabel(plan.risk)}
              </p>

              <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                {plan.recommendation}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-6 text-white/70">
          {buildExtractionEnginePlanningSentence(workspace)}
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Review gates</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {workspace.reviewGates.map((gate) => (
            <div key={gate.gateId} className="rounded-2xl border border-white/10 bg-black p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">{gate.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                    {gate.detail}
                  </p>
                </div>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/70">
                  {getExtractionEngineBooleanLabel(gate.pass)}
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                {gate.action}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Findings</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {workspace.findings.map((finding) => (
            <div key={finding.findingId} className="rounded-2xl border border-white/10 bg-black p-3">
              <p className="font-black text-white">{finding.title}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                {finding.detail}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getExtractionEngineFindingAction(finding)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <RuleList title="Engine rules" items={workspace.engineRules} />
        <RuleList title="Next steps" items={workspace.nextSteps} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
        {label}
      </p>
      <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-white/50"
          style={{ width: getExtractionEngineScoreWidth(value) }}
        />
      </div>
      <p className="mt-1 text-xs font-black text-white/70">{value}</p>
    </div>
  );
}

function RuleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p
            key={item}
            className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
