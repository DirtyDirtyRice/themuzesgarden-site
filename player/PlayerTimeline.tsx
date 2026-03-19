"use client";

function fmtTime(sec: number): string {
  const s = Number.isFinite(sec) ? Math.max(0, Math.floor(sec)) : 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function PlayerTimeline(props: {
  durSec: number;
  curSec: number;
  isSeeking: boolean;
  seekSec: number;
  setIsSeeking: React.Dispatch<React.SetStateAction<boolean>>;
  setSeekSec: React.Dispatch<React.SetStateAction<number>>;
  finishSeek: () => void;
}) {
  const { durSec, curSec, isSeeking, seekSec, setIsSeeking, setSeekSec, finishSeek } = props;

  return (
    <div className="space-y-1">
      <input
        type="range"
        min={0}
        max={Math.max(0, durSec)}
        step={0.01}
        value={isSeeking ? seekSec : curSec}
        disabled={!durSec || durSec <= 0}
        onChange={(e) => {
          const v = Number(e.target.value);
          setIsSeeking(true);
          setSeekSec(Number.isFinite(v) ? v : 0);
        }}
        onMouseUp={finishSeek}
        onTouchEnd={finishSeek}
        onPointerUp={finishSeek}
        onBlur={finishSeek}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            finishSeek();
          }
        }}
        className="w-full"
        title="Scrub / seek"
      />
      <div className="flex items-center justify-between text-[11px] text-zinc-600">
        <span>{fmtTime(isSeeking ? seekSec : curSec)}</span>
        <span>{durSec > 0 ? fmtTime(durSec) : "--:--"}</span>
      </div>
    </div>
  );
}