import {
  getMultiTrackKeeperPromotionComputedScore,
  getMultiTrackKeeperPromotionDecisionForItem,
  getMultiTrackKeeperPromotionItemTitle,
  getMultiTrackKeeperPromotionLaneItems,
  getMultiTrackKeeperPromotionPassedCheckCount,
  getMultiTrackKeeperPromotionPriorityLabel,
  getMultiTrackKeeperPromotionReadinessLabel,
  getMultiTrackKeeperPromotionReasonLabel,
  getMultiTrackKeeperPromotionStageLabel,
  getMultiTrackKeeperPromotionTargetLabel,
  getMultiTrackKeeperPromotionWorkspaceSummary,
  sortMultiTrackKeeperPromotionItemsByScore,
} from "./MultiTrackKeeperPromotionHelpers";
import { multiTrackKeeperPromotionWorkspaceState } from "./MultiTrackKeeperPromotionSeed";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass =
  "rounded-2xl border border-white/10 bg-black p-4 text-white";

const softTextClass = "text-sm leading-6 text-white/70";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80";

export function MultiTrackKeeperPromotionWorkspacePanel() {
  const state = multiTrackKeeperPromotionWorkspaceState;
  const summary = getMultiTrackKeeperPromotionWorkspaceSummary(state);
  const sortedItems = sortMultiTrackKeeperPromotionItemsByScore(state.items);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Keeper Promotion
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>
            {getMultiTrackKeeperPromotionReadinessLabel(state.readinessStatus)}
          </span>
          <span className={pillClass}>Seed Safe</span>
          <span className={pillClass}>No Wiring</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Items" value={String(summary.itemCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Approved" value={String(summary.approvedCount)} />
        <SummaryCard label="Prepared" value={String(summary.preparedCount)} />
        <SummaryCard label="Archived" value={String(summary.archivedCount)} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
          Best Promotion Target
        </p>
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{summary.bestItemTitle}</h3>
            <p className={softTextClass}>
              This is the strongest seed-safe promotion item. Later this can trigger real keeper bank,
              extraction lane, duplication, arrangement, and render queue workflows.
            </p>
          </div>
          <div className="text-4xl font-black text-white">{summary.bestItemScore}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-white">Promotion Items</h3>

          <div className="mt-4 space-y-3">
            {sortedItems.map((item) => {
              const decision = getMultiTrackKeeperPromotionDecisionForItem(state.decisions, item.id);

              return (
                <article key={item.id} className={innerCardClass}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{item.title}</h4>
                      <p className={softTextClass}>
                        {item.versionLabel} · {getMultiTrackKeeperPromotionTargetLabel(item.target)} ·{" "}
                        {getMultiTrackKeeperPromotionStageLabel(item.stage)}
                      </p>
                    </div>

                    <div className="text-3xl font-black text-white">
                      {getMultiTrackKeeperPromotionComputedScore(item)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={pillClass}>
                      {getMultiTrackKeeperPromotionReadinessLabel(item.readinessStatus)}
                    </span>
                    <span className={pillClass}>
                      {getMultiTrackKeeperPromotionPriorityLabel(item.priority)}
                    </span>
                    <span className={pillClass}>
                      Checks {getMultiTrackKeeperPromotionPassedCheckCount(item)}/{item.checks.length}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/70">{item.detail}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <span key={reason} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                        {getMultiTrackKeeperPromotionReasonLabel(reason)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {item.checks.map((check) => (
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

                  {decision ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        Decision
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">{decision.label}</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">{decision.detail}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="text-lg font-bold text-white">Promotion Lanes</h3>

            <div className="mt-4 space-y-3">
              {state.lanes.map((lane) => {
                const laneItems = getMultiTrackKeeperPromotionLaneItems(state, lane.id);

                return (
                  <article key={lane.id} className={innerCardClass}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{lane.title}</h4>
                        <p className={softTextClass}>{lane.description}</p>
                      </div>
                      <span className={pillClass}>
                        {getMultiTrackKeeperPromotionReadinessLabel(lane.readinessStatus)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {laneItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/60">
                            {item.actionLabel} · Score {getMultiTrackKeeperPromotionComputedScore(item)}
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
            <h3 className="text-lg font-bold text-white">Decision Board</h3>

            <div className="mt-4 space-y-3">
              {state.decisions.map((decision) => (
                <article key={decision.id} className={innerCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                        {decision.approved ? "Approved" : "Not Approved"}
                      </p>
                      <h4 className="mt-1 text-base font-bold text-white">{decision.label}</h4>
                    </div>
                    <span className={pillClass}>{getMultiTrackKeeperPromotionStageLabel(decision.stage)}</span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {getMultiTrackKeeperPromotionItemTitle(state, decision.itemId)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{decision.detail}</p>
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
            body="All promotion values are declared in the types file and used by seed, helpers, and panel."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Panel imports only promotion helpers and promotion seed. Helpers import only promotion types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score, sort, and map lanes. Panel renders it with no controller or page wiring."
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

function ValidationCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/70">{body}</p>
    </div>
  );
}