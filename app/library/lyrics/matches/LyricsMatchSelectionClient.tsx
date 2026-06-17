"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  findExactLyricTitleMatch,
  findPossibleLyricTitleMatches,
} from "../lyricsTrackMatchHelpers";
import { getStartingLyrics } from "../lyricsStorage";
import type { LyricEntry } from "../lyricsTypes";

export default function LyricsMatchSelectionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const trackId = searchParams.get("trackId") || "";
  const trackTitle = searchParams.get("trackTitle") || "";
  const trackArtist = searchParams.get("trackArtist") || "";

  const [entries, setEntries] = useState<LyricEntry[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadLyrics() {
      const loadedLyrics = await getStartingLyrics();

      if (!isActive) return;

      setEntries(loadedLyrics);
      setHasLoaded(true);
    }

    void loadLyrics();

    return () => {
      isActive = false;
    };
  }, []);

  const exactMatch = useMemo(
    () => findExactLyricTitleMatch(entries, trackTitle),
    [entries, trackTitle]
  );

  const possibleMatches = useMemo(
    () => findPossibleLyricTitleMatches(entries, trackTitle),
    [entries, trackTitle]
  );

  useEffect(() => {
    if (!hasLoaded || !exactMatch) return;

    router.replace(`/library/lyrics/${encodeURIComponent(exactMatch.id)}`);
  }, [exactMatch, hasLoaded, router]);

  function handleOpenLyric(entry: LyricEntry) {
    router.push(`/library/lyrics/${encodeURIComponent(entry.id)}`);
  }

  function handleBackToLibrary() {
    router.push("/library");
  }

  function handleOpenLyricsLibrary() {
    router.push("/library/lyrics");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-white/15 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-white/55">
            Lyric Match Selection
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {trackTitle || "Track title not provided"}
              </h1>

              <p className="mt-2 text-sm text-white/70">
                {trackArtist || "Unknown artist"}
              </p>

              {trackId ? (
                <p className="mt-2 text-xs text-white/55">
                  Track ID: {trackId}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBackToLibrary}
                className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80 transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
              >
                Back To Library
              </button>

              <button
                type="button"
                onClick={handleOpenLyricsLibrary}
                className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
              >
                Open Lyrics Library
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/15 bg-black p-5">
          <h2 className="text-xl font-bold text-white">
            {hasLoaded ? "Possible Lyric Matches" : "Loading lyric matches..."}
          </h2>

          <p className="mt-2 text-sm text-white/65">
            {hasLoaded
              ? "No exact title match was found. Choose the lyric that looks closest."
              : "Checking browser lyrics now."}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {hasLoaded && possibleMatches.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black p-4">
                <p className="text-sm font-semibold text-white">
                  No close lyric title matches found.
                </p>

                <p className="mt-2 text-sm text-white/65">
                  Open the Lyrics Library to import, create, or rename a lyric.
                </p>
              </div>
            ) : null}

            {possibleMatches.map((item) => (
              <div
                key={item.entry.id}
                className="rounded-xl border border-white/10 bg-black p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {item.entry.title}
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {item.entry.artist || "Unknown artist"}
                    </p>

                    <p className="mt-2 text-xs text-white/55">
                      Match score: {item.score}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenLyric(item.entry)}
                    className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
                  >
                    Open This Lyric
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}