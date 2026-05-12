import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export default function FindItSuggestionButton({
  result,
  active,
  onSelect,
}: {
  result: NavigationSearchResult;
  active: boolean;
  onSelect: (result: NavigationSearchResult) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className={[
        "w-full rounded-xl border p-3 text-left transition duration-150",
        "hover:scale-[0.995] hover:opacity-90 active:scale-[0.985]",
        active
          ? "border-white bg-white text-black"
          : "border-white/10 bg-black text-white",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{result.node.label}</span>
        <span
          className={[
            "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
            active
              ? "border-black/20 text-black/70"
              : "border-white/15 text-white/50",
          ].join(" ")}
        >
          {result.node.kind}
        </span>
      </span>

      <span
        className={[
          "mt-2 block text-xs leading-5",
          active ? "text-black/70" : "text-white/55",
        ].join(" ")}
      >
        {result.node.description}
      </span>

      <span
        className={[
          "mt-2 block text-[11px]",
          active ? "text-black/55" : "text-white/40",
        ].join(" ")}
      >
        Matched by: {result.matchedBy} · score {result.score}
      </span>
    </button>
  );
}