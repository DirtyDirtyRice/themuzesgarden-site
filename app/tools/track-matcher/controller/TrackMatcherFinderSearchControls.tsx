"use client";

import { TRACK_MATCHER_FINDER_QUICK_SEARCHES } from "./trackMatcherFinderSeed";
import type { TrackMatcherFinderSearchControlsProps } from "./trackMatcherFinderPanelTypes";
import type {
  TrackMatcherFinderCategory,
  TrackMatcherFinderSource,
} from "./trackMatcherFinderTypes";

type FinderLeaf = {
  label: string;
  searchText: string;
};

type FinderTreeNode = {
  label: string;
  detail: string;
  leaves?: FinderLeaf[];
  children?: FinderTreeNode[];
};

type FinderBranch = {
  id: TrackMatcherFinderCategory;
  label: string;
  detail: string;
  children: FinderTreeNode[];
};

const finderSmallButtonClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/70 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:text-white active:scale-[0.98]";

const finderBranchClass =
  "group rounded-2xl border border-white/10 bg-black/30 p-3";

const finderSubBranchClass =
  "group rounded-2xl border border-white/10 bg-white/[0.04] p-3";

const finderDeepBranchClass =
  "group rounded-2xl border border-white/10 bg-black/30 p-3";

const finderBranchSummaryClass =
  "flex cursor-pointer list-none items-center justify-between gap-3 marker:hidden [&::-webkit-details-marker]:hidden";

const sourceTerms: Array<{
  label: string;
  value: TrackMatcherFinderSource;
  searchText: string;
}> = [
  { label: "Library", value: "library", searchText: "library" },
  { label: "Supabase", value: "supabase", searchText: "supabase" },
  { label: "Uploads", value: "upload", searchText: "upload" },
  { label: "Projects", value: "project", searchText: "project" },
  { label: "Seed", value: "seed", searchText: "seed" },
  { label: "Unknown", value: "unknown", searchText: "unknown" },
];

const finderBranches: FinderBranch[] = [
  {
    id: "genre",
    label: "Genre",
    detail: "Start broad, then fine tune the music style.",
    children: [
      {
        label: "Rock",
        detail: "Guitar-heavy, band-forward, and rock-family searches.",
        children: [
          {
            label: "Classic / Roots Rock",
            detail: "Older rock, roots rock, and traditional band energy.",
            leaves: [
              { label: "Classic Rock", searchText: "classic rock" },
              { label: "Southern Rock", searchText: "southern rock" },
              { label: "Roots Rock", searchText: "roots rock" },
              { label: "Blues Rock", searchText: "blues rock" },
            ],
          },
          {
            label: "Heavy Rock",
            detail: "Harder guitars, stronger drums, and bigger energy.",
            leaves: [
              { label: "Hard Rock", searchText: "hard rock" },
              { label: "Arena Rock", searchText: "arena rock" },
              { label: "Garage Rock", searchText: "garage rock" },
              { label: "Distorted Guitar", searchText: "distorted guitar" },
            ],
          },
          {
            label: "Progressive / Soft Rock",
            detail: "Longer forms, softer tones, and more arranged songs.",
            leaves: [
              { label: "Progressive Rock", searchText: "progressive rock" },
              { label: "Soft Rock", searchText: "soft rock" },
              { label: "Art Rock", searchText: "art rock" },
              { label: "Melodic Rock", searchText: "melodic rock" },
            ],
          },
        ],
      },
      {
        label: "Funk",
        detail: "Groove-first bass, drums, and dance-pocket searches.",
        children: [
          {
            label: "Classic Funk",
            detail: "Pocket, bass, rhythm guitar, and old-school groove.",
            leaves: [
              { label: "Funk", searchText: "funk" },
              { label: "P-Funk", searchText: "p-funk" },
              { label: "Slap Bass", searchText: "slap bass" },
              { label: "Groove", searchText: "groove" },
            ],
          },
          {
            label: "Fusion Funk",
            detail: "Funk blended with rock, jazz, or dance styles.",
            leaves: [
              { label: "Funk Rock", searchText: "funk rock" },
              { label: "Jazz Funk", searchText: "jazz funk" },
              { label: "Disco Funk", searchText: "disco funk" },
              { label: "Dance Funk", searchText: "dance funk" },
            ],
          },
        ],
      },
      {
        label: "Metal",
        detail: "Heavy, aggressive, darker, and distorted searches.",
        children: [
          {
            label: "Heavy Metal",
            detail: "Big guitars, aggressive drums, and darker energy.",
            leaves: [
              { label: "Metal", searchText: "metal" },
              { label: "Heavy Metal", searchText: "heavy metal" },
              { label: "Hard Metal", searchText: "hard metal" },
              { label: "Doom", searchText: "doom" },
            ],
          },
          {
            label: "Industrial / Dark",
            detail: "Mechanical, dark, distorted, or aggressive textures.",
            leaves: [
              { label: "Industrial", searchText: "industrial" },
              { label: "Dark", searchText: "dark" },
              { label: "Aggressive", searchText: "aggressive" },
              { label: "Distorted", searchText: "distorted" },
            ],
          },
        ],
      },
      {
        label: "Pop / Soul / R&B",
        detail: "Hook, vocal, and melody-forward searches.",
        children: [
          {
            label: "Pop",
            detail: "Accessible hooks and polished song structure.",
            leaves: [
              { label: "Pop", searchText: "pop" },
              { label: "Hook", searchText: "hook" },
              { label: "Chorus", searchText: "chorus" },
              { label: "Polished", searchText: "polished" },
            ],
          },
          {
            label: "Soul / R&B",
            detail: "Vocal, groove, and emotion-forward tracks.",
            leaves: [
              { label: "Soul", searchText: "soul" },
              { label: "R&B", searchText: "r&b" },
              { label: "Vocal", searchText: "vocal" },
              { label: "Smooth", searchText: "smooth" },
            ],
          },
        ],
      },
      {
        label: "Other Genres",
        detail: "Roots, jazz, cinematic, electronic, and atmosphere searches.",
        children: [
          {
            label: "Roots / Jazz",
            detail: "Storytelling, swing, blues, country, and jazz language.",
            leaves: [
              { label: "Blues", searchText: "blues" },
              { label: "Country", searchText: "country" },
              { label: "Jazz", searchText: "jazz" },
              { label: "Swing", searchText: "swing" },
            ],
          },
          {
            label: "Electronic / Cinematic",
            detail: "Synths, atmosphere, textures, and film-like material.",
            leaves: [
              { label: "Electronic", searchText: "electronic" },
              { label: "Ambient", searchText: "ambient" },
              { label: "Cinematic", searchText: "cinematic" },
              { label: "Soundscape", searchText: "soundscape" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "artist",
    label: "Artist",
    detail: "Find tracks by artist-style words or artist metadata.",
    children: [
      {
        label: "Performer",
        detail: "Search performer roles and player credits.",
        leaves: [
          { label: "Artist", searchText: "artist" },
          { label: "Singer", searchText: "singer" },
          { label: "Vocalist", searchText: "vocalist" },
          { label: "Guitarist", searchText: "guitarist" },
          { label: "Drummer", searchText: "drummer" },
          { label: "Bassist", searchText: "bassist" },
        ],
      },
      {
        label: "Creation / Production",
        detail: "Search writer, composer, producer, and engineer language.",
        leaves: [
          { label: "Producer", searchText: "producer" },
          { label: "Writer", searchText: "writer" },
          { label: "Composer", searchText: "composer" },
          { label: "Engineer", searchText: "engineer" },
          { label: "Featured", searchText: "featured" },
        ],
      },
    ],
  },
  {
    id: "title",
    label: "Title",
    detail: "Search title-like words, versions, and song sections.",
    children: [
      {
        label: "Version Words",
        detail: "Find takes, demos, versions, and mixes.",
        leaves: [
          { label: "Mix", searchText: "mix" },
          { label: "Demo", searchText: "demo" },
          { label: "Take", searchText: "take" },
          { label: "Version", searchText: "version" },
          { label: "Master", searchText: "master" },
          { label: "Rough", searchText: "rough" },
        ],
      },
      {
        label: "Section Words",
        detail: "Find title-like song section words.",
        leaves: [
          { label: "Idea", searchText: "idea" },
          { label: "Hook", searchText: "hook" },
          { label: "Chorus", searchText: "chorus" },
          { label: "Verse", searchText: "verse" },
          { label: "Bridge", searchText: "bridge" },
        ],
      },
    ],
  },
  {
    id: "band",
    label: "Band",
    detail: "Find band-style recordings and group references.",
    children: [
      {
        label: "Band Setup",
        detail: "Search by group arrangement.",
        leaves: [
          { label: "Band", searchText: "band" },
          { label: "Live Band", searchText: "live band" },
          { label: "Power Trio", searchText: "power trio" },
          { label: "Duo", searchText: "duo" },
          { label: "Full Band", searchText: "full band" },
          { label: "Ensemble", searchText: "ensemble" },
        ],
      },
      {
        label: "Band Feel",
        detail: "Search by performance energy and room feel.",
        leaves: [
          { label: "Live", searchText: "live" },
          { label: "Jam", searchText: "jam" },
          { label: "Rehearsal", searchText: "rehearsal" },
          { label: "Garage", searchText: "garage" },
          { label: "Stage", searchText: "stage" },
          { label: "Room", searchText: "room" },
        ],
      },
    ],
  },
  {
    id: "album",
    label: "Album",
    detail: "Future album, EP, session, and project grouping search.",
    children: [
      {
        label: "Project Groups",
        detail: "Search future project and collection labels.",
        leaves: [
          { label: "Album", searchText: "album" },
          { label: "EP", searchText: "ep" },
          { label: "Project", searchText: "project" },
          { label: "Collection", searchText: "collection" },
          { label: "Session", searchText: "session" },
        ],
      },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    detail: "Use metadata tags and Finder keywords.",
    children: [
      {
        label: "Quality",
        detail: "Search keeper, polish, and work-status tags.",
        leaves: [
          { label: "Keeper", searchText: "keeper" },
          { label: "Favorite", searchText: "favorite" },
          { label: "Rough", searchText: "rough" },
          { label: "Polished", searchText: "polished" },
          { label: "Needs Work", searchText: "needs work" },
        ],
      },
      {
        label: "Song Sections",
        detail: "Search by musical sections.",
        leaves: [
          { label: "Hook", searchText: "hook" },
          { label: "Chorus", searchText: "chorus" },
          { label: "Verse", searchText: "verse" },
          { label: "Bridge", searchText: "bridge" },
          { label: "Intro", searchText: "intro" },
          { label: "Outro", searchText: "outro" },
        ],
      },
    ],
  },
  {
    id: "track-type",
    label: "Track Type",
    detail: "Narrow Finder to stems, instrumentals, references, and hybrids.",
    children: [
      {
        label: "Stem",
        detail: "Search stem-style files.",
        leaves: [
          { label: "Stem", searchText: "stem" },
          { label: "Vocal Stem", searchText: "vocal stem" },
          { label: "Drum Stem", searchText: "drum stem" },
          { label: "Bass Stem", searchText: "bass stem" },
          { label: "Guitar Stem", searchText: "guitar stem" },
        ],
      },
      {
        label: "Instrumental",
        detail: "Search instrumental files and non-vocal material.",
        leaves: [
          { label: "Instrumental", searchText: "instrumental" },
          { label: "Guitar", searchText: "guitar" },
          { label: "Piano", searchText: "piano" },
          { label: "Orchestra", searchText: "orchestra" },
          { label: "Backing Track", searchText: "backing track" },
        ],
      },
      {
        label: "Reference",
        detail: "Search reference-song candidates.",
        leaves: [
          { label: "Reference", searchText: "reference" },
          { label: "Reference Song", searchText: "reference song" },
          { label: "Influence", searchText: "influence" },
          { label: "Comparison", searchText: "comparison" },
        ],
      },
      {
        label: "Hybrid / Full Song",
        detail: "Search hybrid candidates and complete songs.",
        leaves: [
          { label: "Hybrid", searchText: "hybrid" },
          { label: "Full Song", searchText: "full song" },
          { label: "Complete", searchText: "complete" },
          { label: "Song", searchText: "song" },
        ],
      },
    ],
  },
  {
    id: "source",
    label: "Source",
    detail: "Filter by Library, Supabase, uploads, projects, or seed data.",
    children: [],
  },
  {
    id: "routing",
    label: "Routing",
    detail: "Find tracks by Track A/B, analysis, stems, and lane destinations.",
    children: [
      {
        label: "Decks",
        detail: "Load candidates for Track A and Track B.",
        leaves: [
          { label: "Track A", searchText: "track a" },
          { label: "Track B", searchText: "track b" },
        ],
      },
      {
        label: "Song Roles",
        detail: "Route by musical role.",
        leaves: [
          { label: "Reference", searchText: "reference" },
          { label: "Melody", searchText: "melody" },
          { label: "Harmony", searchText: "harmony" },
          { label: "Vocal", searchText: "vocal" },
          { label: "Instrument", searchText: "instrument" },
        ],
      },
      {
        label: "Rhythm",
        detail: "Route rhythm and groove material.",
        leaves: [
          { label: "Drums", searchText: "drums" },
          { label: "Bass", searchText: "bass" },
          { label: "Groove", searchText: "groove" },
          { label: "Rhythm", searchText: "rhythm" },
        ],
      },
      {
        label: "Analysis",
        detail: "Find tracks meant for inspection or comparison.",
        leaves: [
          { label: "Analysis", searchText: "analysis" },
          { label: "Stem", searchText: "stem" },
          { label: "Hybrid", searchText: "hybrid" },
        ],
      },
    ],
  },
  {
    id: "metadata",
    label: "Metadata",
    detail: "Search descriptions, tags, source hints, and analysis words.",
    children: [
      {
        label: "Description",
        detail: "Search text descriptions and notes.",
        leaves: [
          { label: "Description", searchText: "description" },
          { label: "Notes", searchText: "notes" },
          { label: "Comment", searchText: "comment" },
          { label: "Summary", searchText: "summary" },
        ],
      },
      {
        label: "Status",
        detail: "Search playback and readiness status.",
        leaves: [
          { label: "Score", searchText: "score" },
          { label: "Playable", searchText: "playable" },
          { label: "Audio", searchText: "audio" },
          { label: "Ready", searchText: "ready" },
        ],
      },
      {
        label: "Metadata Terms",
        detail: "Search general metadata fields.",
        leaves: [
          { label: "Metadata", searchText: "metadata" },
          { label: "Search", searchText: "search" },
          { label: "Tags", searchText: "tags" },
          { label: "Source", searchText: "source" },
        ],
      },
    ],
  },
];

function formatBranchLabel(category: TrackMatcherFinderCategory) {
  return finderBranches.find((branch) => branch.id === category)?.label ?? "All";
}

function FinderBranchArrow() {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-xs font-black text-white/60 transition group-open:rotate-90">
      ▶
    </span>
  );
}

function SearchLeafButton({
  leaf,
  onClick,
}: {
  leaf: FinderLeaf;
  onClick: (leaf: FinderLeaf) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(leaf)}
      className={finderSmallButtonClass}
    >
      {leaf.label}
    </button>
  );
}

function FinderTreeNodeView({
  node,
  onSelectLeaf,
}: {
  node: FinderTreeNode;
  onSelectLeaf: (leaf: FinderLeaf) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const hasLeaves = Boolean(node.leaves?.length);

  return (
    <details className={hasChildren ? finderSubBranchClass : finderDeepBranchClass}>
      <summary className={finderBranchSummaryClass}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">
            {node.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/45">{node.detail}</p>
        </div>

        <FinderBranchArrow />
      </summary>

      <div className="mt-3 grid gap-2">
        {hasChildren
          ? node.children?.map((child) => (
              <FinderTreeNodeView
                key={`${node.label}-${child.label}`}
                node={child}
                onSelectLeaf={onSelectLeaf}
              />
            ))
          : null}

        {hasLeaves ? (
          <div className="flex flex-wrap gap-2">
            {node.leaves?.map((leaf) => (
              <SearchLeafButton
                key={`${node.label}-${leaf.searchText}`}
                leaf={leaf}
                onClick={onSelectLeaf}
              />
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default function TrackMatcherFinderSearchControls({
  query,
  resultCount,
  onQueryChange,
}: TrackMatcherFinderSearchControlsProps) {
  function setSearchText(searchText: string) {
    onQueryChange({
      ...query,
      searchText,
    });
  }

  function applyBranch(
    searchCategory: TrackMatcherFinderCategory,
    searchText: string,
    searchBranchLabel?: string,
  ) {
    onQueryChange({
      ...query,
      searchText,
      searchCategory,
      searchBranchLabel: searchBranchLabel ?? formatBranchLabel(searchCategory),
      selectedSources: [],
    });
  }

  function applySourceFilter(source: TrackMatcherFinderSource, searchText: string) {
    onQueryChange({
      ...query,
      searchText,
      searchCategory: "source",
      searchBranchLabel: `Source: ${searchText}`,
      selectedSources: [source],
    });
  }

  function applyTrackTypeFilter(searchText: string) {
    const lower = searchText.toLowerCase();

    onQueryChange({
      ...query,
      searchText,
      searchCategory: "track-type",
      searchBranchLabel: `Track Type: ${searchText}`,
      selectedSources: [],
      includeStemTracks: lower.includes("stem") || lower === "full song",
      includeInstrumentals:
        lower.includes("instrumental") ||
        lower.includes("guitar") ||
        lower.includes("piano") ||
        lower.includes("orchestra") ||
        lower.includes("backing") ||
        lower === "full song",
      includeReferenceSongs: lower.includes("reference") || lower === "full song",
      includeHybridCandidates:
        lower.includes("hybrid") ||
        lower.includes("complete") ||
        lower === "full song",
    });
  }

  function resetAllSearch() {
    onQueryChange({
      ...query,
      searchText: "",
      searchCategory: "all",
      searchBranchLabel: "All",
      selectedTags: [],
      selectedSources: [],
      includeStemTracks: true,
      includeInstrumentals: true,
      includeReferenceSongs: true,
      includeHybridCandidates: true,
    });
  }

  function selectLeaf(branch: FinderBranch, leaf: FinderLeaf) {
    if (branch.id === "track-type") {
      applyTrackTypeFilter(leaf.searchText);
      return;
    }

    applyBranch(branch.id, leaf.searchText, `${branch.label}: ${leaf.label}`);
  }

  const activeBranchLabel =
    query.searchBranchLabel || formatBranchLabel(query.searchCategory);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-white/50">
          Finder Search
        </p>
        <p className="text-xs text-white/50">{resultCount} results</p>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_15rem]">
        <input
          value={query.searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search rock, funk, keeper, stem, bass, drums, vocal..."
          className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
        />

        <details className="group relative rounded-2xl border border-white/10 bg-white/[0.07]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
                Deep Search
              </p>
              <p className="truncate text-sm font-black text-white/80">
                {activeBranchLabel}
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-xs font-black text-white/70 transition group-open:rotate-90">
              ▶
            </span>
          </summary>

          <div className="z-20 mt-2 grid gap-2 rounded-2xl border border-white/10 bg-black p-3 shadow-2xl md:absolute md:right-0 md:top-full md:max-h-[70vh] md:w-[38rem] md:overflow-y-auto">
            <button
              type="button"
              onClick={resetAllSearch}
              className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3 text-left transition-transform duration-150 hover:-translate-y-0.5 hover:bg-white/[0.10]"
            >
              <p className="text-sm font-black text-white">All</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Reset Finder to the broad all-tracks search.
              </p>
            </button>

            {finderBranches.map((branch) => (
              <details key={branch.id} className={finderBranchClass}>
                <summary className={finderBranchSummaryClass}>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
                      {branch.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      {branch.detail}
                    </p>
                  </div>

                  <FinderBranchArrow />
                </summary>

                <div className="mt-3 grid gap-2">
                  {branch.id === "source" ? (
                    <div className="flex flex-wrap gap-2">
                      {sourceTerms.map((source) => (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() =>
                            applySourceFilter(source.value, source.searchText)
                          }
                          className={finderSmallButtonClass}
                        >
                          {source.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {branch.children.map((node) => (
                    <FinderTreeNodeView
                      key={`${branch.id}-${node.label}`}
                      node={node}
                      onSelectLeaf={(leaf) => selectLeaf(branch, leaf)}
                    />
                  ))}
                </div>
              </details>
            ))}

            <details className={finderBranchClass}>
              <summary className={finderBranchSummaryClass}>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
                    Quick Searches
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    The old quick-search buttons are preserved here instead of
                    filling the main page.
                  </p>
                </div>

                <FinderBranchArrow />
              </summary>

              <div className="mt-3 flex flex-wrap gap-2">
                {TRACK_MATCHER_FINDER_QUICK_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => applyBranch("all", term, "Quick Search")}
                    className={finderSmallButtonClass}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </details>
      </div>
    </div>
  );
}