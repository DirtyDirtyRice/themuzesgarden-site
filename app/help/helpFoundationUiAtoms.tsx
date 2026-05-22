import type { ReactNode } from "react";

import {
  insetPanelClass,
  routeRailClass,
  subTextClass,
  tinyTextClass,
  titleClass,
} from "./helpFoundationStyles";
import type { HelpCardStatus } from "./helpFoundationTypes";

function getStatusLabel(status?: HelpCardStatus) {
  if (status === "verified") return "VERIFIED";
  if (status === "planned") return "PLANNED";
  return "FOUNDATION";
}

function getStatusDetail(status?: HelpCardStatus) {
  if (status === "verified") return "Tested in the real app.";
  if (status === "planned") return "Named for future planning, not finished.";
  return "Built as foundation guidance.";
}

export function StatusPill({
  label,
  title,
}: {
  label: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-xl border border-white/20 bg-black px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
    >
      {label}
    </span>
  );
}

export function CardStatusPill({ status }: { status?: HelpCardStatus }) {
  return (
    <StatusPill
      label={getStatusLabel(status)}
      title={getStatusDetail(status)}
    />
  );
}

export function RouteChip({
  step,
  index,
}: {
  step: string;
  index?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black px-2.5 py-1 text-xs font-bold text-white/80 transition-transform hover:-translate-y-0.5">
      {typeof index === "number" ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[10px] text-white">
          {index + 1}
        </span>
      ) : null}

      <span>{step}</span>
    </span>
  );
}

export function RouteSteps({ steps }: { steps: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {steps.map((step, index) => (
        <span key={`${step}-${index}`} className="flex items-center gap-2">
          <RouteChip step={step} index={index} />

          {index < steps.length - 1 ? (
            <span className="text-xs font-bold text-white/70">→</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function RouteRail({ steps }: { steps: string[] }) {
  return (
    <div className={routeRailClass}>
      {steps.map((step, index) => (
        <div
          key={`${step}-${index}`}
          className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2 transition-transform hover:-translate-y-0.5"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/25 text-[11px] font-bold text-white">
            {index + 1}
          </span>

          <div>
            <div className="text-sm font-bold text-white">{step}</div>

            <div className="mt-1 text-xs text-white/70">
              Step {index + 1} of {steps.length}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HelpNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border border-white/20 bg-black px-3 py-2 text-xs leading-5 text-white/70">
      {children}
    </div>
  );
}

export function HelpCardShell({
  title,
  children,
  status,
}: {
  title: string;
  children: ReactNode;
  status?: HelpCardStatus;
}) {
  return (
    <div
      className={[
        insetPanelClass,
        "transition-transform hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={titleClass}>{title}</div>
        <CardStatusPill status={status} />
      </div>

      <div className={`mt-2 ${subTextClass}`}>{children}</div>
    </div>
  );
}

export function TinyText({ children }: { children: ReactNode }) {
  return <p className={`mt-2 ${tinyTextClass}`}>{children}</p>;
}

export function HelpMiniLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
      {children}
    </div>
  );
}

export function HelpEmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-5">
      <div className="text-lg font-black text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/70">{body}</p>
    </div>
  );
}