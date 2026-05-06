"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import { buildLibraryGroundworkTracks } from "./libraryTrackGroundwork";
import { LibraryPageHeader } from "./LibraryPageHeader";
import { LibraryTrackList } from "./LibraryTrackList";
import { useLibraryTracks } from "./useLibraryTracks";
import { useLibraryFilters } from "./useLibraryFilters";

type IncomingTagMode = "add" | "replace";

const LIBRARY_PAGE_HOVER_FIX_STYLES = `
  .library-page-hover-fix nav a:hover:not([aria-current="page"]),
  .library-page-hover-fix nav button:hover:not([aria-current="page"]),
  .library-page-hover-fix header a:hover:not([aria-current="page"]),
  .library-page-hover-fix header button:hover:not([aria-current="page"]) {
    color: #000000 !important;
  }

  .library-page-hover-fix nav a:hover:not([aria-current="page"]) *,
  .library-page-hover-fix nav button:hover:not([aria-current="page"]) *,
  .library-page-hover-fix header a:hover:not([aria-current="page"]) *,
  .library-page-hover-fix header button:hover:not([aria-current="page"]) * {
    color: #000000 !important;
  }

  .library-page-hover-fix nav a[aria-current="page"]:hover,
  .library-page-hover-fix nav button[aria-current="page"]:hover,
  .library-page-hover-fix header a[aria-current="page"]:hover,
  .library-page-hover-fix header button[aria-current="page"]:hover {
    color: #ffffff !important;
  }

  .library-page-hover-fix nav a[aria-current="page"]:hover *,
  .library-page-hover-fix nav button[aria-current="page"]:hover *,
  .library-page-hover-fix header a[aria-current="page"]:hover *,
  .library-page-hover-fix header button[aria-current="page"]:hover * {
    color: #ffffff !important;
  }
`;

function LibraryPageHoverFix() {
  return <style>{LIBRARY_PAGE_HOVER_FIX_STYLES}</style>;
}

export default function LibraryPage() {
  const router = useRouter();
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [flashFilterArea, setFlashFilterArea] = useState(false);

  const {
    checkingSession,
    supabaseLoaded,
    supabaseErr,
    tracks,
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
    filteredTracks,
    addFilterTag,
    removeFilterTag,
    clearFilters,
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
      <div className="library-page-hover-fix min-h-screen bg-black">
        <LibraryPageHoverFix />
        <TopNav />

        <div className="mx-auto max-w-6xl p-6">
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="mt-2 text-sm text-white/70">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page-hover-fix min-h-screen bg-black">
      <LibraryPageHoverFix />
      <TopNav />

      <div
        ref={libraryTopRef}
        className={[
          "mx-auto max-w-6xl p-6 lg:pr-[32rem] transition-all duration-500",
          flashFilterArea
            ? "rounded-2xl ring-2 ring-white/40 bg-white/[0.02]"
            : "",
        ].join(" ")}
      >
        <LibraryPageHeader
          filteredTrackCount={filteredTracks.length}
          supabaseLoaded={supabaseLoaded}
          supabaseErr={supabaseErr}
          activeTags={activeTags}
          onAddFilterTag={addFilterTag}
          onRemoveFilterTag={removeFilterTag}
          onClearFilters={clearFilters}
          onClearSavedTags={clearSavedTags}
        />

        <LibraryTrackList
          tracks={filteredTracks}
          editingTrackId={editingTrackId}
          onSetEditingTrackId={setEditingTrackId}
          onAddFilterTag={addFilterTag}
          onAddTagToTrack={addTagToTrack}
          onRemoveTagFromTrack={removeTagFromTrack}
        />
      </div>
    </div>
  );
}