"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { buildLibraryGroundworkTracks } from "../../library/libraryTrackGroundwork";
import { useLibraryTracks } from "../../library/useLibraryTracks";
import TrackMatcherFinderPanel from "./controller/TrackMatcherFinderPanel";
import { TRACK_MATCHER_FINDER_ROUTE_GROUPS } from "./controller/trackMatcherFinderDestinationSeed";
import { adaptLibraryTracksToFinderResults } from "./controller/trackMatcherFinderLibraryAdapter";
import {
  TRACK_MATCHER_FINDER_QUICK_SEARCHES,
  TRACK_MATCHER_FINDER_SOURCES,
} from "./controller/trackMatcherFinderSeed";
import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderSource,
  TrackMatcherFinderTrackResult,
} from "./controller/trackMatcherFinderTypes";

type TrackMatcherFinderDropdownProps = {
  onLoadTrack: (
    track: TrackMatcherFinderTrackResult,
    destination: TrackMatcherFinderDestination,
  ) => void;
};

type FinderMetric = {
  label: string;
  value: number;
  detail: string;
};

type FinderTrackTypeCard = {
  label: string;
  count: number;
  detail: string;
};

const liftClass =
  "transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const sectionClass =
  "rounded-2xl border border-white/10 bg-black/35 p-3";

const branchClass =
  "group/branch rounded-2xl border border-white/10 bg-white/[0.035]";

const branchSummaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3";

const branchTitleClass =
  "text-xs font-black uppercase tracking-[0.22em] text-white/55";

const branchBodyClass = "border-t border-white/10 p-3";

const chipClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/65";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function FinderStatusPill({ count }: { count: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/60">
      {count} finder tracks
    </span>
  );
}

function FinderBranchArrow() {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/70 transition-transform duration-150 group-open/branch:rotate-90">
      ›
    </span>
  );
}

function FinderBranch({
  children,
  defaultOpen = false,
  detail,
  title,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  detail: string;
  title: string;
}) {
  return (
    <details className={branchClass} open={defaultOpen}>
      <summary className={`${branchSummaryClass} ${liftClass}`}>
        <span className="min-w-0">
          <span className={branchTitleClass}>{title}</span>
          <span className="mt-1 block truncate text-xs text-white/45">
            {detail}
          </span>
        </span>

        <FinderBranchArrow />
      </summary>

      <div className={branchBodyClass}>{children}</div>
    </details>
  );
}

function FinderInfoGrid({ metrics }: { metrics: FinderMetric[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
            {metric.label}
          </p>
          <p className="mt-2 font-mono text-2xl font-black text-white">
            {metric.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            {metric.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function FinderSourceGrid({
  tracks,
}: {
  tracks: readonly TrackMatcherFinderTrackResult[];
}) {
  function countSource(source: TrackMatcherFinderSource) {
    return tracks.filter((track) => track.source === source).length;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {TRACK_MATCHER_FINDER_SOURCES.map((source) => {
        const count = countSource(source.id);

        return (
          <div
            key={source.id}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-white/85">
                {source.label}
              </p>
              <span className={chipClass}>{count}</span>
            </div>

            <p className="mt-2 text-xs leading-5 text-white/50">
              {count > 0
                ? "Available in the current Finder track pool."
                : "No visible tracks from this source yet."}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FinderQuickSearchPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      {TRACK_MATCHER_FINDER_QUICK_SEARCHES.map((term) => (
        <span key={term} className={chipClass}>
          {term}
        </span>
      ))}
    </div>
  );
}

function FinderTrackTypeGrid({
  cards,
}: {
  cards: readonly FinderTrackTypeCard[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-white/85">{card.label}</p>
            <span className={chipClass}>{card.count}</span>
          </div>

          <p className="mt-2 text-xs leading-5 text-white/50">
            {card.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function FinderRouteGroupsPreview() {
  return (
    <div className="grid gap-2 lg:grid-cols-3">
      {TRACK_MATCHER_FINDER_ROUTE_GROUPS.map((group) => (
        <div
          key={group.id}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
        >
          <p className="text-sm font-black text-white/85">{group.label}</p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            {group.detail}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {group.destinations.map((destination) => (
              <span key={destination} className={chipClass}>
                {String(destination).replaceAll("-", " ")}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FinderSavedSearchPreview() {
  const savedSearches = [
    {
      title: "Deck-ready songs",
      detail: "Good first pass for loading full tracks into Track A or Track B.",
      terms: ["keeper", "reference", "instrumental"],
    },
    {
      title: "Stem hunt",
      detail: "Fast path for material that will later feed lane routing.",
      terms: ["stem", "drums", "bass", "vocal"],
    },
    {
      title: "Hybrid ideas",
      detail: "Find blended candidates, experiments, and possible mashup parts.",
      terms: ["hybrid", "suno", "melody", "harmony"],
    },
  ];

  return (
    <div className="grid gap-2 lg:grid-cols-3">
      {savedSearches.map((search) => (
        <div
          key={search.title}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
        >
          <p className="text-sm font-black text-white/85">{search.title}</p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            {search.detail}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {search.terms.map((term) => (
              <span key={term} className={chipClass}>
                {term}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildFinderMetrics(
  tracks: readonly TrackMatcherFinderTrackResult[],
): FinderMetric[] {
  const playableTracks = tracks.filter((track) => Boolean(track.audioUrl));
  const taggedTracks = tracks.filter((track) => track.tags.length > 0);
  const routableTracks = tracks.filter(
    (track) =>
      track.destinationHints.includes("track-a") ||
      track.destinationHints.includes("track-b"),
  );

  return [
    {
      label: "Total",
      value: tracks.length,
      detail: "Visible Library-ready tracks in the Finder pool.",
    },
    {
      label: "Playable",
      value: playableTracks.length,
      detail: "Tracks with audio URLs that can load into decks now.",
    },
    {
      label: "Tagged",
      value: taggedTracks.length,
      detail: "Tracks with searchable tags available.",
    },
    {
      label: "Deck hints",
      value: routableTracks.length,
      detail: "Tracks with Track A or Track B destination hints.",
    },
  ];
}

function buildFinderTrackTypeCards(
  tracks: readonly TrackMatcherFinderTrackResult[],
): FinderTrackTypeCard[] {
  const stems = tracks.filter((track) => track.isStem).length;
  const instrumentals = tracks.filter((track) => track.isInstrumental).length;
  const references = tracks.filter((track) => track.isReferenceSong).length;
  const hybrids = tracks.filter((track) => track.isHybridCandidate).length;

  return [
    {
      label: "Stems",
      count: stems,
      detail: "Stem material for future lane routing.",
    },
    {
      label: "Instrumentals",
      count: instrumentals,
      detail: "Instrumental tracks and non-vocal ideas.",
    },
    {
      label: "References",
      count: references,
      detail: "Reference songs for comparison and direction.",
    },
    {
      label: "Hybrids",
      count: hybrids,
      detail: "Blended candidates, experiments, and mixed sources.",
    },
  ];
}

function buildFinderStatusText({
  checkingSession,
  supabaseErr,
  supabaseLoaded,
}: {
  checkingSession: boolean;
  supabaseErr: string | null;
  supabaseLoaded: boolean;
}) {
  if (checkingSession) return "Checking Library session…";
  if (supabaseErr) return `Library warning: ${supabaseErr}`;
  if (supabaseLoaded) return "Searching Supabase, uploaded, and seed tracks.";
  return "Searching available local and seed tracks.";
}

function buildFinderSubtitle({
  playableCount,
  totalCount,
}: {
  playableCount: number;
  totalCount: number;
}) {
  if (totalCount === 0) {
    return "Finder is mounted, but no visible Library tracks are available yet.";
  }

  if (playableCount === 0) {
    return "Search works now. Deck loading waits for tracks with playable audio URLs.";
  }

  return "Search works now. Playable results can load directly into Track A or Track B.";
}

export default function TrackMatcherFinderDropdown({
  onLoadTrack,
}: TrackMatcherFinderDropdownProps) {
  const router = useRouter();

  const {
    checkingSession,
    supabaseLoaded,
    supabaseErr,
    tracks: libraryTracks,
  } = useLibraryTracks({ router });

  const finderTracks = useMemo(() => {
    const groundworkTracks = buildLibraryGroundworkTracks(
      (libraryTracks as unknown as Record<string, unknown>[]) ?? [],
    );

    const visibleTracks = groundworkTracks.filter(
      (track) => track.libraryAccess.visibility !== "private",
    );

    return adaptLibraryTracksToFinderResults(visibleTracks);
  }, [libraryTracks]);

  const metrics = useMemo(() => buildFinderMetrics(finderTracks), [finderTracks]);

  const trackTypeCards = useMemo(
    () => buildFinderTrackTypeCards(finderTracks),
    [finderTracks],
  );

  const statusText = buildFinderStatusText({
    checkingSession,
    supabaseErr,
    supabaseLoaded,
  });

  const playableCount = finderTracks.filter((track) =>
    Boolean(track.audioUrl),
  ).length;

  const finderSubtitle = buildFinderSubtitle({
    playableCount,
    totalCount: finderTracks.length,
  });

  const activeTags = Array.from(
    new Set(
      finderTracks
        .flatMap((track) => track.tags)
        .map(normalize)
        .filter(Boolean),
    ),
  ).slice(0, 18);

  return (
    <details className="group mt-3 rounded-2xl border border-orange-400/25 bg-orange-500/[0.035] shadow-xl shadow-orange-950/20">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 ${liftClass}`}
      >
        <span className="group/hint relative inline-flex min-w-0 items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600" />
          <span className="truncate text-sm font-black text-white/90">
            Finder
          </span>
          <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-80 rounded-2xl border border-white/15 bg-black p-3 text-xs leading-5 text-white/75 shadow-2xl shadow-black group-hover/hint:block">
            Finder searches Library tracks and loads a selected result into Track A or Track B while keeping the main Track Matcher page simple.
          </span>
        </span>

        <span className="flex items-center gap-2">
          <FinderStatusPill count={finderTracks.length} />

          <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/70 transition-transform duration-150 group-open:rotate-90">
            ›
          </span>
        </span>
      </summary>

      <div className="border-t border-white/10 p-3">
        <div className={sectionClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                Library Finder
              </p>
              <p className="mt-1 text-sm text-white/60">{statusText}</p>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">
                {finderSubtitle}
              </p>
            </div>

            <span className={chipClass}>{playableCount} playable now</span>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <FinderInfoGrid metrics={metrics} />

          <FinderBranch
            defaultOpen
            title="Quick Search"
            detail="Fast searchable words already supported by Finder."
          >
            <FinderQuickSearchPreview />
          </FinderBranch>

          <FinderBranch
            title="Sources"
            detail="Source buckets already defined for Library, Project, Upload, Supabase, Seed, and Unknown."
          >
            <FinderSourceGrid tracks={finderTracks} />
          </FinderBranch>

          <FinderBranch
            title="Track Types"
            detail="The existing query model already supports stems, instrumentals, references, and hybrids."
          >
            <FinderTrackTypeGrid cards={trackTypeCards} />
          </FinderBranch>

          <FinderBranch
            title="Saved Searches"
            detail="Current saved-search concepts surfaced without changing the controller."
          >
            <FinderSavedSearchPreview />
          </FinderBranch>

          <FinderBranch
            title="Load To"
            detail="The route seed already separates deck loading, core lanes, and support lanes."
          >
            <FinderRouteGroupsPreview />
          </FinderBranch>

          <FinderBranch
            defaultOpen
            title="Results"
            detail="Live Finder panel with search controls, stats, result cards, and deck-load buttons."
          >
            {activeTags.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {activeTags.map((tag) => (
                  <span key={tag} className={chipClass}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <TrackMatcherFinderPanel
              tracks={finderTracks}
              mode="compact"
              onLoadTrack={onLoadTrack}
            />
          </FinderBranch>
        </div>
      </div>
    </details>
  );
}
