"use client";

import type { ReactNode } from "react";

export type MomentInspectorHostControlStackProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
};

function SafeText({
  value,
  fallback,
  className,
}: {
  value?: unknown;
  fallback: string;
  className?: string;
}) {
  const text = String(value ?? "").trim();
  return <p className={className}>{text || fallback}</p>;
}

export default function MomentInspectorHostControlStack({
  title,
  subtitle,
  children,
}: MomentInspectorHostControlStackProps) {
  return (
    <section className="rounded-xl border border-white/15 bg-black p-4 text-white">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
            Moment Inspector
          </p>

          <SafeText
            value={title}
            fallback="Host Control Stack"
            className="text-sm font-semibold text-white"
          />

          <SafeText
            value={subtitle}
            fallback="Controls are temporarily simplified while the control system is being rebuilt."
            className="text-xs text-white/70"
          />
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-white/75">
          {children ?? (
            <span>
              Track controls module is currently unavailable. This fallback keeps
              the UI stable and the build clean.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}