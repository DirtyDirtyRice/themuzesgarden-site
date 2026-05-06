import LiveStatusPill from "./LiveStatusPill";

type ExecStatus = "IDLE" | "ARMED" | "RUNNING" | "COMPLETED";

type LastScore = {
  id: string;
  timingErrorMs: number;
  smoothness: number;
};

type TransitionMemoryRecord = {
  id: string;
  timestamp: number;
};

type ViewState = {
  running: boolean;
  bpm: number;
  bar: number;
  beat: number;
  tick: number;
  tickAbs: number;
  tMs: number;
  msPerTick: number;
  windowFrom: number;
  windowTo: number;
  armedPlanId: string | null;
  execStatus: ExecStatus;
  execNote: string | null;
  lastCompletedPlanId: string | null;
  masterA: number;
  masterB: number;
  lastScore: LastScore | null;
  memTotal: number;
  memRecent: TransitionMemoryRecord[];
};

type LiveTransportPanelProps = {
  view: ViewState;
  execIdDisplay: string | null;
  avgDurationDisplay: number;
  onToggleStartStop: () => void;
  onReset: () => void;
  onApplyBpm: (value: number) => void;
  onRefreshMemory: () => void;
  onClearMemory: () => void;
};

function fmtTs(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

export default function LiveTransportPanel({
  view,
  execIdDisplay,
  avgDurationDisplay,
  onToggleStartStop,
  onReset,
  onApplyBpm,
  onRefreshMemory,
  onClearMemory,
}: LiveTransportPanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow">
      <div className="flex flex-wrap items-end gap-3">
        <button
          className="rounded-xl border border-white/10 bg-white px-4 py-2 font-medium text-black shadow transition hover:bg-white/90"
          onClick={onToggleStartStop}
        >
          {view.running ? "Stop" : "Start"}
        </button>

        <button
          className="rounded-xl border border-white/10 bg-white px-4 py-2 font-medium text-black shadow transition hover:bg-white/90"
          onClick={onReset}
        >
          Reset
        </button>

        <div className="flex flex-col">
          <label className="text-xs text-white/60">BPM</label>
          <input
            className="w-28 rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
            type="number"
            min={1}
            step={1}
            value={view.bpm}
            onChange={(e) => onApplyBpm(Number(e.target.value))}
          />
        </div>

        <div className="ml-auto text-xs text-white/60">
          Window {view.windowFrom} → {view.windowTo} ticks
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-white">
          bar={view.bar} beat={view.beat} tick={view.tick}
          <br />
          tickAbs={view.tickAbs}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-white">
          tMs={Math.round(view.tMs)}
          <br />
          msPerTick={view.msPerTick.toFixed(6)}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-sm text-white">
          masterA={view.masterA.toFixed(3)}
          <br />
          masterB={view.masterB.toFixed(3)}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="text-xs text-white/60">Execution</div>
          <div className="mt-2 flex items-center gap-2">
            <LiveStatusPill status={view.execStatus} />
            <span className="font-mono text-xs text-white/75">
              {execIdDisplay ?? "none"}
            </span>
          </div>

          {view.execNote ? (
            <div className="mt-2 text-xs text-white/60">
              {view.execNote}
            </div>
          ) : null}

          {view.execStatus === "COMPLETED" && view.lastCompletedPlanId ? (
            <div className="mt-2 text-[11px] text-white/55">
              lastCompletedPlanId:{" "}
              <span className="font-mono text-white/75">
                {view.lastCompletedPlanId}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
        <div className="text-xs font-semibold text-white">
          Last Transition Score
        </div>

        {view.lastScore ? (
          <div className="mt-2 space-y-1 font-mono text-xs text-white/85">
            <div>id={view.lastScore.id}</div>
            <div>
              timingErrorMs={view.lastScore.timingErrorMs.toFixed(2)}
            </div>
            <div>
              smoothness={view.lastScore.smoothness.toFixed(1)} / 100
            </div>
          </div>
        ) : (
          <div className="mt-1 text-xs text-white/60">
            No score yet — execute a transition.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold text-white">
            Transition Memory (session)
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-lg border border-white/10 bg-white px-3 py-1 text-xs font-medium text-black shadow transition hover:bg-white/90"
              onClick={onRefreshMemory}
            >
              Refresh
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white px-3 py-1 text-xs font-medium text-black shadow transition hover:bg-white/90"
              onClick={onClearMemory}
            >
              Clear Memory
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <div className="text-[11px] text-white/60">
              totalTransitions
            </div>
            <div className="font-mono text-sm text-white">
              {view.memTotal}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <div className="text-[11px] text-white/60">
              avgDuration (display ticks)
            </div>
            <div className="font-mono text-sm text-white">
              {avgDurationDisplay.toFixed(2)}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
            <div className="text-[11px] text-white/60">latest</div>
            <div className="font-mono text-[11px] text-white/85">
              {view.memRecent[0]
                ? `${view.memRecent[0].id} @ ${fmtTs(
                    view.memRecent[0].timestamp
                  )}`
                : "none"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}