import Link from "next/link";

import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

function getMatchReasonLabel(matchedBy: NavigationSearchResult["matchedBy"]) {
  if (matchedBy === "label") {
    return "Matched by title";
  }

  if (matchedBy === "description") {
    return "Matched by description";
  }

  if (matchedBy === "keywords") {
    return "Matched by keywords";
  }

  if (matchedBy === "href") {
    return "Matched by route";
  }

  if (matchedBy === "title") {
    return "Matched by metadata title";
  }

  if (matchedBy === "slug") {
    return "Matched by metadata slug";
  }

  if (matchedBy === "shelf") {
    return "Matched by metadata shelf";
  }

  if (matchedBy === "section") {
    return "Matched by metadata section";
  }

  if (matchedBy === "excerpt") {
    return "Matched by metadata excerpt";
  }

  if (matchedBy === "metadata") {
    return "Matched by metadata details";
  }

  return "Matched by search";
}

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

  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className={[
        "w-full rounded-2xl border p-4 text-left transition",
        isSelected
          ? "border-amber-200/45 bg-amber-200/[0.08]"
          : "border-white/10 bg-black/35 hover:border-white/30 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">
            {result.node.label}
          </p>

          <p className="mt-1 text-sm leading-6 text-white/60">
            {result.node.description}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {matchReason}
        </span>
      </div>

      {href ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-white/40">{href}</span>

          <Link
            href={href}
            onClick={(event) => event.stopPropagation()}
            className="rounded-lg border border-white/15 bg-white px-3 py-2 text-xs font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
          >
            Open
          </Link>
        </div>
      ) : null}
    </button>
  );
}