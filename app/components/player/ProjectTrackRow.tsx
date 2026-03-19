import type { AnyTrack } from "./playerTypes";
import { formatMomentTime, getDiscoveryTagBreakdown } from "./playerUtils";
import ProjectTrackTags from "./ProjectTrackTags";
import {
  emitProjectMomentPlaybackTarget,
  getMomentDensityChipClass,
  getMomentDensityLabel,
  getMomentLabel,
  getSectionDescriptionSummary,
  getSortedTrackSections,
} from "./projectTabHelpers";

export default function ProjectTrackRow(props: {
  track: AnyTrack;
  realIdx: number;
  nowId: string | null;
  selectedTrackId: string | null;
  flashTrackId: string | null;
  draggingTrackId: string | null;
  dropTargetTrackId: string | null;
  loadingProject: boolean;
  projectTrackCount: number;
  onPlay: (t: AnyTrack) => void;
  onPlayFromHere: (t: AnyTrack) => void;
  onMoveUp: (trackId: string) => void;
  onMoveDown: (trackId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onDragStart: (trackId: string) => void;
  onDragOverTrack: (trackId: string, e: React.DragEvent<HTMLDivElement>) => void;
  onDropOnTrack: (trackId: string, e: React.DragEvent<HTMLDivElement>) => void;
  onClearDragState: () => void;
}) {
  const {
    track,
    realIdx,
    nowId,
    selectedTrackId,
    flashTrackId,
    draggingTrackId,
    dropTargetTrackId,
    loadingProject,
    projectTrackCount,
    onPlay,
    onPlayFromHere,
    onMoveUp,
    onMoveDown,
    onSelectTrack,
    onDragStart,
    onDragOverTrack,
    onDropOnTrack,
    onClearDragState,
  } = props;

  const tid = String(track.id);
  const isNow = tid === String(nowId ?? "");
  const isSelected = tid === String(selectedTrackId ?? "");
  const isFlashing = tid === String(flashTrackId ?? "");
  const isDragging = tid === String(draggingTrackId ?? "");
  const isDropTarget = tid === String(dropTargetTrackId ?? "") && !isDragging;

  const nowIdx = nowId == null ? -1 : Number.NaN;
  void nowIdx;

  const atTop = realIdx === 0;
  const atBottom = realIdx === projectTrackCount - 1;

  const { trackTags, sectionTags, combinedTags } = getDiscoveryTagBreakdown(track);
  const firstSectionDescription = getSectionDescriptionSummary(track);
  const sections = getSortedTrackSections(track);
  const sectionCount = sections.length;
  const previewSections = sections.slice(0, 3);
  const primaryMoment = previewSections[0] ?? null;
  const densityLabel = getMomentDensityLabel(sectionCount);

  return (
    <div
      data-trackid={tid}
      className={[
        "rounded border px-2 py-2 cursor-pointer transition-all duration-300",
        isNow ? "border-black bg-zinc-50 ring-2 ring-black/25" : "",
        isSelected && !isNow ? "ring-2 ring-blue-200 border-blue-300" : "",
        isFlashing ? "ring-2 ring-amber-300 border-amber-400 bg-amber-50" : "",
        isDragging ? "opacity-60 ring-2 ring-dashed ring-black/20" : "",
        isDropTarget ? "ring-2 ring-green-300 border-green-400 bg-green-50" : "",
      ].join(" ")}
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "BUTTON" || target.closest("button"))) {
          return;
        }
        onSelectTrack(tid);
      }}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "BUTTON" || target.closest("button"))) {
          return;
        }
        onSelectTrack(tid);
        onPlayFromHere(track);
      }}
      onMouseEnter={() => onSelectTrack(tid)}
      onDragOver={(e) => onDragOverTrack(tid, e)}
      onDrop={(e) => onDropOnTrack(tid, e)}
      onDragEnd={onClearDragState}
      title="Click to select • Double-click to Play From Here"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(tid);
              }}
              onDragEnd={(e) => {
                e.stopPropagation();
                onClearDragState();
              }}
              onClick={(e) => e.preventDefault()}
              className="shrink-0 rounded border px-2 py-1 text-[11px] cursor-grab active:cursor-grabbing bg-white"
              title="Drag to reorder"
              aria-label={`Drag ${track.title ?? "track"} to reorder`}
            >
              ☰
            </button>

            <div className="text-[11px] text-zinc-500 tabular-nums shrink-0">
              {String(realIdx + 1).padStart(2, "0")}
            </div>

            {isNow ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                NOW
              </span>
            ) : null}

            {isSelected && !isNow ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                SELECTED
              </span>
            ) : null}

            {isFlashing ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-100">
                JUMPED
              </span>
            ) : null}

            {isDragging ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white">
                DRAGGING
              </span>
            ) : null}

            {isDropTarget ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-100">
                DROP
              </span>
            ) : null}

            <div
              className={[
                "text-sm truncate",
                isNow ? "font-semibold" : "font-medium",
              ].join(" ")}
            >
              {track.title ?? "Untitled"}
            </div>
          </div>

          <div className="text-xs text-zinc-500 truncate">
            {track.artist ?? "Supabase"}
          </div>

          {firstSectionDescription ? (
            <div className="mt-1 text-[11px] text-zinc-600 truncate">
              First moment: {firstSectionDescription}
            </div>
          ) : null}

          {sectionCount > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                Indexed moments: {sectionCount}
              </span>
              <span
                className={[
                  "rounded border px-2 py-0.5 text-[10px]",
                  getMomentDensityChipClass(sectionCount),
                ].join(" ")}
              >
                {densityLabel}
              </span>
            </div>
          ) : null}

          {previewSections.length > 0 ? (
            <div className="mt-2">
              <div className="mb-1 text-[11px] font-medium text-yellow-800">
                Project moments
              </div>

              <div className="flex flex-wrap gap-1">
                {previewSections.map((section, momentIdx) => (
                  <button
                    key={`${tid}:moment:${section.id}`}
                    type="button"
                    className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-800 hover:bg-yellow-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      emitProjectMomentPlaybackTarget(track, section);
                    }}
                    title={`Play moment: ${getMomentLabel(section)} @ ${formatMomentTime(
                      Number(section.start ?? 0)
                    )}`}
                  >
                    <span>
                      {getMomentLabel(section)} —{" "}
                      {formatMomentTime(Number(section.start ?? 0))}
                    </span>
                    {momentIdx === 0 ? (
                      <span className="rounded bg-white px-1 text-[10px] text-yellow-700">
                        first
                      </span>
                    ) : null}
                  </button>
                ))}

                {sectionCount > previewSections.length ? (
                  <span className="inline-flex items-center rounded bg-yellow-50 px-2 py-0.5 text-[11px] text-yellow-700">
                    +{sectionCount - previewSections.length} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {combinedTags.length > 0 ? (
            <ProjectTrackTags track={track} tags={combinedTags.slice(0, 6)} />
          ) : null}

          {trackTags.length > 0 || sectionTags.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {trackTags.length > 0 ? (
                <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                  Track tags: {trackTags.length}
                </span>
              ) : null}

              {sectionTags.length > 0 ? (
                <span className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                  Moment tags: {sectionTags.length}
                </span>
              ) : null}
            </div>
          ) : null}

          {isSelected ? (
            <div className="mt-2 text-[11px] text-zinc-600">
              Space = play track • Enter = play from here
              {primaryMoment ? " • M = play first moment" : ""}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col gap-1">
            <button
              className="rounded border px-2 py-1 text-[11px] disabled:opacity-50"
              onClick={() => onMoveUp(tid)}
              disabled={loadingProject || atTop}
              title={atTop ? "Already at top of setlist" : "Move up"}
            >
              ↑
            </button>

            <button
              className="rounded border px-2 py-1 text-[11px] disabled:opacity-50"
              onClick={() => onMoveDown(tid)}
              disabled={loadingProject || atBottom}
              title={atBottom ? "Already at bottom of setlist" : "Move down"}
            >
              ↓
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {primaryMoment ? (
              <button
                className={[
                  "rounded border px-3 py-1 text-[11px]",
                  isSelected
                    ? "border-yellow-300 bg-yellow-100 text-yellow-900"
                    : "",
                ].join(" ")}
                onClick={() => emitProjectMomentPlaybackTarget(track, primaryMoment)}
                title={`Play first indexed moment: ${getMomentLabel(primaryMoment)} @ ${formatMomentTime(
                  Number(primaryMoment.start ?? 0)
                )}`}
              >
                Play Moment
              </button>
            ) : null}

            <button
              className="rounded bg-black text-white px-3 py-1 text-[11px]"
              onClick={() => onPlay(track)}
              title="Play this track"
            >
              Play
            </button>

            <button
              className="rounded border px-3 py-1 text-[11px]"
              onClick={() => onPlayFromHere(track)}
              title="Play From Here (forces Project tab + disables Shuffle so it continues in order)"
            >
              From Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}