"use client";

import { useEffect, useRef, useState } from "react";
import NestedTagPicker from "./NestedTagPicker";
import { displayTagLabel } from "./libraryUtils";

type Props = {
  filteredTrackCount: number;
  supabaseLoaded: boolean;
  supabaseErr: string | null;
  activeTags: string[];
  onAddFilterTag: (tagId: string) => void;
  onRemoveFilterTag: (tagId: string) => void;
  onClearFilters: () => void;
  onClearSavedTags: () => void;
};

export function LibraryPageHeader({
  filteredTrackCount,
  supabaseLoaded,
  supabaseErr,
  activeTags,
  onAddFilterTag,
  onRemoveFilterTag,
  onClearFilters,
  onClearSavedTags,
}: Props) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        optionsOpen &&
        optionsRef.current &&
        !optionsRef.current.contains(target)
      ) {
        setOptionsOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOptionsOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [optionsOpen]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            Library
          </h1>

          <div
            className="mt-1 text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            {filteredTrackCount} track
            {filteredTrackCount === 1 ? "" : "s"}
            {supabaseLoaded
              ? " • Daddy Library connected"
              : " • Local fallback only"}
          </div>

          {supabaseErr ? (
            <div
              className="mt-1 text-xs"
              style={{ color: "var(--text-normal)" }}
            >
              Supabase load note: {supabaseErr}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <NestedTagPicker
            title="Tags"
            onPickTagId={onAddFilterTag}
            excludeTagIds={activeTags}
          />

          <div className="relative" ref={optionsRef}>
            <button
              type="button"
              onClick={() => setOptionsOpen((v) => !v)}
              className="rounded-lg border border-white bg-black px-3 py-2 text-sm"
              style={{ color: "var(--text-normal)" }}
            >
              Options ▾
            </button>

            {optionsOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white bg-black">
                <button
                  type="button"
                  onClick={() => {
                    onClearFilters();
                    setOptionsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm"
                  style={{ color: "var(--text-normal)" }}
                >
                  Clear filters
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClearSavedTags();
                    setOptionsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm"
                  style={{ color: "var(--text-normal)" }}
                >
                  Clear saved track tags
                </button>

                <div className="border-t border-white">
                  <button
                    type="button"
                    onClick={() => setOptionsOpen(false)}
                    className="w-full px-4 py-3 text-left text-sm"
                    style={{ color: "var(--text-normal)" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeTags.map((tagId) => (
            <button
              key={tagId}
              type="button"
              onClick={() => onRemoveFilterTag(tagId)}
              className="rounded-full border border-white bg-black px-3 py-1 text-sm"
              style={{ color: "var(--text-strong)" }}
              title="Remove filter"
            >
              {displayTagLabel(tagId)} ✕
            </button>
          ))}
        </div>
      )}
    </>
  );
}