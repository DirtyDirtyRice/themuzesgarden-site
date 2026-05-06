"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { MetadataEntry, MetadataLink } from "./metadataTypes";
import type { MetadataQueryInput } from "./metadataQueryTypes";
import {
  buildFilterSummary,
  controlButtonClassName,
  fieldClassName,
} from "./metadataQueryPanelHelpers";
import {
  KIND_OPTIONS,
  MODE_OPTIONS,
  TARGET_TYPE_OPTIONS,
} from "./metadataQueryPanelOptions";
import { buildResultsUrl } from "./metadataQueryPanelUrl";
import { useMetadataQueryPanelState } from "./useMetadataQueryPanelState";

type MetadataQueryPanelProps = {
  entries: MetadataEntry[];
  links: MetadataLink[];
  initialQuery?: Partial<MetadataQueryInput>;
};

export default function MetadataQueryPanel({
  entries,
  links,
  initialQuery,
}: MetadataQueryPanelProps) {
  const router = useRouter();

  const {
    query,
    setQuery,
    mode,
    setMode,
    targetType,
    setTargetType,
    kind,
    setKind,
    targetId,
    setTargetId,
    tagsInput,
    setTagsInput,
    limit,
    setLimit,
    includeDirect,
    setIncludeDirect,
    includeInherited,
    setIncludeInherited,
    includeRelated,
    setIncludeRelated,
    includeExpanded,
    setIncludeExpanded,
    includeFallback,
    setIncludeFallback,
    runCount,
    setRunCount,
    statusText,
    setStatusText,
    isPinned,
    setIsPinned,
    isDockCollapsed,
    setIsDockCollapsed,
    isRunningQuery,
    setIsRunningQuery,
    tags,
    nextInput,
  } = useMetadataQueryPanelState({
    initialQuery,
  });

  const handleRunQuery = async () => {
    if (isPinned) {
      setStatusText("Results are pinned. Unpin them to run a new query.");
      return;
    }

    if (isRunningQuery) {
      return;
    }

    const trimmedQuery = query.trim();

    setIsRunningQuery(true);
    setStatusText(
      trimmedQuery
        ? `Opening results page for "${trimmedQuery}"...`
        : "Opening results page with current filters..."
    );

    if (isDockCollapsed) {
      setIsDockCollapsed(false);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 250));

    setRunCount((current) => current + 1);

    router.push(buildResultsUrl(nextInput));
  };

  const handleClearResults = () => {
    setIsPinned(false);
    setStatusText("Results page state cleared from this panel.");
  };

  const handleTogglePinned = () => {
    setIsPinned((current) => {
      const next = !current;
      setStatusText(next ? "Results pinned." : "Results unpinned.");
      return next;
    });
  };

  const handleToggleDockCollapsed = () => {
    setIsDockCollapsed((current) => {
      const next = !current;
      setStatusText(next ? "Results panel collapsed." : "Results panel expanded.");
      return next;
    });
  };

  const filterSummary = useMemo(() => {
    return buildFilterSummary({
      query,
      mode,
      targetType,
      kind,
      targetId,
      tags,
      limit,
    });
  }, [query, mode, targetType, kind, targetId, tags, limit]);

  return (
    <section className="relative z-20 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-[color:var(--text-normal)]">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-strong)]">
          Metadata Query Engine
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[color:var(--text-strong)]">
          Search the Metadata Brain
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--text-normal)]">
          Query across direct, inherited, related, expanded, and fallback
          metadata layers.
        </p>
      </div>

      <div className="grid gap-4 text-[color:var(--text-normal)] md:grid-cols-2">
        <div className="relative z-40 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)] md:col-span-2">
          <label
            htmlFor="metadata-query-input"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]"
          >
            Search Query
          </label>

          <div className="relative z-40 pointer-events-auto text-[color:var(--text-normal)]">
            <input
              id="metadata-query-input"
              name="metadata-query-input"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleRunQuery();
                }
              }}
              placeholder='Try: groove, energy, rock, funk, or supabase'
              className={fieldClassName}
            />
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between gap-4 text-[color:var(--text-normal)] md:col-span-2">
          <div className="min-h-[20px] text-xs text-[color:var(--text-normal)]">
            {statusText}{" "}
            {runCount > 0 ? (
              <span className="text-[color:var(--text-normal)]">
                Run count: {runCount}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              void handleRunQuery();
            }}
            disabled={isRunningQuery}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isRunningQuery
                ? "scale-[0.98] border-white/40 bg-white/25 text-[color:var(--text-normal)] shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                : "border-white/20 bg-white/10 text-[color:var(--text-normal)] hover:bg-white/20 active:scale-[0.99]"
            }`}
          >
            {isRunningQuery ? "Opening..." : "Run Query"}
          </button>
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as MetadataQueryInput["mode"])
            }
            className={fieldClassName}
          >
            {MODE_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-black text-[color:var(--text-normal)]"
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Target Type
          </label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as typeof targetType)}
            className={fieldClassName}
          >
            {TARGET_TYPE_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-black text-[color:var(--text-normal)]"
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Kind
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className={fieldClassName}
          >
            {KIND_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-black text-[color:var(--text-normal)]"
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Target Id
          </label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Optional exact target id"
            className={fieldClassName}
          />
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Tags
          </label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Comma-separated tags"
            className={fieldClassName}
          />
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Limit
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 50)}
            className={fieldClassName}
          />
        </div>

        <div className="relative z-20 rounded-2xl border border-white/10 bg-black/30 p-4 text-[color:var(--text-normal)] md:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
            Layers
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--text-normal)]">
              <input
                type="checkbox"
                checked={includeDirect}
                onChange={(e) => setIncludeDirect(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <span className="text-[color:var(--text-normal)]">Direct</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--text-normal)]">
              <input
                type="checkbox"
                checked={includeInherited}
                onChange={(e) => setIncludeInherited(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <span className="text-[color:var(--text-normal)]">Inherited</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--text-normal)]">
              <input
                type="checkbox"
                checked={includeRelated}
                onChange={(e) => setIncludeRelated(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <span className="text-[color:var(--text-normal)]">Related</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--text-normal)]">
              <input
                type="checkbox"
                checked={includeExpanded}
                onChange={(e) => setIncludeExpanded(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <span className="text-[color:var(--text-normal)]">Expanded</span>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--text-normal)]">
              <input
                type="checkbox"
                checked={includeFallback}
                onChange={(e) => setIncludeFallback(e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              <span className="text-[color:var(--text-normal)]">Fallback</span>
            </label>
          </div>
        </div>

        <div className="relative z-20 text-[color:var(--text-normal)] md:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-black/40 text-[color:var(--text-normal)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-[color:var(--text-normal)]">
              <div className="text-[color:var(--text-normal)]">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
                  Results Flow
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[color:var(--text-strong)]">
                  Dedicated Results Page
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[color:var(--text-normal)]">
                <div className="text-xs text-[color:var(--text-normal)]">
                  {entries.length} entries • {links.length} links available
                </div>

                <button
                  type="button"
                  onClick={handleToggleDockCollapsed}
                  className={controlButtonClassName}
                >
                  {isDockCollapsed ? "Expand" : "Collapse"}
                </button>

                <button
                  type="button"
                  onClick={handleTogglePinned}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isPinned
                      ? "border-white/30 bg-white/15 text-[color:var(--text-normal)]"
                      : "border-white/20 bg-white/5 text-[color:var(--text-normal)] hover:bg-white/10"
                  }`}
                >
                  {isPinned ? "Unpin" : "Pin"}
                </button>

                <button
                  type="button"
                  onClick={handleClearResults}
                  className={controlButtonClassName}
                >
                  Clear
                </button>
              </div>
            </div>

            {!isDockCollapsed ? (
              <div className="px-4 py-4 text-[color:var(--text-normal)]">
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-[color:var(--text-normal)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-strong)]">
                    Next Page Flow Enabled
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[color:var(--text-normal)]">
                    This panel now sends your query and filter state to the
                    dedicated metadata results page instead of rendering results
                    inline here.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {filterSummary.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-[color:var(--text-normal)]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-[color:var(--text-normal)]">
                    Destination:{" "}
                    <span className="font-semibold text-[color:var(--text-strong)]">
                      {buildResultsUrl(nextInput)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-[color:var(--text-normal)]">
                Results flow panel is collapsed.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}