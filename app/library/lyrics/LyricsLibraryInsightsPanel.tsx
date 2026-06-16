import type { LyricsLibraryInsights } from "./lyricsLibraryInsightsHelpers";

type LyricsLibraryInsightsPanelProps = {
  insights: LyricsLibraryInsights;
};

export default function LyricsLibraryInsightsPanel({
  insights,
}: LyricsLibraryInsightsPanelProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/55">
            Lyrics Insights
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            {insights.mostRecentEntry
              ? insights.mostRecentEntry.title
              : "No lyrics loaded"}
          </h2>

          <p className="mt-1 text-sm text-white/65">
            Most recently updated lyric snapshot.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {insights.readinessLabel}
          </span>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {insights.sourceLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {insights.summaryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-black p-4"
          >
            <p className="text-xs text-white/55">{item.label}</p>

            <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>

            <p className="mt-2 text-xs leading-5 text-white/60">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}