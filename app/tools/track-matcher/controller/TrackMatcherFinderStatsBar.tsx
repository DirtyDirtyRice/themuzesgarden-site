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
    <div className="grid grid-cols-2 gap-2 text-xs text-white/70 sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
        >
          <p className="text-white/40">{stat.label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}