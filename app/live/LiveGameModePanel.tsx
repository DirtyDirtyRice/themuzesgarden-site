type GameRoundStatus = "OFF" | "READY" | "COUNTDOWN" | "AWAITING" | "RESULT";

type ComboState = {
  streak: number;
  bestStreak: number;
};

type GameState = {
  enabled: boolean;
  score: number;
  round: number;
  status: GameRoundStatus;
  taskLabel: string;
  countdownText: string | null;
  roundPlanId: string | null;
  resultText: string | null;
  combo: ComboState;
  comboOutcome: "perfect" | "good" | "grace" | "break";
  comboMultiplier: number;
};

type LiveGameModePanelProps = {
  game: GameState;
  startRoundDisabled: boolean;
  nextRoundHot: boolean;
  onToggleEnabled: () => void;
  onStartRound: () => void;
  onNextRound: () => void;
};

function roundStateLabel(status: GameRoundStatus) {
  if (status === "READY") return "READY — click Start Round";
  if (status === "COUNTDOWN") return "COUNTDOWN — waiting for start";
  if (status === "AWAITING") return "RUNNING — play the task";
  if (status === "RESULT") return "RESULT — click Next Round";
  return "OFF";
}

export default function LiveGameModePanel({
  game,
  startRoundDisabled,
  nextRoundHot,
  onToggleEnabled,
  onStartRound,
  onNextRound,
}: LiveGameModePanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold text-white">Game Mode (Solo)</div>

        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold text-white/75">
            {game.enabled ? "ON" : "OFF"}
          </span>

          <button
            className="rounded-xl border border-white/10 bg-white px-4 py-2 text-sm font-medium text-black shadow transition hover:bg-white/90"
            onClick={onToggleEnabled}
          >
            {game.enabled ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      {!game.enabled ? (
        <div className="mt-2 text-xs text-white/60">
          Enable this to get simple performance tasks and earn points.
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-5 rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-xs text-white/60">Round State</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {roundStateLabel(game.status)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-white/55">
              raw={game.status}
            </div>

            {game.status === "AWAITING" ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="text-xs font-semibold text-white">
                  ● LIVE: ROUND RUNNING
                </div>
                <div className="mt-1 text-[11px] text-white/60">
                  Play the task now. Round ends automatically.
                </div>
              </div>
            ) : null}

            {game.status === "RESULT" ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="text-xs font-semibold text-white">
                  ✓ READY: NEXT ROUND
                </div>
                <div className="mt-1 text-[11px] text-white/60">
                  Press “Next Round”, then “Start Round”.
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-xs text-white/60">Score</div>
            <div className="mt-1 font-mono text-lg text-white">
              {game.score}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-xs text-white/60">Round</div>
            <div className="mt-1 font-mono text-lg text-white">
              {Math.max(1, game.round - 1)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-xs text-white/60">Streak</div>
            <div className="mt-1 font-mono text-lg text-white">
              {game.combo.streak}
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              best {game.combo.bestStreak}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-xs text-white/60">Multiplier</div>
            <div className="mt-1 font-mono text-lg text-white">
              ×{game.comboMultiplier.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              {game.comboOutcome}
            </div>
          </div>

          <div className="sm:col-span-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs font-semibold text-white">Task</div>
            <div className="mt-1 text-sm text-white/80">
              {game.taskLabel || "—"}
            </div>

            <div className="mt-2 text-xs text-white/60">
              Countdown:{" "}
              <span className="font-mono text-white/80">
                {game.countdownText ?? "—"}
              </span>
            </div>

            <div className="mt-2 text-xs text-white/60">
              Round Plan:{" "}
              <span className="font-mono text-white/80">
                {game.roundPlanId ?? "—"}
              </span>
            </div>

            {game.resultText ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white/85">
                {game.resultText}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white px-4 py-2 text-sm font-medium text-black shadow transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                onClick={onStartRound}
                disabled={startRoundDisabled}
                title={
                  startRoundDisabled
                    ? "Click Next Round first"
                    : "Start the next round"
                }
              >
                Start Round
              </button>

              <button
                className={`rounded-xl border border-white/10 px-4 py-2 text-sm font-medium shadow transition ${
                  nextRoundHot
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/5 text-white hover:bg-white/10"
                } disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/35`}
                onClick={onNextRound}
                disabled={game.status !== "RESULT"}
              >
                Next Round
              </button>

              <div className="ml-auto text-xs text-white/55">
                Round ends → metronome stops automatically (KISS). Press{" "}
                <span className="font-mono">Next Round</span> then{" "}
                <span className="font-mono">Start Round</span>.
              </div>
            </div>

            <div className="mt-2 text-[11px] text-white/55">
              Debug:{" "}
              <span className="font-mono">
                game.enabled={String(game.enabled)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}