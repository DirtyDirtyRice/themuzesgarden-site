"use client";

import { useMemo, useState } from "react";

import {
  FIND_IT_CATEGORIES,
  FIND_IT_ENTRIES,
  type FindItEntry,
} from "./helpFoundationFindItData";

type HelpFoundationFindItPanelProps = {
  title?: string;
};

type FindItCategoryFilter = "all" | FindItEntry["category"];

type FindItCategorySummary = {
  id: FindItCategoryFilter;
  title: string;
  description: string;
  count: number;
};

type FindItPreset = {
  label: string;
  query: string;
  helper: string;
};

const lostPresets: FindItPreset[] = [
  {
    label: "I need a track",
    query: "track",
    helper: "Find uploaded tracks, Library routes, player routes, and track details.",
  },
  {
    label: "I need a project",
    query: "project",
    helper: "Find project overview, project tracks, project playback, and send-to-project paths.",
  },
  {
    label: "I need metadata",
    query: "metadata",
    helper: "Find metadata library, shelves, records, explanations, and relationships.",
  },
  {
    label: "I need upload",
    query: "upload",
    helper: "Find where uploads start and how uploaded music reaches Library.",
  },
  {
    label: "I need player",
    query: "player",
    helper: "Find now playing, playback controls, and track switching routes.",
  },
  {
    label: "I need Track Matcher",
    query: "track matcher",
    helper: "Find comparing, matching, lanes, BPM, key, and future analysis routes.",
  },
];

const popularRoutePresets: FindItPreset[] = [
  {
    label: "Upload Music",
    query: "upload",
    helper: "Start here when the goal is adding music to The Muzes Garden.",
  },
  {
    label: "Search Library",
    query: "library search",
    helper: "Start here when the goal is narrowing tracks by title, tag, source, or mood.",
  },
  {
    label: "Send Track To Project",
    query: "send project",
    helper: "Start here when the goal is moving a Library track into a project.",
  },
  {
    label: "Open Metadata",
    query: "metadata library",
    helper: "Start here when the goal is understanding the knowledge system.",
  },
  {
    label: "Compare Tracks",
    query: "track matcher compare",
    helper: "Start here when the goal is matching or comparing audio.",
  },
  {
    label: "Fix Confusion",
    query: "help",
    helper: "Start here when the member knows something is confusing but not where to look.",
  },
];

const startHereSteps = [
  "Upload music",
  "Open Library",
  "Search or choose a track",
  "Send the track to a project",
  "Open the project",
  "Play the track",
  "Use Find It again if you get lost",
];

function normalizeFindItText(value: string) {
  return value.trim().toLowerCase();
}

function entryMatchesSearch(entry: FindItEntry, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  const searchableText = [
    entry.title,
    entry.problem,
    entry.answer,
    entry.category,
    entry.route.join(" "),
    entry.keywords.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function getCategoryCount(categoryId: FindItCategoryFilter) {
  if (categoryId === "all") {
    return FIND_IT_ENTRIES.length;
  }

  return FIND_IT_ENTRIES.filter((entry) => entry.category === categoryId).length;
}

function getCategorySummaries(): FindItCategorySummary[] {
  return [
    {
      id: "all",
      title: "All",
      description: "Every Find It route card.",
      count: FIND_IT_ENTRIES.length,
    },
    ...FIND_IT_CATEGORIES.map((category) => ({
      id: category.id as FindItCategoryFilter,
      title: category.title,
      description: category.description,
      count: getCategoryCount(category.id as FindItCategoryFilter),
    })),
  ];
}

function getRoutePreview(entry: FindItEntry) {
  return entry.route.join(" → ");
}

function sortEntriesByTitle(entries: FindItEntry[]) {
  return [...entries].sort((a, b) => a.title.localeCompare(b.title));
}

function getFeaturedEntries(entries: FindItEntry[]) {
  const priorityIds = new Set([
    "help-find-it",
    "library-search",
    "uploaded-tracks",
    "project-open",
    "track-matcher-compare",
    "metadata-library",
    "player-now-playing",
    "general-lost",
  ]);

  return entries.filter((entry) => priorityIds.has(entry.id)).slice(0, 8);
}

function FindItStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-white/70">
        {label}
      </div>

      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>

      <div className="mt-2 text-sm text-white/70">{detail}</div>
    </div>
  );
}

function FindItRouteSteps({ entry }: { entry: FindItEntry }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {entry.route.map((step, index) => (
        <div
          key={`${entry.id}-${step}-${index}`}
          className="flex items-center gap-2"
        >
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/80">
            {step}
          </span>

          {index < entry.route.length - 1 ? (
            <span className="text-xs text-white/70">→</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FindItPresetButton({
  preset,
  onSelect,
}: {
  preset: FindItPreset;
  onSelect: (preset: FindItPreset) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      className="rounded-xl border border-white/10 bg-black/60 p-4 text-left transition-transform hover:-translate-y-0.5"
    >
      <div className="text-sm font-semibold text-white">{preset.label}</div>
      <div className="mt-2 text-xs leading-5 text-white/70">
        {preset.helper}
      </div>
    </button>
  );
}

function FindItLostPanel({
  onSelectPreset,
}: {
  onSelectPreset: (preset: FindItPreset) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-white/70">
            I Am Lost
          </div>

          <h3 className="mt-2 text-xl font-semibold text-white">
            Tell Find It what kind of thing you need
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            These buttons fill the search so matching Help routes appear below.
          </p>
        </div>

        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
          Start Here
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lostPresets.map((preset) => (
          <FindItPresetButton
            key={preset.label}
            preset={preset}
            onSelect={onSelectPreset}
          />
        ))}
      </div>
    </div>
  );
}

function FindItPopularRoutesPanel({
  onSelectPreset,
}: {
  onSelectPreset: (preset: FindItPreset) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-5">
      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-white/70">
          Popular Routes
        </div>

        <h3 className="mt-2 text-xl font-semibold text-white">
          One-click routes people usually need first
        </h3>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {popularRoutePresets.map((preset) => (
          <FindItPresetButton
            key={preset.label}
            preset={preset}
            onSelect={onSelectPreset}
          />
        ))}
      </div>
    </div>
  );
}

function FindItStartHerePanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-5">
      <div className="text-xs uppercase tracking-[0.22em] text-white/70">
        Where Should I Start?
      </div>

      <h3 className="mt-2 text-xl font-semibold text-white">
        Basic first route through the app
      </h3>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {startHereSteps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/80">
              {index + 1}. {step}
            </span>

            {index < startHereSteps.length - 1 ? (
              <span className="text-xs text-white/70">→</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function FindItBestMatchPanel({ entry }: { entry: FindItEntry | null }) {
  if (!entry) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 p-5">
      <div className="text-xs uppercase tracking-[0.22em] text-white/70">
        Best First Match
      </div>

      <div className="mt-2 text-xl font-semibold text-white">{entry.title}</div>

      <p className="mt-2 text-sm leading-6 text-white/70">{entry.answer}</p>

      <div className="mt-3">
        <FindItRouteSteps entry={entry} />
      </div>
    </div>
  );
}

function FindItEntryCard({ entry }: { entry: FindItEntry }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/60 p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-medium text-white">{entry.title}</div>

          <div className="mt-2 text-xs text-white/70">
            {getRoutePreview(entry)}
          </div>
        </div>

        <span className="rounded-full border border-white/10 px-2 py-1 text-xs capitalize text-white/70">
          {entry.category.replace("-", " ")}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/70">
            Problem
          </div>

          <div className="mt-1 text-sm text-white/80">{entry.problem}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-white/70">
            Answer
          </div>

          <div className="mt-1 text-sm text-white">{entry.answer}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-white/70">
          Route
        </div>

        <FindItRouteSteps entry={entry} />
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-white/70">
          Keywords
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {entry.keywords.map((keyword) => (
            <span
              key={`${entry.id}-${keyword}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/70"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function HelpFoundationFindItPanel({
  title = "Find It",
}: HelpFoundationFindItPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<FindItCategoryFilter>("all");

  const categorySummaries = useMemo(() => getCategorySummaries(), []);

  const normalizedSearch = normalizeFindItText(searchQuery);

  const filteredEntries = useMemo(() => {
    const categoryFilteredEntries =
      activeCategory === "all"
        ? FIND_IT_ENTRIES
        : FIND_IT_ENTRIES.filter((entry) => entry.category === activeCategory);

    return sortEntriesByTitle(
      categoryFilteredEntries.filter((entry) =>
        entryMatchesSearch(entry, normalizedSearch),
      ),
    );
  }, [activeCategory, normalizedSearch]);

  const featuredEntries = useMemo(() => getFeaturedEntries(FIND_IT_ENTRIES), []);

  const bestMatch = normalizedSearch ? filteredEntries[0] ?? null : null;
  const hasSearch = normalizedSearch.length > 0;
  const hasFilteredEntries = filteredEntries.length > 0;

  function applyPreset(preset: FindItPreset) {
    setActiveCategory("all");
    setSearchQuery(preset.query);
  }

  function resetFindIt() {
    setSearchQuery("");
    setActiveCategory("all");
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black p-6">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.25em] text-white/70">
          Help Search Engine
        </div>

        <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>

        <p className="mt-3 max-w-4xl text-white/70">
          Find where things live inside The Muzes Garden using route cards,
          category filters, search keywords, presets, and step-by-step
          navigation paths.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FindItStatCard
          label="Entries"
          value={FIND_IT_ENTRIES.length}
          detail="Navigation answers currently indexed."
        />

        <FindItStatCard
          label="Categories"
          value={FIND_IT_CATEGORIES.length}
          detail="Major areas covered by Find It."
        />

        <FindItStatCard
          label="Visible"
          value={filteredEntries.length}
          detail="Cards matching the current search/filter."
        />
      </div>

      <div className="mt-6 grid gap-4">
        <FindItLostPanel onSelectPreset={applyPreset} />
        <FindItStartHerePanel />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/50 p-4">
        <label
          htmlFor="find-it-search"
          className="text-xs uppercase tracking-[0.22em] text-white/70"
        >
          Search Find It
        </label>

        <input
          id="find-it-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Try upload, setlist, metadata, BPM, route map, player..."
          className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition-transform placeholder:text-white/50 focus:-translate-y-0.5 focus:border-white/30"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {["upload", "setlist", "metadata", "BPM", "route map", "player"].map(
            (suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setSearchQuery(suggestion)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 transition-transform hover:-translate-y-0.5"
              >
                {suggestion}
              </button>
            ),
          )}

          {hasSearch ? (
            <button
              type="button"
              onClick={resetFindIt}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition-transform hover:-translate-y-0.5"
            >
              Clear search
            </button>
          ) : null}
        </div>
      </div>

      {hasSearch ? (
        <div className="mt-6">
          <FindItBestMatchPanel entry={bestMatch} />
        </div>
      ) : null}

      <div className="mt-6">
        <FindItPopularRoutesPanel onSelectPreset={applyPreset} />
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.22em] text-white/70">
          Categories
        </div>

        <div className="flex flex-wrap gap-2">
          {categorySummaries.map((category) => {
            const isActive = category.id === activeCategory;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                title={category.description}
                className={[
                  "rounded-full border px-3 py-2 text-xs transition-transform hover:-translate-y-0.5",
                  isActive
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 bg-black text-white/70",
                ].join(" ")}
              >
                {category.title}
                <span className="ml-2 text-white/70">{category.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/70">
              Fast Start
            </div>

            <h3 className="mt-2 text-xl font-semibold text-white">
              Common places people look first
            </h3>
          </div>

          <button
            type="button"
            onClick={resetFindIt}
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-white transition-transform hover:-translate-y-0.5"
          >
            Show everything
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {featuredEntries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                setActiveCategory(entry.category);
                setSearchQuery(entry.title);
              }}
              className="rounded-xl border border-white/10 bg-black/60 p-3 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="text-sm font-medium text-white">
                {entry.title}
              </div>

              <div className="mt-2 text-xs text-white/70">
                {getRoutePreview(entry)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {hasFilteredEntries ? (
          FIND_IT_CATEGORIES.map((category) => {
            const entries = filteredEntries.filter(
              (entry) => entry.category === category.id,
            );

            if (entries.length === 0) {
              return null;
            }

            return (
              <section
                key={category.id}
                className="rounded-xl border border-white/10 bg-black/40 p-5"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {category.title}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm text-white/70">
                      {category.description}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    {entries.length} shown
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {entries.map((entry) => (
                    <FindItEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/50 p-6">
            <div className="text-xl font-semibold text-white">
              No Find It entries matched that search.
            </div>

            <p className="mt-2 text-sm text-white/70">
              Try a shorter word like track, project, metadata, help, upload,
              search, player, route, setlist, BPM, or relationship.
            </p>

            <button
              type="button"
              onClick={resetFindIt}
              className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs text-white transition-transform hover:-translate-y-0.5"
            >
              Reset Find It
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
