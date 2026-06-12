import {
  getMultiTrackKeeperExtractionActionLabel,
  getMultiTrackKeeperExtractionBeatLength,
  getMultiTrackKeeperExtractionComputedScore,
  getMultiTrackKeeperExtractionConfidenceLabel,
  getMultiTrackKeeperExtractionDurationSeconds,
  getMultiTrackKeeperExtractionLaneRegions,
  getMultiTrackKeeperExtractionReadinessLabel,
  getMultiTrackKeeperExtractionRegionKindLabel,
  getMultiTrackKeeperExtractionRegionTitle,
  getMultiTrackKeeperExtractionRiskLabel,
  getMultiTrackKeeperExtractionWorkspaceSummary,
  sortMultiTrackKeeperExtractionRegionsByScore,
} from "./MultiTrackKeeperExtractionHelpers";
import { multiTrackKeeperExtractionWorkspaceState } from "./MultiTrackKeeperExtractionSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass =
  "rounded-2xl border border-white/10 bg-black p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackKeeperExtractionWorkspacePanel() {
  const state = multiTrackKeeperExtractionWorkspaceState;
  const summary = getMultiTrackKeeperExtractionWorkspaceSummary(state);
  const sortedRegions = sortMultiTrackKeeperExtractionRegionsByScore(state.regions);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Keeper Extraction
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>
            {getMultiTrackKeeperExtractionReadinessLabel(state.readinessStatus)}
          </span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>No Audio Slicing</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Regions" value={String(summary.regionCount)} />
        <SummaryCard label="Hooks" value={String(summary.hookCount)} />
        <SummaryCard label="Riffs" value={String(summary.riffCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Extractable" value={String(summary.extractableCount)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Best Extraction Target
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestRegionTitle}</h3>
            <p className={softTextClass}>
              This is the strongest seed-safe extraction target. Later this can become real waveform
              boundary selection, duplication, trimming, edit lane send, and arrangement preparation.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestRegionScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Extraction Regions</h3>

          <div className="mt-4 space-y-3">
            {sortedRegions.map((region) => (
              <article key={region.id} className={innerCardClass}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{region.title}</h4>
                    <p className={softTextClass}>
                      {region.sourceVersionLabel} ·{" "}
                      {getMultiTrackKeeperExtractionRegionKindLabel(region.regionKind)} ·{" "}
                      {getMultiTrackKeeperExtractionConfidenceLabel(region.confidence)}
                    </p>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {getMultiTrackKeeperExtractionComputedScore(region)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={pillClass}>
                    {getMultiTrackKeeperExtractionReadinessLabel(region.readinessStatus)}
                  </span>
                  <span className={pillClass}>{region.keyLabel}</span>
                  <span className={pillClass}>{region.bpm} BPM</span>
                  <span className={pillClass}>
                    {getMultiTrackKeeperExtractionBeatLength(region)} Beats
                  </span>
                  <span className={pillClass}>
                    {getMultiTrackKeeperExtractionDurationSeconds(region)} Sec
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/70">{region.detail}</p>

                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  <MetricCard label="Strength" value={region.strengthScore} />
                  <MetricCard label="Boundary" value={region.boundaryScore} />
                  <MetricCard label="Loop" value={region.loopScore} />
                  <MetricCard label="Extract" value={region.extractionScore} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {region.actions.map((action) => (
                    <span key={action} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                      {getMultiTrackKeeperExtractionActionLabel(action)}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {region.risks.map((risk) => (
                    <span key={risk} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      {getMultiTrackKeeperExtractionRiskLabel(risk)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Extraction Lanes</h3>

            <div className="mt-4 space-y-3">
              {state.lanes.map((lane) => {
                const laneRegions = getMultiTrackKeeperExtractionLaneRegions(state, lane.id);

                return (
                  <article key={lane.id} className={innerCardClass}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{lane.title}</h4>
                        <p className={softTextClass}>{lane.description}</p>
                      </div>
                      <span className={pillClass}>
                        {getMultiTrackKeeperExtractionReadinessLabel(lane.readinessStatus)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {laneRegions.map((region) => (
                        <div key={region.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-white">{region.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/60">
                            {getMultiTrackKeeperExtractionRegionKindLabel(region.regionKind)} · Score{" "}
                            {getMultiTrackKeeperExtractionComputedScore(region)}
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
            <h3 className="text-lg font-bold text-white">Extraction Plan</h3>

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
                      <span className={pillClass}>
                        {getMultiTrackKeeperExtractionReadinessLabel(step.readinessStatus)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-white">
                      {getMultiTrackKeeperExtractionRegionTitle(state, step.regionId)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{step.detail}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      {getMultiTrackKeeperExtractionActionLabel(step.action)}
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
            body="All region, lane, action, risk, and status values are declared in the types file."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Panel imports only extraction helpers and extraction seed. Helpers import only extraction types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score regions and map lanes. Panel renders it with no page or controller wiring."
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