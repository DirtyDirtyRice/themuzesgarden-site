"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnyTrack, TrackSection } from "./playerTypes";
import {
  buildDiscoveryIndex,
  debugMomentPlayback,
  emitTagSearch,
  formatMomentTime,
  getAllDiscoveryTags,
  getTagSourceSummary,
  getTrackSections,
  getTrackTags,
  isTypingTarget,
  MUZES_PLAYBACK_TARGET_EVENT,
} from "./playerUtils";

type MatchedMoment = {
  sectionId: string;
  startTime: number;
  label: string;
  reason: "moment-tag" | "section-description";
};

function emitMomentPlaybackTarget(track: AnyTrack, match: MatchedMoment) {
  const trackId = String(track?.id ?? "").trim();
  if (!trackId) return;

  debugMomentPlayback({
    source: "SearchTab/PlayMoment",
    trackId,
    sectionId: match.sectionId,
    startTime: match.startTime,
  });

  window.dispatchEvent(
    new CustomEvent(MUZES_PLAYBACK_TARGET_EVENT, {
      detail: {
        trackId,
        sectionId: match.sectionId,
        startTime: match.startTime,
        preferProjectTab: false,
      },
    })
  );
}

function normalizeSectionText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function getSectionLabel(section: TrackSection): string {
  const desc = String(section.description ?? "").trim();
  if (desc) return desc;
  const tags = Array.isArray(section.tags)
    ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
  if (tags.length) return tags[0]!;
  return section.id;
}

function findMatchedMoment(t: AnyTrack, query: string): MatchedMoment | null {
  const sections = getTrackSections(t);
  if (!sections.length || !query) return null;

  for (const section of sections) {
    const tags = Array.isArray(section.tags)
      ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];

    for (const rawTag of tags) {
      const tag = rawTag.toLowerCase();
      if (tag === query) {
        return {
          sectionId: String(section.id),
          startTime: Number(section.start ?? 0),
          label: getSectionLabel(section),
          reason: "moment-tag",
        };
      }
    }
  }

  for (const section of sections) {
    const tags = Array.isArray(section.tags)
      ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];

    for (const rawTag of tags) {
      const tag = rawTag.toLowerCase();
      if (tag.startsWith(query) || tag.includes(query)) {
        return {
          sectionId: String(section.id),
          startTime: Number(section.start ?? 0),
          label: getSectionLabel(section),
          reason: "moment-tag",
        };
      }
    }
  }

  for (const section of sections) {
    const desc = normalizeSectionText(section.description);
    if (!desc) continue;

    if (desc === query || desc.startsWith(query) || desc.includes(query)) {
      return {
        sectionId: String(section.id),
        startTime: Number(section.start ?? 0),
        label: getSectionLabel(section),
        reason: "section-description",
      };
    }
  }

  return null;
}

function getMatchSummary(t: AnyTrack, query: string): string {
  const idx = buildDiscoveryIndex(t);

  if (idx.title === query) return "Exact title match";
  if (idx.title.startsWith(query)) return "Title starts with query";
  if (idx.title.includes(query)) return "Title match";

  if (idx.artist === query) return "Exact artist match";
  if (idx.artist.startsWith(query)) return "Artist starts with query";
  if (idx.artist.includes(query)) return "Artist match";

  const exactTag = idx.tags.find((tag) => tag === query);
  if (exactTag) {
    const source = getTagSourceSummary(t, exactTag);
    if (source.originLabel === "track+moment") return `Track + moment tag: ${exactTag}`;
    if (source.originLabel === "moment") return `Moment tag: ${exactTag}`;
    if (source.originLabel === "track") return `Track tag: ${exactTag}`;
  }

  const prefixTag = idx.tags.find((tag) => tag.startsWith(query));
  if (prefixTag) {
    const source = getTagSourceSummary(t, prefixTag);
    if (source.originLabel === "track+moment") return `Track + moment tag: ${prefixTag}`;
    if (source.originLabel === "moment") return `Moment tag: ${prefixTag}`;
    if (source.originLabel === "track") return `Track tag: ${prefixTag}`;
  }

  const containsTag = idx.tags.find((tag) => tag.includes(query));
  if (containsTag) {
    const source = getTagSourceSummary(t, containsTag);
    if (source.originLabel === "track+moment") return `Track + moment tag: ${containsTag}`;
    if (source.originLabel === "moment") return `Moment tag: ${containsTag}`;
    if (source.originLabel === "track") return `Track tag: ${containsTag}`;
  }

  const sectionDesc = idx.descriptions.find((text) => text.includes(query));
  if (sectionDesc) return "Section description match";

  return "General match";
}

function scoreTrack(t: AnyTrack, query: string): number {
  const idx = buildDiscoveryIndex(t);
  const trackTags = getTrackTags(t).map((x) => x.toLowerCase());
  const allDiscoveryTags = getAllDiscoveryTags(t).map((x) => x.toLowerCase());

  let score = 0;

  if (idx.title === query) score += 100;
  else if (idx.title.startsWith(query)) score += 70;
  else if (idx.title.includes(query)) score += 35;

  if (idx.artist === query) score += 20;
  else if (idx.artist.startsWith(query)) score += 14;
  else if (idx.artist.includes(query)) score += 8;

  for (const tag of trackTags) {
    if (tag === query) score += 24;
    else if (tag.startsWith(query)) score += 16;
    else if (tag.includes(query)) score += 10;
  }

  for (const tag of allDiscoveryTags) {
    const source = getTagSourceSummary(t, tag);

    if (source.originLabel === "moment") {
      if (tag === query) score += 18;
      else if (tag.startsWith(query)) score += 12;
      else if (tag.includes(query)) score += 7;
    }

    if (source.originLabel === "track+moment") {
      if (tag === query) score += 6;
      else if (tag.startsWith(query)) score += 4;
      else if (tag.includes(query)) score += 2;
    }
  }

  for (const text of idx.descriptions) {
    if (text === query) score += 12;
    else if (text.startsWith(query)) score += 8;
    else if (text.includes(query)) score += 5;
  }

  if (idx.path.includes(query)) score += 4;
  if (idx.id.includes(query)) score += 2;

  return score;
}

export default function SearchTab(props: {
  q: string;
  setQ: (v: string) => void;
  allTracks: AnyTrack[];
  onPlay: (t: AnyTrack) => void;
}) {
  const { q, setQ, allTracks, onPlay } = props;

  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    return allTracks
      .map((t) => ({
        t,
        score: scoreTrack(t, query),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const aTitle = String(a.t?.title ?? "");
        const bTitle = String(b.t?.title ?? "");
        const byTitle = aTitle.localeCompare(bTitle, undefined, {
          sensitivity: "base",
        });
        if (byTitle !== 0) return byTitle;

        return String(a.t?.id ?? "").localeCompare(String(b.t?.id ?? ""), undefined, {
          sensitivity: "base",
        });
      })
      .slice(0, 8)
      .map((x) => x.t);
  }, [q, allTracks]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [q]);

  useEffect(() => {
    setSelectedIdx((prev) => {
      if (!suggestions.length) return 0;
      return Math.max(0, Math.min(prev, suggestions.length - 1));
    });
  }, [suggestions]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (!q.trim()) return;
      if (!suggestions.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(suggestions.length - 1, i + 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
        return;
      }

      if (e.key === "Enter") {
        const t = suggestions[selectedIdx];
        if (!t) return;
        e.preventDefault();
        onPlay(t);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setQ("");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [suggestions, selectedIdx, onPlay, q, setQ]);

  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Search any track, artist, tag, or sound moment…"
      />

      {q.trim() && suggestions.length === 0 ? (
        <div className="text-xs text-zinc-500">No matches.</div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((t, idx) => {
            const tid = String(t.id);
            const selected = idx === selectedIdx;
            const tags = getTrackTags(t);
            const query = q.trim().toLowerCase();
            const matchSummary = getMatchSummary(t, query);
            const matchedMoment = findMatchedMoment(t, query);
            const matchedMomentTime = matchedMoment
              ? formatMomentTime(matchedMoment.startTime)
              : null;

            return (
              <div
                key={tid}
                className={[
                  "rounded border p-2 flex items-center justify-between gap-2 cursor-pointer",
                  selected ? "ring-2 ring-blue-200 border-blue-300 bg-blue-50/40" : "",
                ].join(" ")}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => onPlay(t)}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {selected ? "↵ " : ""}
                    {t.title ?? "Untitled"}
                  </div>

                  <div className="text-xs text-zinc-500 truncate">
                    {t.artist ?? "Supabase"}
                  </div>

                  <div className="mt-0.5 text-[11px] text-zinc-500 truncate">
                    {matchSummary}
                  </div>

                  {matchedMoment ? (
                    <div className="mt-1 text-[11px] text-zinc-600 truncate">
                      Moment hit: {matchedMoment.label} — {matchedMomentTime}
                    </div>
                  ) : null}

                  {tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.slice(0, 6).map((tag) => (
                        <button
                          key={`${tid}:${tag}`}
                          type="button"
                          className="rounded border bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600 hover:bg-zinc-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            emitTagSearch(tag);
                          }}
                          title={`Search tag: ${tag}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {matchedMoment ? (
                    <button
                      className="rounded border px-3 py-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        emitMomentPlaybackTarget(t, matchedMoment);
                      }}
                      title={`Play matched moment: ${matchedMoment.label} @ ${matchedMomentTime}`}
                    >
                      Play Moment
                    </button>
                  ) : null}

                  <button
                    className="rounded bg-black text-white px-3 py-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(t);
                    }}
                  >
                    Play
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-zinc-500">
        Search keys: ↑ ↓ select • Enter play track • Esc clear • Space pause/play • R resume
      </div>
    </div>
  );
}