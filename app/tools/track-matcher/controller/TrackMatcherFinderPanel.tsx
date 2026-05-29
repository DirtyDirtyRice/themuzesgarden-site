"use client";

import { useMemo, useState } from "react";
import TrackMatcherFinderPresetRail from "./TrackMatcherFinderPresetRail";
import TrackMatcherFinderResultCard from "./TrackMatcherFinderResultCard";
import TrackMatcherFinderSavedSearchRail from "./TrackMatcherFinderSavedSearchRail";
import TrackMatcherFinderSearchControls from "./TrackMatcherFinderSearchControls";
import TrackMatcherFinderStatsBar from "./TrackMatcherFinderStatsBar";
import type { TrackMatcherFinderPanelProps } from "./trackMatcherFinderPanelTypes";
import {
  buildFinderStatistics,
  searchTrackMatcherFinder,
} from "./trackMatcherFinderHelpers";
import { DEFAULT_TRACK_MATCHER_FINDER_QUERY } from "./trackMatcherFinderTypes";

const finderBranchClass =
  "group rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-white shadow-xl transition-transform duration-150 hover:-translate-y-0.5";

const finderBranchSummaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2 py-1 text-left marker:hidden [&::-webkit-details-marker]:hidden";

const finderBranchTitleClass =
  "text-xs font-black uppercase tracking-[0.18em] text-white";

const finderBranchBodyClass =
  "mt-2 rounded-xl border border-white/10 bg-black/35 p-2";

const finderSmallTextClass = "text-xs leading-5 text-white/70";

const finderReferenceCardClass =
  "rounded-xl border border-white/10 bg-white/[0.035] p-2";

const finderReferenceTitleClass =
  "text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/80";

const finderReferenceBodyClass = "mt-1 text-xs leading-5 text-white/60";

function BranchArrow() {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-xs font-black text-white/70 transition group-open:rotate-90">
      ▶
    </span>
  );
}

function FinderBranch({
  title,
  detail,
  defaultOpen = false,
  children,
}: {
  title: string;
  detail: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={finderBranchClass} open={defaultOpen}>
      <summary className={finderBranchSummaryClass}>
        <div className="min-w-0">
          <p className={finderBranchTitleClass}>{title}</p>
          <p className="mt-0.5 truncate text-xs leading-5 text-white/55">
            {detail}
          </p>
        </div>

        <BranchArrow />
      </summary>

      <div className={finderBranchBodyClass}>{children}</div>
    </details>
  );
}

function FinderDashboardTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="group/tile rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2"
      title={detail}
    >
      <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
      <p className="sr-only">{detail}</p>
    </div>
  );
}

function FinderDashboard({
  libraryTrackCount,
  resultLabel,
  currentSearch,
  currentBranch,
  hasQuery,
}: {
  libraryTrackCount: number;
  resultLabel: string;
  currentSearch: string;
  currentBranch: string;
  hasQuery: boolean;
}) {
  const libraryLabel = `${libraryTrackCount} Library track${
    libraryTrackCount === 1 ? "" : "s"
  }`;

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <FinderDashboardTile
        label="Library Tracks"
        value={libraryLabel}
        detail="Songs handed into Finder from the current Library wiring."
      />
      <FinderDashboardTile
        label="Songs Found"
        value={resultLabel}
        detail="Current result count after text search and Deep Search filters."
      />
      <FinderDashboardTile
        label="Current Search"
        value={hasQuery ? currentSearch : "All songs"}
        detail="The active text search without opening the full controls branch."
      />
      <FinderDashboardTile
        label="Deep Search Branch"
        value={currentBranch}
        detail="The active branch from the nested Deep Search tree."
      />
    </div>
  );
}

function FinderReferenceCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className={finderReferenceCardClass}>
      <p className={finderReferenceTitleClass}>{title}</p>
      <p className={finderReferenceBodyClass}>{body}</p>
    </div>
  );
}

function FinderReference() {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <FinderReferenceCard
        title="Sources"
        body="Finder searches the tracks passed into this panel. Source filtering remains inside Deep Search so Library, Supabase, uploads, projects, seed data, and unknown tracks stay searchable without becoming separate page branches."
      />
      <FinderReferenceCard
        title="Track Types"
        body="Stem, instrumental, reference, hybrid, and full-song paths are preserved in Deep Search and inside each expandable song row instead of being spread across the main page."
      />
      <FinderReferenceCard
        title="Routing"
        body="Load-To routing stays inside each selected song row. Track A, Track B, reference, melody, harmony, drums, bass, vocal, instrument, stem, hybrid, and analysis paths remain available without flooding Finder."
      />
      <FinderReferenceCard
        title="Future Song Results"
        body="When the Library grows, Song Results can split into A-F, G-L, M-R, and S-Z branches. Each letter group can then open into song, metadata, routing, and analysis details."
      />
    </div>
  );
}

export default function TrackMatcherFinderPanel({
  tracks = [],
  mode = "expanded",
  onLoadTrack,
}: TrackMatcherFinderPanelProps) {
  const [query, setQuery] = useState(DEFAULT_TRACK_MATCHER_FINDER_QUERY);

  const results = useMemo(
    () => searchTrackMatcherFinder(tracks, query),
    [tracks, query],
  );

  const statistics = useMemo(() => buildFinderStatistics(results), [results]);

  const isCompact = mode === "compact";
  const hasTracks = tracks.length > 0;
  const currentSearch = query.searchText.trim();
  const hasQuery = currentSearch.length > 0;
  const activeBranchLabel = query.searchBranchLabel || "All";
  const resultLabel = `${results.length} song${results.length === 1 ? "" : "s"} found`;
  const layoutGapClass = isCompact ? "mt-3 grid gap-2" : "mt-3 grid gap-2.5";
  const resultGapClass = isCompact ? "grid gap-1.5" : "grid gap-2";

  function applyPreset(searchText: string) {
    setQuery((current) => ({
      ...current,
      searchText,
    }));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black p-2.5 text-white shadow-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-white/50">
              Track Matcher Finder
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">Finder</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-black text-white/65">
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1">
              {resultLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1">
              {hasQuery ? currentSearch : "All songs"}
            </span>
          </div>
        </div>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-white/65">
          Dense Finder mode: search fast, scan song titles first, then open
          Details only when you need metadata, tags, routing, or Load-To.
        </p>
      </div>

      <div className={layoutGapClass}>
        <FinderBranch
          title="Finder Dashboard"
          detail="Quick status for Library tracks, results, search, and Deep Search branch."
          defaultOpen
        >
          <FinderDashboard
            libraryTrackCount={tracks.length}
            resultLabel={resultLabel}
            currentSearch={currentSearch}
            currentBranch={activeBranchLabel}
            hasQuery={hasQuery}
          />
        </FinderBranch>

        <FinderBranch
          title="Search / Find Songs"
          detail="Search box, filters, source controls, tag controls, and result count."
          defaultOpen
        >
          <TrackMatcherFinderSearchControls
            query={query}
            resultCount={results.length}
            onQueryChange={setQuery}
          />

          {hasQuery ? (
            <button
              type="button"
              onClick={() => setQuery(DEFAULT_TRACK_MATCHER_FINDER_QUERY)}
              className="mt-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-black text-white/70 transition-transform duration-150 hover:-translate-y-0.5 hover:text-white active:scale-[0.98]"
            >
              Clear Finder
            </button>
          ) : null}
        </FinderBranch>

        <FinderBranch
          title="Saved Searches"
          detail="Open saved Finder searches only when you need them."
        >
          <TrackMatcherFinderSavedSearchRail onSelectQuery={setQuery} />
        </FinderBranch>

        <FinderBranch
          title="Presets"
          detail="Quick searches for common Finder paths."
        >
          <TrackMatcherFinderPresetRail onSelectPreset={applyPreset} />
        </FinderBranch>

        <FinderBranch
          title="Song Results"
          detail={
            hasTracks
              ? `${resultLabel}. Scan rows first; open Details only on the song you want.`
              : "Waiting for Library wiring."
          }
          defaultOpen
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/45">
                Results
              </p>
              <p className="mt-0.5 truncate text-xs font-black text-white/80">
                {hasTracks ? resultLabel : "Waiting for Library wiring"}
              </p>
            </div>

            <p className="text-xs leading-5 text-white/55">
              Title-first rows. Details stay hidden until opened.
            </p>
          </div>

          <div className={resultGapClass}>
            {results.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-white/60">
                {hasTracks
                  ? "No matches for this Finder search yet. Try rock, funk, keeper, stem, bass, drums, vocal, reference, or hybrid."
                  : "No Finder results yet. The Finder foundation is built, but this panel still needs to be wired to real Library tracks."}
              </div>
            ) : (
              results.map((track) => (
                <TrackMatcherFinderResultCard
                  key={track.id}
                  track={track}
                  onLoadTrack={onLoadTrack}
                />
              ))
            )}
          </div>
        </FinderBranch>

        <FinderBranch
          title="Finder Reference"
          detail="Sources, track types, routing, and future result expansion notes."
        >
          <FinderReference />
        </FinderBranch>

        <FinderBranch
          title="Statistics"
          detail="Finder totals and match statistics."
        >
          <TrackMatcherFinderStatsBar statistics={statistics} />
        </FinderBranch>

        <FinderBranch
          title="More Information"
          detail="What this Finder page is supposed to become."
        >
          <p className={finderSmallTextClass}>
            Finder now follows the Muzes Garden ADD-friendly structure: simple
            page, branch, sub-branch, detail. Future child pages can grow from
            these branches without making the main Finder page visually heavy.
          </p>
        </FinderBranch>
      </div>
    </section>
  );
}
