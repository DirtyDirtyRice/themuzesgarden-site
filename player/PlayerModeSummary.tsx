"use client";

export default function PlayerModeSummary(props: {
  tab: "project" | "search";
  shuffle: boolean;
  loop: boolean;
  statusVolPct: number;
  statusTime: string;
  trackCountLabel: string;
}) {
  const { tab, shuffle, loop, statusVolPct, statusTime, trackCountLabel } = props;

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black px-3 py-2">
      <div className="text-[11px] text-[color:var(--text-normal)]">
        <span className="font-medium text-[color:var(--text-strong)]">
          {tab === "project" ? "Project Mode" : "Search Mode"}
        </span>
        {" • "}
        <span>Shuffle: {shuffle ? "On" : "Off"}</span>
        {" • "}
        <span>Loop: {loop ? "On" : "Off"}</span>
      </div>

      <div className="text-[11px] text-[color:var(--text-normal)]">
        <span>Vol {statusVolPct}%</span>
        {" • "}
        <span>{statusTime}</span>
        {" • "}
        <span>{trackCountLabel}</span>
      </div>
    </div>
  );
}