"use client";

import type {
  AnyTrack,
  LocalVisibility,
} from "./projectLibraryPanelTypes";
import ProjectLibraryPanelTrackRow from "./ProjectLibraryPanelTrackRow";

type Props = {
  filtered: AnyTrack[];
  selectedIdx: number;
  listRef: React.RefObject<HTMLDivElement | null>;
  linkedTrackIds: Set<string>;
  linkBusyId: string | null;
  visibilityOverrides: Record<string, LocalVisibility>;
  setQ: (value: string) => void;
  setSelectedIdx: (value: number) => void;
  onPrimaryAction: (trackId: string) => void;
  onPlayTrackById: (trackId: string) => void;
  onToggleTrackVisibility: (track: AnyTrack) => void;
  onLinkTrack: (trackId: string) => void;
  onUnlinkTrack: (trackId: string) => void;
};

export default function ProjectLibraryPanelList({
  filtered,
  selectedIdx,
  listRef,
  linkedTrackIds,
  linkBusyId,
  visibilityOverrides,
  setQ,
  setSelectedIdx,
  onPrimaryAction,
  onPlayTrackById,
  onToggleTrackVisibility,
  onLinkTrack,
  onUnlinkTrack,
}: Props) {
  return (
    <div ref={listRef} className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {filtered.map((track, idx) => {
        const tid = String(track.id);

        return (
          <ProjectLibraryPanelTrackRow
            key={tid}
            track={track}
            isLinked={linkedTrackIds.has(tid)}
            isSelected={idx === selectedIdx}
            linkBusyId={linkBusyId}
            visibilityOverrides={visibilityOverrides}
            setQ={setQ}
            onMouseEnter={() => setSelectedIdx(idx)}
            onPrimaryAction={onPrimaryAction}
            onPlayTrackById={onPlayTrackById}
            onToggleTrackVisibility={onToggleTrackVisibility}
            onLinkTrack={onLinkTrack}
            onUnlinkTrack={onUnlinkTrack}
          />
        );
      })}
    </div>
  );
}