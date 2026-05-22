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

export function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-xl border border-white/25 bg-black px-2 py-1 text-[11px] font-bold text-white">
      {label}
    </span>
  );
}

export function CardStatusPill({ status }: { status?: HelpCardStatus }) {
  return <StatusPill label={getStatusLabel(status)} />;
}

export function RouteSteps({ steps }: { steps: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {steps.map((step, index) => (
        <span key={`${step}-${index}`} className="flex items-center gap-2">
          <StatusPill label={step} />
          {index < steps.length - 1 ? (
            <span className="text-xs font-bold text-white/70">↓</span>
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
        <div key={`${step}-${index}`} className="flex items-center gap-3 py-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-[11px] font-bold text-white">
            {index + 1}
          </span>
          <span className="text-white/70">{step}</span>
        </div>
      ))}
    </div>
  );
}

export function HelpNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border border-white/25 bg-black px-3 py-2 text-xs leading-5 text-white/70">
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
    <div className={insetPanelClass}>
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
