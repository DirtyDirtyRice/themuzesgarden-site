import type { TrackMatcherFinderStatistics } from "./trackMatcherFinderTypes";

type Props = {
  statistics: TrackMatcherFinderStatistics;
};

export default function TrackMatcherFinderStatsBar({ statistics }: Props) {
  const stats = [
    { label: "Total", value: statistics.totalTracks },
    { label: "Stems", value: statistics.stemTracks },
    { label: "Instrumentals", value: statistics.instrumentalTracks },
    { label: "References", value: statistics.referenceSongs },
    { label: "Hybrid", value: statistics.hybridCandidates },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 text-xs text-white/70 sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[0.62rem] font-black uppercase tracking-[0.14em] text-white/45">
              {stat.label}
            </p>
            <p className="text-sm font-black leading-none text-white">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
