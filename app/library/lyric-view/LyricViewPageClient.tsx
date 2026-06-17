"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { downloadLyricTextFile } from "../lyrics/lyricsFileActions";
import { getStartingLyrics } from "../lyrics/lyricsStorage";
import type { LyricEntry } from "../lyrics/lyricsTypes";
import { findLyricEntryById } from "../lyrics/lyricsViewerHelpers";

export default function LyricViewPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lyricId = searchParams.get("lyricId") || "";

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

  const entry = useMemo(
    () => findLyricEntryById(entries, lyricId),
    [entries, lyricId]
  );

  function handleBackToLyricsLibrary() {
    router.push("/library");
  }

  function handleDownloadEntry() {
    if (!entry) return;
    downloadLyricTextFile(entry);
  }

  function handleEditInLibrary() {
    if (!entry) return;
    router.push("/library");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-white/15 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-white/55">
            Direct Lyric Destination
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {entry?.title || (hasLoaded ? "Lyric Not Found" : "Loading...")}
              </h1>

              <p className="mt-2 text-sm text-white/70">
                {entry?.artist || "Lyrics open here as their own page."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBackToLyricsLibrary}
                className="rounded-lg border border-white/35 bg-black px-3 py-2 text-sm font-semibold text-white/80"
              >
                Back To Library
              </button>

              {entry ? (
                <>
                  <button
                    type="button"
                    onClick={handleEditInLibrary}
                    className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white"
                  >
                    Edit In Library
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadEntry}
                    className="rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white"
                  >
                    Download TXT
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {entry ? (
          <section className="rounded-2xl border border-white/15 bg-black p-5">
            <div className="flex flex-wrap gap-3 text-xs text-white/55">
              <span>Tags: {entry.tags || "None"}</span>
              <span>Created: {entry.createdAt}</span>
              <span>Updated: {entry.updatedAt}</span>
            </div>

            <pre className="mt-5 min-h-[420px] whitespace-pre-wrap rounded-xl border border-white/10 bg-black p-5 text-base leading-7 text-white">
              {entry.body}
            </pre>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-sm font-semibold text-white">
              {hasLoaded
                ? "No lyric was found for this direct link."
                : "Loading lyric from browser storage..."}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}