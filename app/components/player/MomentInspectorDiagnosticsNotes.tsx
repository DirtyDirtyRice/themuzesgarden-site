"use client";

import type { MomentInspectorHealthResult } from "./momentInspectorHealth";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function getHealthLabel(value: number): string {
  const score = clamp01(value);

  if (score < 0.4) return "Weak";
  if (score < 0.75) return "Mixed";
  return "Strong";
}

function getPrimaryMessage(health: MomentInspectorHealthResult): string {
  const overall = clamp01(health.overallHealth);
  const structure = clamp01(health.structureConfidence);
  const repeat = clamp01(health.repeatIntegrity);

  if (overall >= 0.75 && structure >= 0.75 && repeat >= 0.75) {
    return "Repeat structure looks healthy and the current family/action pattern is consistent.";
  }

  if (health.missingActions > 0) {
    return "Missing intended actions were detected, so repeat planning may need inspection.";
  }

  if (health.nearActions > 0) {
    return "Near-match actions were detected, which may indicate phrase drift or weak repeat alignment.";
  }

  return "Diagnostics are present, but the current scoring mix should be reviewed track-by-track.";
}

export default function MomentInspectorDiagnosticsNotes(props: {
  health: MomentInspectorHealthResult | null | undefined;
}) {
  const { health } = props;

  if (!health) return null;

  return (
    <div className="rounded border border-sky-200 bg-sky-50 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
        Diagnostics Notes
      </div>

      <div className="mt-1 text-[11px] text-sky-900">
        Overall status: <span className="font-medium">{getHealthLabel(health.overallHealth)}</span>
      </div>

      <div className="mt-1 text-[10px] text-sky-800">{getPrimaryMessage(health)}</div>
    </div>
  );
}