export const syncPanelClass =
  "rounded-3xl border border-white/10 bg-black p-5 text-white shadow-2xl";

export const syncCardClass =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white";

export const syncSoftTextClass = "text-sm leading-6 text-white/70";

export const syncEyebrowClass =
  "text-xs font-black uppercase tracking-[0.18em] text-white/70";

export const syncPillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/70";

export function formatSyncSeconds(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

export function formatSyncConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}