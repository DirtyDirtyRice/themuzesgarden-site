"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProjectLibraryPanelEmptyState from "./ProjectLibraryPanelEmptyState";
import ProjectLibraryPanelHeader from "./ProjectLibraryPanelHeader";
import ProjectLibraryPanelList from "./ProjectLibraryPanelList";
import type {
  AnyTrack,
  FilterMode,
  LocalVisibility,
} from "./projectLibraryPanelTypes";
import {
  filterTracks,
  getBaseVisibility,
  hasPlayableSource,
} from "./projectLibraryPanelUtils";

export default function ProjectLibraryPanel(props: {
  allTracks: AnyTrack[];
  linkedTrackIds: Set<string>;
  loadingLibrary: boolean;
  linkBusyId: string | null;
  linkTrack: (trackId: string) => void;
  unlinkTrack: (trackId: string) => void;
  onPlayTrackById: (trackId: string) => void;
}) {
  const {
    allTracks,
    linkedTrackIds,
    loadingLibrary,
    linkBusyId,
    linkTrack,
    unlinkTrack,
    onPlayTrackById,
  } = props;

  const [q, setQ] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<string, LocalVisibility>
  >({});

  const listRef = useRef<HTMLDivElement | null>(null);

  const visibleTracks = useMemo(() => {
    return Array.isArray(allTracks) ? allTracks : [];
  }, [allTracks]);

  const filtered = useMemo(() => {
    return filterTracks(visibleTracks, linkedTrackIds, q, mode);
  }, [visibleTracks, linkedTrackIds, q, mode]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [q, mode]);

  useEffect(() => {
    setSelectedIdx((prev) => {
      if (!filtered.length) return 0;
      return Math.max(0, Math.min(prev, filtered.length - 1));
    });
  }, [filtered]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const row = listEl.children[selectedIdx] as HTMLElement | undefined;
    if (!row) return;

    row.scrollIntoView({ block: "nearest" });
  }, [selectedIdx, filtered]);

  const linkedCount = linkedTrackIds.size;
  const showingCount = filtered.length;

  function toggleTrackVisibility(track: AnyTrack) {
    const tid = String(track?.id ?? "");
    if (!tid) return;

    setVisibilityOverrides((current) => {
      const existing = current[tid];
      const currentVisibility =
        existing === "private" || existing === "public"
          ? existing
          : getBaseVisibility(track);

      const nextVisibility: LocalVisibility =
        currentVisibility === "private" ? "public" : "private";

      return {
        ...current,
        [tid]: nextVisibility,
      };
    });
  }

  function handlePrimaryAction(trackId: string) {
    if (!trackId) return;

    const isLinked = linkedTrackIds.has(trackId);
    if (isLinked) {
      unlinkTrack(trackId);
    } else {
      linkTrack(trackId);
    }
  }

  function handlePlaySelected() {
    const picked = filtered[selectedIdx];
    if (!picked) return;
    if (!hasPlayableSource(picked)) return;

    const tid = String(picked.id ?? "");
    if (!tid) return;

    onPlayTrackById(tid);
  }

  return (
    <div className="space-y-2 rounded-2xl border border-white/25 bg-black p-3 text-white">
      <ProjectLibraryPanelHeader
        linkedCount={linkedCount}
        showingCount={showingCount}
        mode={mode}
        setMode={setMode}
        q={q}
        setQ={setQ}
        filteredLength={filtered.length}
        selectedIdx={selectedIdx}
        onPrimaryAction={() => {
          const picked = filtered[selectedIdx];
          const tid = String(picked?.id ?? "");
          handlePrimaryAction(tid);
        }}
        onPlaySelected={handlePlaySelected}
      />

      {filtered.length === 0 || visibleTracks.length === 0 ? (
        <ProjectLibraryPanelEmptyState
          loadingLibrary={loadingLibrary}
          visibleCount={visibleTracks.length}
          showingCount={showingCount}
          modeLabel={mode}
        />
      ) : (
        <ProjectLibraryPanelList
          filtered={filtered}
          selectedIdx={selectedIdx}
          listRef={listRef}
          linkedTrackIds={linkedTrackIds}
          linkBusyId={linkBusyId}
          visibilityOverrides={visibilityOverrides}
          setQ={setQ}
          setSelectedIdx={setSelectedIdx}
          onPrimaryAction={handlePrimaryAction}
          onPlayTrackById={onPlayTrackById}
          onToggleTrackVisibility={toggleTrackVisibility}
          onLinkTrack={linkTrack}
          onUnlinkTrack={unlinkTrack}
        />
      )}
    </div>
  );
}