export const relationshipPanelClass =
  "rounded-3xl border border-white/10 bg-black p-5 text-white shadow-2xl";

export const relationshipCardClass =
  "rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white";

export const relationshipSoftTextClass = "text-sm leading-6 text-white/70";

export const relationshipBrightTextClass = "text-sm font-black text-white";

export const relationshipEyebrowClass =
  "text-xs font-black uppercase tracking-[0.18em] text-white/70";

export const relationshipPillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/70";

export function getRelationshipStrengthLabel(strength: string): string {
  switch (strength) {
    case "excellent":
      return "Excellent";
    case "strong":
      return "Strong";
    case "usable":
      return "Usable";
    case "weak":
      return "Weak";
    default:
      return "Unknown";
  }
}

export function getRelationshipPolarityLabel(polarity: string): string {
  switch (polarity) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    default:
      return "Neutral";
  }
}