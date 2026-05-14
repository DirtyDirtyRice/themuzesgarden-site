import type { FindItPanelIntelligence } from "./useFindItPanelIntelligence";
import type { FindItPanelIntelligenceEvent } from "./findItPanelIntelligenceEvents";

function getBoardTone(strength: FindItPanelIntelligence["sync"]["syncStrength"]) {
  if (strength === "strong") {
    return "border-emerald-300/30 bg-emerald-300/10";
  }

  if (strength === "medium") {
    return "border-sky-300/30 bg-sky-300/10";
  }

  if (strength === "weak") {
    return "border-amber-300/30 bg-amber-300/10";
  }

  return "border-white/10 bg-black/30";
}

function getBadgeClasses() {
  return "rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60";
}

function getLayerStatusClasses(status: string) {
  if (status === "focused" || status === "synced") {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100/85";
  }

  if (status === "ready") {
    return "border-sky-300/25 bg-sky-300/10 text-sky-100/85";
  }

  if (status === "attention" || status === "waiting") {
    return "border-amber-300/25 bg-amber-300/10 text-amber-100/85";
  }

  return "border-white/10 bg-black/25 text-white/60";
}

function formatEventKind(kind: FindItPanelIntelligenceEvent["kind"]) {
  return kind.replace(/_/g, " ");
}

function getEventAgeLabel(event: FindItPanelIntelligenceEvent) {
  const elapsed = Math.max(0, Date.now() - event.createdAt);

  if (elapsed < 1000) {
    return "now";
  }

  if (elapsed < 60000) {
    return `${Math.round(elapsed / 1000)}s ago`;
  }

  return `${Math.round(elapsed / 60000)}m ago`;
}

export default function FindItPanelIntelligenceBoard({
  intelligence,
}: {
  intelligence: FindItPanelIntelligence;
}) {
  const badgeClasses = getBadgeClasses();

  return (
    <section className={`rounded-2xl border p-4 ${getBoardTone(intelligence.sync.syncStrength)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Phase 16 Intelligence Layer
          </p>

          <h3 className="mt-1 text-sm font-semibold text-white">
            {intelligence.headline}
          </h3>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            {intelligence.summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={badgeClasses}>{intelligence.sync.syncLabel}</span>
          <span className={badgeClasses}>{intelligence.focus.focusLabel}</span>
          <span className={badgeClasses}>{intelligence.behavior.behaviorLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Cross-panel sync
            </p>

            <p className="text-[11px] text-white/45">
              {intelligence.sync.readyLayerCount} ready / {intelligence.sync.layers.length} layers
            </p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {intelligence.sync.layers.map((layer) => (
              <div
                className={`rounded-xl border p-3 ${getLayerStatusClasses(layer.status)}`}
                key={layer.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{layer.label}</p>

                  <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
                    {layer.status}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 opacity-75">
                  {layer.reason}
                </p>

                <p className="mt-2 text-[11px] leading-4 opacity-60">
                  Next: {layer.nextStep}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              Active focus
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {intelligence.focus.activeLabel}
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Kind
                </p>
                <p className="mt-1 text-xs text-white/70">{intelligence.focus.activeKind}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Index
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {intelligence.focus.selectedIndexLabel}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Results
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {intelligence.focus.matchCountLabel}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-white/55">
              {intelligence.focus.focusMessage}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                Behavior learning
              </p>

              <p className="text-[11px] text-white/45">
                {intelligence.behavior.eventCount} events
              </p>
            </div>

            <p className="mt-2 text-sm leading-5 text-white/70">
              {intelligence.behavior.behaviorMessage}
            </p>

            {intelligence.behavior.recentEvents.length > 0 ? (
              <div className="mt-3 space-y-2">
                {intelligence.behavior.recentEvents.map((event) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-2"
                    key={event.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-white/75">
                        {event.label}
                      </p>

                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                        {formatEventKind(event.kind)} · {getEventAgeLabel(event)}
                      </p>
                    </div>

                    <p className="mt-1 text-[11px] leading-4 text-white/50">
                      {event.detail}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/45">
                No panel behavior has been tracked yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}