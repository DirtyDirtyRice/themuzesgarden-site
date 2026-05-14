type TrackMatcherControlsProps = {
  autoSyncBToA: boolean;
  onMatchAToB: () => void;
  onMatchBToA: () => void;
  onNudgeBBackward: () => void;
  onNudgeBForward: () => void;
  onPauseBoth: () => void;
  onPlayBoth: () => void;
  onResetBToStart: () => void;
  onStopBoth: () => void;
  onToggleAutoSync: () => void;
};

function buttonClass(extraClassName = "") {
  return `rounded border border-white/20 bg-white px-4 py-2 text-black ${extraClassName}`.trim();
}

export default function TrackMatcherControls({
  autoSyncBToA,
  onMatchAToB,
  onMatchBToA,
  onNudgeBBackward,
  onNudgeBForward,
  onPauseBoth,
  onPlayBoth,
  onResetBToStart,
  onStopBoth,
  onToggleAutoSync,
}: TrackMatcherControlsProps) {
  return (
    <section className="flex flex-col gap-5" aria-label="Track matcher transport controls">
      <div className="flex flex-wrap gap-3">
        <button onClick={onPlayBoth} className={buttonClass()}>
          ▶ Play Both
        </button>

        <button onClick={onPauseBoth} className={buttonClass()}>
          ⏸ Pause Both
        </button>

        <button onClick={onStopBoth} className={buttonClass()}>
          ⏹ Stop Both
        </button>

        <button onClick={onMatchBToA} className={buttonClass()}>
          🎯 B → A
        </button>

        <button onClick={onMatchAToB} className={buttonClass()}>
          🎯 A → B
        </button>

        <button onClick={onToggleAutoSync} className={buttonClass()}>
          🔁 Auto Sync B → A: {autoSyncBToA ? "ON" : "OFF"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onNudgeBBackward} className={buttonClass()}>
          ← Nudge B Back
        </button>

        <button onClick={onNudgeBForward} className={buttonClass()}>
          Nudge B Forward →
        </button>

        <button onClick={onResetBToStart} className={buttonClass()}>
          Reset B to Start
        </button>
      </div>
    </section>
  );
}