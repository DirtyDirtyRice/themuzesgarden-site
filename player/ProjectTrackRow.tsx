import type { AnyTrack } from "./playerTypes";
import MetadataPanel from "./MetadataPanel";
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
      onDoubleClick={() => {
        onSelectTrack(tid);
        onPlayFromHere(track);
      }}
      onMouseEnter={() => onSelectTrack(tid)}
      onDragOver={(e) => onDragOverTrack(tid, e)}
      onDrop={(e) => onDropOnTrack(tid, e)}
      onDragEnd={onClearDragState}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">

          <div className="text-sm font-medium truncate">
            {track.title ?? "Untitled"}
          </div>

          <div className="text-xs text-zinc-500 truncate">
            {track.artist ?? "Supabase"}
          </div>

          {/* 🔥 METADATA INSERTED HERE */}
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <MetadataPanel targetType="track" targetId={tid} />
          </div>

          {firstSectionDescription && (
            <div className="mt-1 text-[11px] text-zinc-600 truncate">
              First moment: {firstSectionDescription}
            </div>
          )}

          {sectionCount > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded border bg-white px-2 py-0.5 text-[10px]">
                Indexed moments: {sectionCount}
              </span>
              <span className="rounded border px-2 py-0.5 text-[10px]">
                {densityLabel}
              </span>
            </div>
          )}

          {combinedTags.length > 0 && (
            <ProjectTrackTags track={track} tags={combinedTags.slice(0, 6)} />
          )}

          {isSelected && (
            <div className="mt-2 text-[11px] text-zinc-600">
              Space = play • Enter = from here
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button onClick={() => onPlay(track)}>Play</button>
          <button onClick={() => onPlayFromHere(track)}>From Here</button>
        </div>
      </div>
    </div>
  );
}