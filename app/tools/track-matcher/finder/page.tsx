"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { buildLibraryGroundworkTracks } from "../../../library/libraryTrackGroundwork";
import { useLibraryTracks } from "../../../library/useLibraryTracks";
import TrackMatcherFinderPanel from "../controller/TrackMatcherFinderPanel";
import { adaptLibraryTracksToFinderResults } from "../controller/trackMatcherFinderLibraryAdapter";
import type {
  TrackMatcherFinderDestination,
  TrackMatcherFinderTrackResult,
} from "../controller/trackMatcherFinderTypes";

type FinderLoadLog = {
  id: string;
  title: string;
  destination: TrackMatcherFinderDestination;
};

export default function TrackMatcherFinderPage() {
  const router = useRouter();
  const [lastLoad, setLastLoad] = useState<FinderLoadLog | null>(null);

  const {
    checkingSession,
    supabaseLoaded,
    supabaseErr,
    tracks: libraryTracks,
  } = useLibraryTracks({ router });

  const finderTracks = useMemo(() => {
    const groundworkTracks = buildLibraryGroundworkTracks(
      (libraryTracks as unknown as Record<string, unknown>[]) ?? [],
    );

    const visibleTracks = groundworkTracks.filter(
      (track) => track.libraryAccess.visibility !== "private",
    );

    return adaptLibraryTracksToFinderResults(visibleTracks);
  }, [libraryTracks]);

  function handleLoadTrack(
    track: TrackMatcherFinderTrackResult,
    destination: TrackMatcherFinderDestination,
  ) {
    setLastLoad({
      id: track.id,
      title: track.title,
      destination,
    });
  }

  const statusText = checkingSession
    ? "Checking Library session…"
    : supabaseErr
      ? `Library warning: ${supabaseErr}`
      : supabaseLoaded
        ? "Finder is searching Supabase, uploaded, and seed tracks."
        : "Finder is searching available local and seed tracks.";

  return (
    <main className="min-h-screen bg-black p-3 text-white md:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.025] px-4 py-3 shadow-2xl shadow-black/20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-200/70">
            Track Matcher Branch
          </p>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-white md:text-3xl">
            Finder
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Search Library-ready tracks, inspect Finder results, and prepare
            material for Track A, Track B, future lanes, references, hybrids,
            and analysis.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/65">
              {finderTracks.length} finder tracks
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/65">
              {statusText}
            </span>
          </div>

          {lastLoad ? (
            <div className="mt-3 rounded-2xl border border-orange-300/20 bg-orange-500/[0.08] p-3 text-sm text-orange-100/80">
              Last Finder action: <strong>{lastLoad.title}</strong> →{" "}
              <strong>{lastLoad.destination}</strong>
            </div>
          ) : null}
        </section>

        <TrackMatcherFinderPanel
          tracks={finderTracks}
          mode="expanded"
          onLoadTrack={handleLoadTrack}
        />
      </div>
    </main>
  );
}