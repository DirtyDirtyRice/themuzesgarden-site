import type { ReactNode } from "react";

import type { HeaderMetric } from "./relationshipExplorerHeaderUtils";
import type { ReadoutRow } from "./RelationshipExplorerCardHelpers";

export function ReadoutMiniRows({ rows }: { rows: ReadoutRow[] }) {
  return (
    <div className="mt-2 space-y-1.5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-md border border-white/10 px-2 py-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-medium text-white/50">
              {row.label}
            </p>

            <p className="text-[10px] text-white/45">{row.value}</p>
          </div>

          <p className="mt-0.5 text-[10px] leading-4 text-white/30">
            {row.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SectionEyebrow({ label }: { label: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
      {label}
    </p>
  );
}

export function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["rounded-lg border border-white/15 bg-black p-3", className].join(" ")}>
      {children}
    </div>
  );
}

export function MiniMeter({
  label,
  percent,
  detail,
}: {
  label: string;
  percent: number;
  detail: string;
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="mt-2 rounded-md border border-white/10 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-white/50">{label}</p>
        <p className="text-[10px] text-white/45">{safePercent}%</p>
      </div>

      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/60" style={{ width: `${safePercent}%` }} />
      </div>

      <p className="mt-1 text-[10px] leading-4 text-white/30">{detail}</p>
    </div>
  );
}

export function HeaderMetricCard({ metric }: { metric: HeaderMetric }) {
  return (
    <CardShell className="border-white/20">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
        {metric.label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white/80">
        {metric.value}
      </p>

      <p className="mt-1 text-xs leading-5 text-white/45">{metric.detail}</p>

      <p className="mt-1 text-[10px] leading-4 text-white/30">
        {metric.help}
      </p>
    </CardShell>
  );
}