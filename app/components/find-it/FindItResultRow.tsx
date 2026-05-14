import Link from "next/link";

import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

/* =========================
   MATCH / KIND LABELS
========================= */

function getMatchReasonLabel(matchedBy: NavigationSearchResult["matchedBy"]) {
  if (matchedBy === "label") return "Matched by title";
  if (matchedBy === "description") return "Matched by description";
  if (matchedBy === "keywords") return "Matched by keywords";
  if (matchedBy === "href") return "Matched by route";
  if (matchedBy === "title") return "Matched by metadata title";
  if (matchedBy === "slug") return "Matched by metadata slug";
  if (matchedBy === "shelf") return "Matched by metadata shelf";
  if (matchedBy === "section") return "Matched by metadata section";
  if (matchedBy === "excerpt") return "Matched by metadata excerpt";
  if (matchedBy === "metadata") return "Matched by metadata details";

  return "Matched by search";
}

function getResultKindLabel(result: NavigationSearchResult) {
  const cleanKind = result.node.kind.replace(/_/g, " ");
  return cleanKind.charAt(0).toUpperCase() + cleanKind.slice(1);
}

/* =========================
   ACTION INTELLIGENCE
========================= */

function getPrimaryActionLabel(result: NavigationSearchResult) {
  const kindLabel = getResultKindLabel(result).toLowerCase();

  if (kindLabel.includes("metadata")) return "Open metadata";
  if (kindLabel.includes("manual")) return "Open manual";
  if (kindLabel.includes("project")) return "Open project";

  return "Open";
}

function getSecondaryActionCopy(result: NavigationSearchResult) {
  const kindLabel = getResultKindLabel(result).toLowerCase();

  if (kindLabel.includes("metadata")) {
    return "Opens the meaning record behind this result.";
  }

  if (kindLabel.includes("manual")) {
    return "Opens explanation and instructions for this area.";
  }

  if (kindLabel.includes("project")) {
    return "Opens the working project area.";
  }

  return "Opens this destination.";
}

/* =========================
   INTENT + SYSTEM AWARENESS
========================= */

function getIntentPreview(result: NavigationSearchResult) {
  const match = getMatchReasonLabel(result.matchedBy).toLowerCase();

  return `This result appears because your search ${match}.`;
}

function getOutcomePreview(result: NavigationSearchResult) {
  const kind = getResultKindLabel(result).toLowerCase();

  if (kind.includes("metadata")) {
    return "You will move into a knowledge record where meaning, relationships, and structure are explained.";
  }

  if (kind.includes("manual")) {
    return "You will move into a guided explanation area with instructions and system context.";
  }

  if (kind.includes("project")) {
    return "You will move into a working area where actions and edits happen.";
  }

  return "You will move directly to this destination.";
}

function getPathAwarenessCopy(isSelected: boolean, result: NavigationSearchResult) {
  if (isSelected) {
    return "Target Path panel is now building the step-by-step route to this location.";
  }

  return "Select this to preview the exact navigation path before moving.";
}

function getMeaningAwarenessCopy(isSelected: boolean, result: NavigationSearchResult) {
  if (isSelected) {
    return "Meaning panel is now explaining what this result is and how it fits the system.";
  }

  return "Select this to understand what this result means before navigating.";
}

function getSelectionCopy(isSelected: boolean, result: NavigationSearchResult) {
  if (isSelected) {
    return `Active target: "${result.node.label}". All panels are now synchronized to this selection.`;
  }

  return `Select this to make "${result.node.label}" the active target.`;
}

/* =========================
   COMPONENT
========================= */

export default function FindItResultRow({
  isSelected,
  onSelect,
  result,
}: {
  isSelected: boolean;
  onSelect: (result: NavigationSearchResult) => void;
  result: NavigationSearchResult;
}) {
  const href = result.node.href;

  const matchReason = getMatchReasonLabel(result.matchedBy);
  const resultKind = getResultKindLabel(result);

  const primaryActionLabel = getPrimaryActionLabel(result);
  const secondaryActionCopy = getSecondaryActionCopy(result);

  const intentPreview = getIntentPreview(result);
  const outcomePreview = getOutcomePreview(result);

  const selectionCopy = getSelectionCopy(isSelected, result);
  const pathCopy = getPathAwarenessCopy(isSelected, result);
  const meaningCopy = getMeaningAwarenessCopy(isSelected, result);

  return (
    <article
      className={[
        "rounded-2xl border p-4 transition",
        isSelected
          ? "border-amber-200/45 bg-amber-200/[0.08]"
          : "border-white/10 bg-black/35 hover:border-white/30 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(result)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-base font-semibold text-white">
            {result.node.label}
          </p>

          <p className="mt-1 text-sm leading-6 text-white/65">
            {result.node.description}
          </p>
        </button>

        <div className="flex flex-wrap justify-end gap-2">
          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
            {matchReason}
          </span>

          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
            {resultKind}
          </span>
        </div>
      </div>

      {/* ================= INTENT PREVIEW ================= */}
      <div className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/70">
          Why this result exists
        </p>

        <p className="mt-1 text-xs leading-5 text-indigo-100/80">
          {intentPreview}
        </p>
      </div>

      {/* ================= SELECTION STATE ================= */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
        <p className="text-xs leading-5 text-white/70">{selectionCopy}</p>
      </div>

      {/* ================= SYSTEM AWARENESS ================= */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Path system
          </p>
          <p className="mt-1 text-xs text-white/65">{pathCopy}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Meaning system
          </p>
          <p className="mt-1 text-xs text-white/65">{meaningCopy}</p>
        </div>
      </div>

      {/* ================= ACTION PANEL ================= */}
      {href ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                What happens if you open this
              </p>

              <p className="mt-1 text-xs leading-5 text-white/70">
                {outcomePreview}
              </p>

              <p className="mt-2 break-all text-[11px] text-white/45">
                {href}
              </p>

              <p className="mt-1 text-xs text-white/60">
                {secondaryActionCopy}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelect(result)}
                className="rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Select
              </button>

              <Link
                href={href}
                className="rounded-lg border border-white/15 bg-white px-3 py-2 text-xs font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
              >
                {primaryActionLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            No direct navigation
          </p>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Use selection to explore meaning and path before moving.
          </p>
        </div>
      )}
    </article>
  );
}