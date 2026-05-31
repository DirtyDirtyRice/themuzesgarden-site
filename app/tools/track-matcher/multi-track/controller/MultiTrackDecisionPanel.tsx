"use client";

import type {
  MultiTrackDecisionKind,
  MultiTrackDecisionOption,
  MultiTrackDecisionRecord,
} from "../session/multiTrackDecisionTypes";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/75 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

type SelectableDecisionKind = Exclude<MultiTrackDecisionKind, "undecided">;

type Props = {
  activeConfidenceLabel: string;
  activeDecision: MultiTrackDecisionRecord;
  decisionHistory: MultiTrackDecisionRecord[];
  decisionOptions: MultiTrackDecisionOption[];
  onSelectDecision: (kind: SelectableDecisionKind) => void;
};

function DecisionOptionCard({
  option,
  onSelectDecision,
}: {
  option: MultiTrackDecisionOption;
  onSelectDecision: (kind: SelectableDecisionKind) => void;
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Decision Option
          </p>
          <h3 className="mt-2 text-sm font-black text-white">
            {option.label}
          </h3>
        </div>

        <button
          className={buttonClass}
          type="button"
          onClick={() => onSelectDecision(option.kind)}
        >
          Select
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/55">
        {option.detail}
      </p>

      <div className="mt-3 grid gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/45">
            Save Route
          </p>
          <p className="mt-1 text-xs font-black text-white/70">
            {option.saveRoute}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/45">
            Prompt Route
          </p>
          <p className="mt-1 text-xs font-black text-white/70">
            {option.promptRoute}
          </p>
        </div>
      </div>
    </article>
  );
}

function DecisionHistoryList({
  history,
}: {
  history: MultiTrackDecisionRecord[];
}) {
  return (
    <div className="grid gap-2">
      {history.slice(0, 5).map((record) => (
        <article
          key={record.id}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-black text-white/80">
              {record.label}
            </p>

            <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-white/45">
              {record.confidence}
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {record.detail}
          </p>
        </article>
      ))}
    </div>
  );
}

export function MultiTrackDecisionPanel({
  activeConfidenceLabel,
  activeDecision,
  decisionHistory,
  decisionOptions,
  onSelectDecision,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Decision System
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            {activeDecision.label}
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            Stores the future Match, Reference, Hybrid, or Reject decision
            outside the controller body so decision logic does not become another
            giant file problem.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
          {activeConfidenceLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {decisionOptions.map((option) => (
          <DecisionOptionCard
            key={option.kind}
            option={option}
            onSelectDecision={onSelectDecision}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <article className={cardClass}>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Active Decision
          </p>

          <p className="mt-2 text-sm font-black text-white/80">
            {activeDecision.label}
          </p>

          <p className="mt-2 text-xs leading-5 text-white/55">
            {activeDecision.detail}
          </p>
        </article>

        <article className={cardClass}>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Decision History
          </p>

          <div className="mt-3">
            <DecisionHistoryList history={decisionHistory} />
          </div>
        </article>
      </div>
    </section>
  );
}