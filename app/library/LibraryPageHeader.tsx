"use client";

import { useEffect, useRef, useState } from "react";
import SharedUploadButtons from "../shared/uploads/SharedUploadButtons";
import NestedTagPicker from "./NestedTagPicker";
import { displayTagLabel } from "./libraryUtils";

type LibraryDownloadFormat = "wav" | "mp3" | "flac" | "aiff" | "original";

type Props = {
  filteredTrackCount: number;
  supabaseLoaded: boolean;
  supabaseErr: string | null;
  activeTags: string[];
  uploading: boolean;
  uploadMessage: string | null;
  uploadError: string | null;
  searchQuery?: string;
  projectSearchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onProjectSearchQueryChange?: (value: string) => void;
  onClearSearch?: () => void;
  onClearProjectSearch?: () => void;
  onFilesSelected: (files: File[]) => void;
  onAddFilterTag: (tagId: string) => void;
  onRemoveFilterTag: (tagId: string) => void;
  onClearFilters: () => void;
  onClearSavedTags: () => void;
};

const buttonClass =
  "inline-flex min-h-10 min-w-[128px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:text-white/50 disabled:hover:scale-100";

const menuButtonClass =
  "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-white transition-transform duration-150 hover:translate-x-1";

const chipClass =
  "inline-flex items-center justify-center rounded-full border border-white/25 bg-black px-3 py-1 text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const searchInputClass =
  "min-h-12 w-full rounded-2xl border border-white/25 bg-black px-4 py-3 text-base font-bold text-white outline-none placeholder:text-white/50 focus:border-white";

const downloadFormatOptions: {
  value: LibraryDownloadFormat;
  label: string;
}[] = [
  { value: "wav", label: "WAV" },
  { value: "mp3", label: "MP3" },
  { value: "flac", label: "FLAC" },
  { value: "aiff", label: "AIFF" },
  { value: "original", label: "Original" },
];

function getDownloadFormatLabel(format: LibraryDownloadFormat) {
  return (
    downloadFormatOptions.find((option) => option.value === format)?.label ??
    "WAV"
  );
}

export function LibraryPageHeader({
  filteredTrackCount,
  supabaseLoaded,
  supabaseErr,
  activeTags,
  uploading,
  uploadMessage,
  uploadError,
  searchQuery = "",
  projectSearchQuery = "",
  onSearchQueryChange,
  onProjectSearchQueryChange,
  onClearSearch,
  onClearProjectSearch,
  onFilesSelected,
  onAddFilterTag,
  onRemoveFilterTag,
  onClearFilters,
  onClearSavedTags,
}: Props) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] =
    useState<LibraryDownloadFormat>("wav");

  const optionsRef = useRef<HTMLDivElement | null>(null);
  const downloadRef = useRef<HTMLDivElement | null>(null);

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

      if (
        downloadOpen &&
        downloadRef.current &&
        !downloadRef.current.contains(target)
      ) {
        setDownloadOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOptionsOpen(false);
        setDownloadOpen(false);
      }
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [downloadOpen, optionsOpen]);

  function closeMenus() {
    setOptionsOpen(false);
    setDownloadOpen(false);
  }

  return (
    <>
      <div className="mb-4 rounded-3xl border border-white/25 bg-black p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Library</h1>

            <div className="mt-1 text-sm text-white/70">
              {filteredTrackCount} track
              {filteredTrackCount === 1 ? "" : "s"}
              {supabaseLoaded
                ? " • Library connected"
                : " • Local fallback only"}
            </div>

            <div className="mt-2 max-w-2xl text-sm text-white/70">
              Search Library first, then choose a project and send grouped
              titles or individual copies.
            </div>

            {supabaseErr ? (
              <div className="mt-2 text-sm text-white/70">
                Load note: {supabaseErr}
              </div>
            ) : null}

            {uploadMessage ? (
              <div className="mt-2 text-sm text-white/70">{uploadMessage}</div>
            ) : null}

            {uploadError ? (
              <div className="mt-2 text-sm text-white/70">{uploadError}</div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SharedUploadButtons
              disabled={uploading}
              onFilesSelected={onFilesSelected}
            />

            <NestedTagPicker
              title="Tags"
              onPickTagId={onAddFilterTag}
              excludeTagIds={activeTags}
            />

            <div className="relative" ref={downloadRef}>
              <button
                type="button"
                onClick={() => {
                  setDownloadOpen((value) => !value);
                  setOptionsOpen(false);
                }}
                className={buttonClass}
              >
                {getDownloadFormatLabel(downloadFormat)} ▾
              </button>

              {downloadOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/25 bg-black">
                  {downloadFormatOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setDownloadFormat(option.value);
                        setDownloadOpen(false);
                      }}
                      className={menuButtonClass}
                    >
                      <span>{option.label}</span>
                      <span className="text-white/70">
                        {downloadFormat === option.value ? "Selected" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className={buttonClass} onClick={closeMenus}>
              Download
            </button>

            <button type="button" className={buttonClass} onClick={closeMenus}>
              Send To
            </button>

            <div className="relative" ref={optionsRef}>
              <button
                type="button"
                onClick={() => {
                  setOptionsOpen((value) => !value);
                  setDownloadOpen(false);
                }}
                className={buttonClass}
              >
                Options ▾
              </button>

              {optionsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/25 bg-black">
                  <button
                    type="button"
                    onClick={() => {
                      onClearFilters();
                      setOptionsOpen(false);
                    }}
                    className={menuButtonClass}
                  >
                    <span>Clear filters</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClearSavedTags();
                      setOptionsOpen(false);
                    }}
                    className={menuButtonClass}
                  >
                    <span>Clear saved track tags</span>
                  </button>

                  <div className="border-t border-white/25">
                    <button
                      type="button"
                      onClick={() => setOptionsOpen(false)}
                      className={menuButtonClass}
                    >
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/20 bg-black p-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-white">
                Search Library
              </span>

              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange?.(event.target.value)}
                className={`${searchInputClass} mt-2`}
                placeholder="Search titles, copies, tags, artists..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-white">
                Search Projects
              </span>

              <input
                value={projectSearchQuery}
                onChange={(event) =>
                  onProjectSearchQueryChange?.(event.target.value)
                }
                className={`${searchInputClass} mt-2`}
                placeholder="Search project title, genre, artist, member..."
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={onClearSearch}
              disabled={!searchQuery}
            >
              Clear Library Search
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={onClearProjectSearch}
              disabled={!projectSearchQuery}
            >
              Clear Project Search
            </button>
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
              className={chipClass}
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