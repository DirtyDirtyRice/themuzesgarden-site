import type { FindItCommandCenterModel } from "./FindItPanelTypes";

function getStatusClasses(toneClasses: string) {
  return [
    "rounded-xl border px-3 py-2 text-right text-xs font-semibold",
    toneClasses,
  ].join(" ");
}

export default function FindItPanelCommandCenter({
  model,
}: {
  model: FindItCommandCenterModel;
}) {
  const { cleanSearchValue, commandStripCopy, phase, status, syncCards } = model;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Find It command center
          </p>

          <h2 className="mt-2 text-lg font-semibold text-white">
            {phase.headline}
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            {phase.body}
          </p>
        </div>

        <div className={getStatusClasses(status.toneClasses)}>
          <p className="uppercase tracking-[0.16em]">{status.label}</p>

          <p className="mt-1 font-normal normal-case leading-5">
            {status.detail}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {syncCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
              {card.title}
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              {card.value}
            </p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-indigo-300/25 bg-indigo-300/[0.08] px-3 py-2">
        <p className="text-xs leading-5 text-indigo-100/80">
          <span className="font-semibold uppercase tracking-[0.12em] text-indigo-100/60">
            {phase.eyebrow}:
          </span>{" "}
          {phase.nextStep}
        </p>
      </div>

      <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-white/55">
        {commandStripCopy}
      </p>

      {cleanSearchValue ? (
        <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/35">
          Active search: {cleanSearchValue}
        </p>
      ) : null}
    </section>
  );
}