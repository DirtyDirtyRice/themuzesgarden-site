"use client";

import type {
  MultiTrackEngineDecisionRoute,
  MultiTrackEngineState,
} from "../../engine/multiTrackEngineTypes";

type Props = {
  engineState: MultiTrackEngineState;
  setDecisionRoute: (route: MultiTrackEngineDecisionRoute) => void;
};

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-xl";

const cardClass = "rounded-2xl border border-white/10 bg-black p-4";

const buttonClass =
  "rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]";

const routes: MultiTrackEngineDecisionRoute[] = [
  "hold",
  "inspect-track-a",
  "inspect-track-b",
  "compare",
  "sync",
  "analyze",
  "save",
  "export",
];

export function MultiTrackDecisionRouteControlPanel({
  engineState,
  setDecisionRoute,
}: Props) {
  const { decision } = engineState;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
          Decision Route Controls
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Route the engine decision center
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
          These buttons call the recovered setDecisionRoute action and prove the
          decision helper path is alive without restoring the broken insight layer.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_2fr]">
        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Current route
          </p>
          <h4 className="mt-2 text-2xl font-black text-white">{decision.route}</h4>
          <p className="mt-3 text-sm leading-6 text-white/70">{decision.reason}</p>
        </article>

        <article className={cardClass}>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Available routes
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {routes.map((route) => (
              <button
                key={route}
                type="button"
                className={`${buttonClass} ${
                  route === decision.route ? "border-white/30 bg-white/[0.12]" : ""
                }`}
                onClick={() => setDecisionRoute(route)}
              >
                {route}
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}