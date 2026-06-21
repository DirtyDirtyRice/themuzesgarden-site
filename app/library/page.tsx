"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import {
  summarizeUploadResult,
  uploadProjectAudioFiles,
  type UploadedProjectItem,
} from "../shared/uploads/projectUploadHelpers";
import { buildLibraryGroundworkTracks } from "./libraryTrackGroundwork";
import { LibraryPageHeader } from "./LibraryPageHeader";
import { LibraryTrackList } from "./LibraryTrackList";
import { useLibraryTracks } from "./useLibraryTracks";
import { useLibraryFilters } from "./useLibraryFilters";

type IncomingTagMode = "add" | "replace";

export default function LibraryPage() {
  const router = useRouter();
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [flashFilterArea, setFlashFilterArea] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const setUploadedItems = useState<UploadedProjectItem[]>([])[1];

  const {
    checkingSession,
    supabaseLoaded,
    supabaseErr,
    tracks,
    projects,
    loadingProjects,
    sendingToProject,
    projectLinkMessage,
    loadProjects,
    addSelectedTracksToProject,
    addTagToTrack,
    removeTagFromTrack,
    clearSavedTags,
  } = useLibraryTracks({ router });

  const groundworkTracks = useMemo(() => {
    return buildLibraryGroundworkTracks(
      (tracks as unknown as Record<string, unknown>[]) ?? []
    );
  }, [tracks]);

  const visibleTracks = useMemo(() => {
    return groundworkTracks.filter(
      (track) => track.libraryAccess.visibility !== "private"
    );
  }, [groundworkTracks]);

  const {
    activeTags,
    searchQuery,
    filteredTracks,
    setSearchQuery,
    addFilterTag,
    removeFilterTag,
    clearFilters,
    clearSearch,
  } = useLibraryFilters({
    visibleTracks,
  });

  const addFilterTagRef = useRef(addFilterTag);
  const clearFiltersRef = useRef(clearFilters);
  const activeTagsRef = useRef<string[]>(activeTags);
  const lastPlayerTagKeyRef = useRef("");
  const libraryTopRef = useRef<HTMLDivElement | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const debounceRef = useRef(false);

  useEffect(() => {
    addFilterTagRef.current = addFilterTag;
  }, [addFilterTag]);

  useEffect(() => {
    clearFiltersRef.current = clearFilters;
  }, [clearFilters]);

  useEffect(() => {
    activeTagsRef.current = activeTags;
  }, [activeTags]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current != null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  function triggerFilterFeedback() {
    if (debounceRef.current) return;

    debounceRef.current = true;

    requestAnimationFrame(() => {
      libraryTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    setFlashFilterArea(true);

    if (flashTimeoutRef.current != null) {
      window.clearTimeout(flashTimeoutRef.current);
    }

    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashFilterArea(false);
      debounceRef.current = false;
    }, 900);
  }

  function applyIncomingPlayerTag(tag: string, mode: IncomingTagMode) {
    const cleanTag = String(tag ?? "").trim();
    if (!cleanTag) return;

    const currentTags = activeTagsRef.current;

    if (mode === "replace") {
      clearFiltersRef.current();

      requestAnimationFrame(() => {
        addFilterTagRef.current(cleanTag);
        triggerFilterFeedback();
      });

      return;
    }

    if (currentTags.includes(cleanTag)) {
      triggerFilterFeedback();
      return;
    }

    addFilterTagRef.current(cleanTag);
    triggerFilterFeedback();
  }

  async function handleLibraryFilesSelected(files: File[]) {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    setUploadError(null);
    setUploadMessage(
      `Uploading ${files.length} file${files.length === 1 ? "" : "s"}...`
    );

    try {
      const result = await uploadProjectAudioFiles({
        files,
        visibility: "shared",
        userId: null,
      });

      setUploadedItems((current) => [...result.uploadedItems, ...current]);
      setUploadMessage(summarizeUploadResult(result));

      router.refresh();
    } catch (error: unknown) {
      setUploadError(
        error instanceof Error ? error.message : "Library upload failed."
      );
      setUploadMessage(null);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    function onSearchTag(event: Event) {
      const custom = event as CustomEvent<{
        tag?: string;
        mode?: IncomingTagMode;
      }>;

      const tag = String(custom.detail?.tag ?? "").trim();
      const mode: IncomingTagMode =
        custom.detail?.mode === "replace" ? "replace" : "add";

      if (!tag) return;

      applyIncomingPlayerTag(tag, mode);
    }

    window.addEventListener(
      "muzesgarden-search-tag",
      onSearchTag as EventListener
    );

    return () => {
      window.removeEventListener(
        "muzesgarden-search-tag",
        onSearchTag as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const playerTag = String(params.get("playerTag") ?? "").trim();
    const playerMode: IncomingTagMode =
      params.get("playerMode") === "replace" ? "replace" : "add";

    if (!playerTag) return;

    const routeKey = `${playerMode}:${playerTag}`;
    if (lastPlayerTagKeyRef.current === routeKey) return;

    lastPlayerTagKeyRef.current = routeKey;
    applyIncomingPlayerTag(playerTag, playerMode);

    router.replace("/library");
  }, [router]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black">
        <TopNav />

        <div className="mx-auto max-w-6xl p-6">
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="mt-2 text-sm text-white/70">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TopNav />

      <div
        ref={libraryTopRef}
        className={[
          "mx-auto max-w-6xl p-6 transition-all duration-300 lg:pr-[32rem]",
          flashFilterArea
            ? "rounded-2xl border border-white/25 bg-black ring-2 ring-white/25"
            : "",
        ].join(" ")}
      >
        <LibraryPageHeader
          filteredTrackCount={filteredTracks.length}
          supabaseLoaded={supabaseLoaded}
          supabaseErr={supabaseErr}
          activeTags={activeTags}
          uploading={uploading}
          uploadMessage={uploadMessage}
          uploadError={uploadError}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onClearSearch={clearSearch}
          onFilesSelected={handleLibraryFilesSelected}
          onAddFilterTag={addFilterTag}
          onRemoveFilterTag={removeFilterTag}
          onClearFilters={clearFilters}
          onClearSavedTags={clearSavedTags}
        />

        <LibraryTrackList
          tracks={filteredTracks}
          projects={projects}
          loadingProjects={loadingProjects}
          sendingToProject={sendingToProject}
          projectLinkMessage={projectLinkMessage}
          editingTrackId={editingTrackId}
          onSetEditingTrackId={setEditingTrackId}
          onAddFilterTag={addFilterTag}
          onAddTagToTrack={addTagToTrack}
          onRemoveTagFromTrack={removeTagFromTrack}
          onRefreshProjects={loadProjects}
          onAddTracksToProject={addSelectedTracksToProject}
        />
      </div>
    </div>
  );
}