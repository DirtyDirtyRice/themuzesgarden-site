"use client";

import type { AnyTrack } from "./playerTypes";
import { getTrackSortLabel, normalizeStart } from "./momentInspectorHelpers";
import { formatMomentTime } from "./playerUtils";

type FocusSection = {
  id?: string | null;
  start?: number | null;
  description?: string | null;
};

type MomentInspectorTrackControlsProps = {
  selectedTrack: AnyTrack | null;
  sortedTracks: AnyTrack[];
  setTrackId: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  trimmedFilter: string;
  filteredSections: Array<unknown>;
  focusSections: FocusSection[];
  similaritySelectedSectionId: string;
  setSelectedSectionId: (value: string) => void;
};

export default function MomentInspectorTrackControls(
  props: MomentInspectorTrackControlsProps
) {
  const {
    selectedTrack,
    sortedTracks,
    setTrackId,
    filter,
    setFilter,
    trimmedFilter,
    filteredSections,
    focusSections,
    similaritySelectedSectionId,
    setSelectedSectionId,
  } = props;

  return (
    <>
      <div className="grid gap-2">
        <label className="text-[10px] font-medium text-zinc-600">Track</label>
        <select
          value={selectedTrack ? String(selectedTrack.id ?? "") : ""}
          onChange={(e) => setTrackId(e.target.value)}
          className="rounded border bg-white px-2 py-2 text-[12px] text-zinc-800"
        >
          {sortedTracks.length === 0 ? (
            <option value="">No tracks loaded</option>
          ) : (
            sortedTracks.map((track) => {
              const id = String(track?.id ?? "");
              return (
                <option key={id} value={id}>
                  {getTrackSortLabel(track)}
                </option>
              );
            })
          )}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-[10px] font-medium text-zinc-600">Section Filter</label>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by section id, description, tag, or time"
          className="rounded border bg-white px-2 py-2 text-[12px] text-zinc-800"
        />
        <div className="text-[10px] text-zinc-500">
          {trimmedFilter
            ? `Filter active • ${filteredSections.length} matching section${
                filteredSections.length === 1 ? "" : "s"
              }`
            : "No filter active • showing all sections"}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[10px] font-medium text-zinc-600">Similarity Focus Section</label>
        <select
          value={similaritySelectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          className="rounded border bg-white px-2 py-2 text-[12px] text-zinc-800"
        >
          {focusSections.length === 0 ? (
            <option value="">No sections available</option>
          ) : (
            focusSections.map((section) => {
              const id = String(section?.id ?? "");
              const start = normalizeStart(section?.start);
              const description = String(section?.description ?? "").trim();
              const label = description ? `${id} — ${description}` : id;

              return (
                <option key={id} value={id}>
                  {label} @ {formatMomentTime(start)}
                </option>
              );
            })
          )}
        </select>
      </div>
    </>
  );
}