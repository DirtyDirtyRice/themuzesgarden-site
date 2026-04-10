"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnyTrack, TrackSection } from "./playerTypes";
import { getSupabaseTracks } from "../lib/getSupabaseTracks";

function normalizeSection(section: unknown, index: number): TrackSection | null {
  if (!section || typeof section !== "object") return null;

  const raw = section as Record<string, unknown>;

  const start =
    typeof raw.start === "number" && Number.isFinite(raw.start) ? raw.start : 0;

  const end =
    typeof raw.end === "number" && Number.isFinite(raw.end) ? raw.end : start;

  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : `section-${index}-${start}-${end}`;

  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
    : undefined;

  const description =
    typeof raw.description === "string" && raw.description.trim()
      ? raw.description.trim()
      : undefined;

  return {
    id,
    start,
    end: end >= start ? end : start,
    tags,
    description,
  };
}

function normalizeTrack(track: unknown): AnyTrack | null {
  if (!track || typeof track !== "object") return null;

  const raw = track as Record<string, unknown>;

  const rawId = raw.id;
  const id =
    typeof rawId === "string"
      ? rawId.trim()
      : typeof rawId === "number" && Number.isFinite(rawId)
      ? String(rawId)
      : "";

  if (!id) return null;

  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : undefined;

  const artist =
    typeof raw.artist === "string" && raw.artist.trim()
      ? raw.artist.trim()
      : undefined;

  const url =
    typeof raw.url === "string" && raw.url.trim()
      ? raw.url.trim()
      : undefined;

  const path =
    typeof raw.path === "string" && raw.path.trim()
      ? raw.path.trim()
      : undefined;

  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
    : undefined;

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((section, index) => normalizeSection(section, index))
        .filter((section): section is TrackSection => Boolean(section))
    : undefined;

  // 🔥 NEW: visibility passthrough
  const visibility =
    raw.visibility === "private" ||
    raw.visibility === "public" ||
    raw.visibility === "shared"
      ? raw.visibility
      : "shared";

  return {
    id,
    title,
    artist,
    url,
    path,
    tags,
    sections,
    visibility, // 🔥 added
  };
}

async function wait(ms: number) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useAllTracks() {
  const [allTracks, setAllTracks] = useState<AnyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTracks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    let lastError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const tracks = await getSupabaseTracks();

        const safe = Array.isArray(tracks)
          ? tracks
              .map((track) => normalizeTrack(track))
              .filter((track): track is AnyTrack => Boolean(track))
          : [];

        setAllTracks(safe);
        setIsLoading(false);
        setLoadError(null);
        return;
      } catch (error) {
        lastError = error;

        if (attempt === 0) {
          await wait(350);
        }
      }
    }

    setAllTracks([]);
    setIsLoading(false);
    setLoadError(
      lastError instanceof Error && lastError.message.trim()
        ? lastError.message
        : "Failed to load tracks."
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setLoadError(null);

      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const tracks = await getSupabaseTracks();

          const safe = Array.isArray(tracks)
            ? tracks
                .map((track) => normalizeTrack(track))
                .filter((track): track is AnyTrack => Boolean(track))
            : [];

          if (!cancelled) {
            setAllTracks(safe);
            setIsLoading(false);
            setLoadError(null);
          }
          return;
        } catch (error) {
          lastError = error;

          if (attempt === 0) {
            await wait(350);
          }
        }
      }

      if (!cancelled) {
        setAllTracks([]);
        setIsLoading(false);
        setLoadError(
          lastError instanceof Error && lastError.message.trim()
            ? lastError.message
            : "Failed to load tracks."
        );
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    allTracks,
    isLoading,
    loadError,
    reloadTracks: loadTracks,
  };
}