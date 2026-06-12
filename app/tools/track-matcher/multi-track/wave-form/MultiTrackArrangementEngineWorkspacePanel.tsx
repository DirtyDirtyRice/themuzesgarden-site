import {
  getMultiTrackArrangementActionLabel,
  getMultiTrackArrangementBarLength,
  getMultiTrackArrangementComputedScore,
  getMultiTrackArrangementLaneSections,
  getMultiTrackArrangementPriorityLabel,
  getMultiTrackArrangementReadinessLabel,
  getMultiTrackArrangementRiskLabel,
  getMultiTrackArrangementSectionKindLabel,
  getMultiTrackArrangementSectionTitle,
  getMultiTrackArrangementWorkspaceSummary,
  sortMultiTrackArrangementSectionsByOrder,
  sortMultiTrackArrangementSectionsByScore,
} from "./MultiTrackArrangementEngineHelpers";
import { multiTrackArrangementEngineWorkspaceState } from "./MultiTrackArrangementEngineSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass =
  "rounded-2xl border border-white/10 bg-black p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackArrangementEngineWorkspacePanel() {
  const state = multiTrackArrangementEngineWorkspaceState;
  const summary = getMultiTrackArrangementWorkspaceSummary(state);
  const scoredSections = sortMultiTrackArrangementSectionsByScore(state.sections);
  const orderedSections = sortMultiTrackArrangementSectionsByOrder(state.sections);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Arrangement Engine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>{getMultiTrackArrangementReadinessLabel(state.readinessStatus)}</span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>No Wiring</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Sections" value={String(summary.sectionCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Hooks" value={String(summary.hookCount)} />
        <SummaryCard label="Render Prep" value={String(summary.renderPrepCount)} />
        <SummaryCard label="Duplicate" value={String(summary.duplicatedCount)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Best Arrangement Anchor
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestSectionTitle}</h3>
            <p className={softTextClass}>
              This is the strongest seed-safe section for the arrangement blueprint. Later this can drive
              real edit lanes, duplication, section movement, and render queue preparation.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestSectionScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Arrangement Sections</h3>

          <div className="mt-4 space-y-3">
            {scoredSections.map((section) => (
              <article key={section.id} className={innerCardClass}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{section.title}</h4>
                    <p className={softTextClass}>
                      {getMultiTrackArrangementSectionKindLabel(section.sectionKind)} ·{" "}
                      {getMultiTrackArrangementPriorityLabel(section.priority)} ·{" "}
                      {getMultiTrackArrangementReadinessLabel(section.readinessStatus)}
                    </p>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {getMultiTrackArrangementComputedScore(section)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={pillClass}>Order {section.targetOrder}</span>
                  <span className={pillClass}>
                    Bars {section.startBar}-{section.endBar}
                  </span>
                  <span className={pillClass}>{getMultiTrackArrangementBarLength(section)} Bars</span>
                  <span className={pillClass}>Repeat {section.repeatCount}</span>
                  <span className={pillClass}>{section.keyLabel}</span>
                  <span className={pillClass}>{section.bpm} BPM</span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/70">{section.detail}</p>

                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  <MetricCard label="Energy" value={section.energyScore} />
                  <MetricCard label="Hook" value={section.hookScore} />
                  <MetricCard label="Transition" value={section.transitionScore} />
                  <MetricCard label="Arrange" value={section.arrangementScore} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {section.actions.map((action) => (
                    <span key={action} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                      {getMultiTrackArrangementActionLabel(action)}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {section.risks.map((risk) => (
                    <span key={risk} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                      {getMultiTrackArrangementRiskLabel(risk)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Blueprint Order</h3>

            <div className="mt-4 space-y-3">
              {orderedSections.map((section) => (
                <article key={section.id} className={innerCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        Position {section.targetOrder}
                      </p>
                      <h4 className="mt-1 text-base font-bold text-white">{section.title}</h4>
                    </div>
                    <span className={pillClass}>
                      {getMultiTrackArrangementSectionKindLabel(section.sectionKind)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Bars {section.startBar}-{section.endBar}. Repeat {section.repeatCount}. Score{" "}
                    {getMultiTrackArrangementComputedScore(section)}.
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Arrangement Lanes</h3>

            <div className="mt-4 space-y-3">
              {state.lanes.map((lane) => {
                const laneSections = getMultiTrackArrangementLaneSections(state, lane.id);

                return (
                  <article key={lane.id} className={innerCardClass}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{lane.title}</h4>
                        <p className={softTextClass}>{lane.description}</p>
                      </div>
                      <span className={pillClass}>
                        {getMultiTrackArrangementReadinessLabel(lane.readinessStatus)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {laneSections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-white">{section.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/60">
                            {getMultiTrackArrangementSectionKindLabel(section.sectionKind)} · Score{" "}
                            {getMultiTrackArrangementComputedScore(section)}
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
            <h3 className="text-lg font-bold text-white">Render Prep</h3>

            <div className="mt-4 space-y-3">
              {state.renderPrepItems.map((item) => (
                <article key={item.id} className={innerCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{item.label}</h4>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {getMultiTrackArrangementSectionTitle(state, item.sectionId)}
                      </p>
                    </div>
                    <span className={pillClass}>
                      {getMultiTrackArrangementPriorityLabel(item.renderPriority)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.detail}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    {getMultiTrackArrangementReadinessLabel(item.readinessStatus)}
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
            body="All section, lane, action, risk, and readiness values are declared in the types file."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Panel imports only arrangement helpers and arrangement seed. Helpers import only arrangement types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score and sort sections. Panel renders it with no route, page, or controller wiring."
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