"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import { writePersisted } from "./playerStorage";
import { emitTagSearch, isTypingTarget } from "./playerUtils";
import SearchResultCard from "./SearchResultCard";
import { useWarmMomentEngineSnapshot } from "./useWarmMomentEngineSnapshot";
import {
  buildSearchSuggestions,
  emitMomentPlaybackTarget,
} from "./searchTabHelpers";

type SearchPreset = {
  id: string;
  label: string;
  query: string;
};

const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: "moment-rich-soft",
    label: "Moment-Rich Soft",
    query: 'has:moment (tag:soft OR tag:warm)',
  },
  {
    id: "vocal-intros",
    label: "Vocal Intros",
    query: 'has:moment (moment:intro OR moment:vocal OR tag:vocal)',
  },
  {
    id: "no-drums-ambient",
    label: "No Drums Ambient",
    query: '(tag:ambient OR tag:pad OR tag:soft) -tag:drums',
  },
  {
    id: "hot-guitar-zones",
    label: "Hot Guitar Zones",
    query: 'has:moment (moment:guitar OR tag:guitar)',
  },
  {
    id: "soft-piano",
    label: "Soft Piano",
    query: "+soft +piano",
  },
  {
    id: "title-out-of-tune",
    label: "Title: Out Of Tune",
    query: 'title:"out of tune"',
  },
];

export default function SearchTab(props: {
  q: string;
  setQ: (v: string) => void;
  allTracks: AnyTrack[];
  onPlay: (t: AnyTrack) => void;
}) {
  const { q, setQ, allTracks, onPlay } = props;

  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [momentsOnly, setMomentsOnly] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);
  const didInitialFocusRef = useRef(false);

  const trimmedQuery = q.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  useWarmMomentEngineSnapshot(allTracks);

  const suggestions = useMemo(() => {
    const rows = buildSearchSuggestions(allTracks, normalizedQuery);

    if (!momentsOnly) return rows;
    return rows.filter((row) => row.matchedMomentCount > 0);
  }, [allTracks, normalizedQuery, momentsOnly]);

  const selectedRow = suggestions[selectedIdx] ?? null;
  const hasSuggestions = suggestions.length > 0;

  const totalMomentHits = suggestions.reduce(
    (count, row) => count + row.matchedMomentCount,
    0
  );

  const activePresetId = useMemo(() => {
    const match = SEARCH_PRESETS.find(
      (preset) => preset.query.toLowerCase() === normalizedQuery
    );
    return match?.id ?? null;
  }, [normalizedQuery]);

  function persistTrackPlayContext() {
    writePersisted({
      lastMatchedSectionId: null,
      lastMatchedSectionStartTime: null,
    });
  }

  function playTrack(track: AnyTrack) {
    persistTrackPlayContext();
    onPlay(track);
  }

  function playSelectedTrack() {
    const row = suggestions[selectedIdx];
    if (!row) return;
    playTrack(row.t);
  }

  function playSelectedMoment() {
    const row = suggestions[selectedIdx];
    if (!row) return;

    const primaryMoment = row.primaryMoment;
    if (!primaryMoment) return;

    emitMomentPlaybackTarget(row.t, primaryMoment);
  }

  function focusSearchInput() {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
  }

  function scrollSelectedIntoView() {
    const el = resultRefs.current[selectedIdx];
    if (!el) return;

    el.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }

  function nextResult() {
    setSelectedIdx((idx) =>
      suggestions.length ? (idx + 1) % suggestions.length : 0
    );
  }

  function prevResult() {
    setSelectedIdx((idx) =>
      suggestions.length ? (idx - 1 + suggestions.length) % suggestions.length : 0
    );
  }

  function applyPreset(preset: SearchPreset) {
    setQ(preset.query);
    focusSearchInput();
  }

  useEffect(() => {
    if (didInitialFocusRef.current) return;
    didInitialFocusRef.current = true;

    const input = inputRef.current;
    if (!input) return;

    const active = document.activeElement;
    const nothingFocused =
      !active || active === document.body || active === document.documentElement;

    if (nothingFocused || active === input) {
      input.focus();
    }
  }, []);

  useEffect(() => {
    if (!trimmedQuery) {
      setSelectedTrackId(null);
      setSelectedIdx(0);
      return;
    }

    setSelectedIdx(0);
  }, [q, trimmedQuery]);

  useEffect(() => {
    if (!suggestions.length) {
      setSelectedIdx(0);
      setSelectedTrackId(null);
      return;
    }

    if (selectedTrackId) {
      const existingIdx = suggestions.findIndex(
        (row) => String(row.t?.id ?? "") === String(selectedTrackId)
      );

      if (existingIdx >= 0) {
        setSelectedIdx(existingIdx);
        return;
      }
    }

    setSelectedIdx((prev) => Math.max(0, Math.min(prev, suggestions.length - 1)));
  }, [suggestions, selectedTrackId]);

  useEffect(() => {
    const row = suggestions[selectedIdx];
    if (!row) return;

    const tid = String(row.t?.id ?? "").trim();
    if (!tid) return;

    setSelectedTrackId((prev) => (prev === tid ? prev : tid));
  }, [selectedIdx, suggestions]);

  useEffect(() => {
    scrollSelectedIntoView();
  }, [selectedIdx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (!trimmedQuery) return;
      if (!suggestions.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextResult();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        prevResult();
        return;
      }

      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        playSelectedMoment();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        playSelectedTrack();
        return;
      }

      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        playSelectedTrack();
        return;
      }

      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        playSelectedMoment();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setQ("");
        focusSearchInput();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [suggestions, selectedIdx, trimmedQuery, setQ]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          id="player-search"
          name="player-search"
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder='Search or use query syntax like title:"out of tune" or +soft -hard'
        />

        {trimmedQuery ? (
          <button
            type="button"
            className="shrink-0 rounded border px-3 py-2 text-xs"
            onClick={() => {
              setQ("");
              focusSearchInput();
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="rounded border bg-zinc-50 px-3 py-2">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Search Presets
        </div>

        <div className="flex flex-wrap gap-1">
          {SEARCH_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                className={[
                  "rounded border px-2 py-0.5 text-[10px]",
                  active
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "bg-white text-zinc-600 hover:bg-zinc-100",
                ].join(" ")}
                onClick={() => applyPreset(preset)}
                title={preset.query}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {trimmedQuery ? (
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            Results: {suggestions.length}
            {suggestions.length === 8 ? " (top 8 shown)" : ""}
            {" • "}
            Moments: {totalMomentHits}
          </span>

          <div className="flex items-center gap-2">
            <button
              className={[
                "rounded border px-2 py-0.5 text-[10px]",
                momentsOnly
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "bg-white text-zinc-600",
              ].join(" ")}
              onClick={() => setMomentsOnly((value) => !value)}
            >
              Moments only
            </button>

            <span>
              Query: <span className="font-medium text-zinc-700">{trimmedQuery}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded border bg-zinc-50 px-3 py-3 text-[11px] text-zinc-500">
          Search by title, artist, track tag, moment tag, section description, or use presets.
        </div>
      )}

      {selectedRow ? (
        <div className="flex items-center justify-between rounded border border-blue-200 bg-blue-50/50 px-3 py-2">
          <div className="text-[11px] text-zinc-700">
            Selected {selectedIdx + 1} / {suggestions.length}
          </div>

          <div className="flex gap-1">
            <button
              className="rounded border bg-white px-2 py-0.5 text-[10px]"
              onClick={prevResult}
            >
              Prev
            </button>

            <button
              className="rounded border bg-white px-2 py-0.5 text-[10px]"
              onClick={nextResult}
            >
              Next
            </button>

            <button
              className="rounded border bg-blue-600 px-2 py-0.5 text-[10px] text-white"
              onClick={playSelectedTrack}
            >
              Play
            </button>
          </div>
        </div>
      ) : null}

      {trimmedQuery && !hasSuggestions ? (
        <div className="rounded border bg-zinc-50 px-3 py-3 text-xs text-zinc-500">
          No matches found for{" "}
          <span className="font-medium text-zinc-700">{trimmedQuery}</span>.
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((row, idx) => {
            const tid = String(row.t.id);
            const selected = idx === selectedIdx;

            return (
              <div
                key={tid}
                ref={(el) => {
                  resultRefs.current[idx] = el;
                }}
              >
                <SearchResultCard
                  row={row}
                  idx={idx}
                  selected={selected}
                  normalizedQuery={normalizedQuery}
                  trimmedQuery={trimmedQuery}
                  onHover={() => {
                    setSelectedIdx(idx);
                    setSelectedTrackId(tid);
                  }}
                  onPlayTrack={() => playTrack(row.t)}
                  onPlayMoment={(moment) => emitMomentPlaybackTarget(row.t, moment)}
                  onTagClick={(tag) => {
                    setQ(tag);
                    emitTagSearch(tag);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500">
        Search keys: ↑ ↓ wrap select • Enter play track • Shift+Enter play moment • P play
        track • M play moment • Esc clear
      </div>
    </div>
  );
}