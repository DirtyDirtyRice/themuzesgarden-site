import type { LyricsLibraryStats } from "./lyricsTypes";

type LyricsLibraryStatsPanelProps = {
  stats: LyricsLibraryStats;
};

export default function LyricsLibraryStatsPanel({
  stats,
}: LyricsLibraryStatsPanelProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/55">
            Lyrics Library Stats
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            {stats.shownEntries} shown of {stats.totalEntries} total
          </h2>
        </div>

        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {stats.needsReviewCount} needs review
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Draft</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.draftCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Working</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.workingCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Keeper</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.keeperCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Finished</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.finishedCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Archived</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.archivedCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Review</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.needsReviewCount}
          </p>
        </div>
      </div>
    </section>
  );
}