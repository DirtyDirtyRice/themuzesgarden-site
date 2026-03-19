"use client";

export default function PlayerTagIntelligencePanel(props: {
  compact: boolean;
  tab: "project" | "search";
  topTags: Array<{
    tag: string;
    total: number;
    trackCount: number;
    sectionCount: number;
    originLabel: string;
  }>;
  onTagClick: (tag: string) => void;
}) {
  const { compact, tab, topTags, onTagClick } = props;

  if (compact || tab !== "search" || topTags.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-700">Top Tag Intelligence</div>
        <div className="text-[10px] text-zinc-500">
          Heat-ready track + moment frequency
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {topTags.map(({ tag, total, trackCount, sectionCount, originLabel }) => (
          <button
            key={tag}
            type="button"
            className="rounded border bg-white px-2 py-1 text-[10px] text-zinc-700 hover:bg-zinc-100"
            onClick={() => onTagClick(tag)}
            title={`Search tag: ${tag} • source: ${originLabel} • track tags: ${trackCount} • moment tags: ${sectionCount}`}
          >
            {tag} ({total})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {topTags.slice(0, 6).map(({ tag, originLabel }) => (
          <div
            key={`${tag}:${originLabel}`}
            className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500"
            title={`${tag} source`}
          >
            {tag}: {originLabel}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-zinc-500">
        Counts include both whole-track tags and indexed sound-moment tags.
      </div>
    </div>
  );
}