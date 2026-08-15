"use client";

import {
  timelineDawOpenSessionResultSummary,
  timelineDawOpenSessionViewIsDefault,
  type TimelineDawOpenSessionFilter,
  type TimelineDawOpenSessionSort,
  type TimelineDawResumeSession,
} from "../../../lib/timeline/TimelineDawSongStartPolicy";

type RecentResult = {
  sessions: TimelineDawResumeSession[];
  matchingCount: number;
  totalOpenCount: number;
};

type Props = {
  loaded: boolean;
  query: string;
  stateFilter: TimelineDawOpenSessionFilter;
  sort: TimelineDawOpenSessionSort;
  result: RecentResult;
  searchLabel?: string;
  searchId?: string;
  searchPlaceholder: string;
  buttonClassName: string;
  inputClassName: string;
  selectClassName: string;
  statusClassName: string;
  loadingClassName: string;
  statusFirst?: boolean;
  onQueryChange: (value: string) => void;
  onStateFilterChange: (value: TimelineDawOpenSessionFilter) => void;
  onSortChange: (value: TimelineDawOpenSessionSort) => void;
};

export default function RecentSessionViewControls({
  loaded,
  query,
  stateFilter,
  sort,
  result,
  searchLabel,
  searchId,
  searchPlaceholder,
  buttonClassName,
  inputClassName,
  selectClassName,
  statusClassName,
  loadingClassName,
  statusFirst = false,
  onQueryChange,
  onStateFilterChange,
  onSortChange,
}: Props) {
  if (!loaded) {
    return (
      <p aria-busy="true" className={loadingClassName}>
        Restoring recent session view…
      </p>
    );
  }

  const status = (
    <p
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={statusClassName}
    >
      {timelineDawOpenSessionResultSummary(result, stateFilter, sort)}
    </p>
  );
  const isDefault = timelineDawOpenSessionViewIsDefault(
    query,
    stateFilter,
    sort,
  );

  return (
    <>
      {searchLabel ? (
        <label className="text-sm font-black" htmlFor={searchId}>
          {searchLabel}
        </label>
      ) : null}
      {statusFirst ? status : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          id={searchId}
          type="search"
          maxLength={100}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel ? undefined : searchPlaceholder}
          className={inputClassName}
        />
        <select
          aria-label="Filter open sessions by state"
          value={stateFilter}
          onChange={(event) =>
            onStateFilterChange(event.target.value as TimelineDawOpenSessionFilter)
          }
          className={selectClassName}
        >
          <option value="all">All</option>
          <option value="needs-setup">Needs Setup</option>
          <option value="ready">Ready</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          aria-label="Sort open sessions"
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as TimelineDawOpenSessionSort)
          }
          className={selectClassName}
        >
          <option value="newest">Newest</option>
          <option value="session-name">Session Name</option>
          <option value="project-name">Project Name</option>
        </select>
        {!isDefault ? (
          <button
            type="button"
            className={buttonClassName}
            onClick={() => {
              onQueryChange("");
              onStateFilterChange("all");
              onSortChange("newest");
            }}
          >
            Reset view
          </button>
        ) : null}
      </div>
      {!statusFirst ? status : null}
    </>
  );
}
