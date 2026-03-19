"use client";

import { useMemo, useState } from "react";
import type { MomentInspectorBookmarkOption } from "./momentInspectorBookmarks.types";

export default function MomentInspectorBookmarksBar(props: {
  bookmarkOptions: MomentInspectorBookmarkOption[];
  onSaveBookmark: (label: string) => void;
  onLoadBookmark: (bookmarkId: string) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}) {
  const { bookmarkOptions, onSaveBookmark, onLoadBookmark, onDeleteBookmark } = props;

  const [draftLabel, setDraftLabel] = useState("");
  const [selectedBookmarkId, setSelectedBookmarkId] = useState("");

  const selectedBookmark = useMemo(() => {
    return (
      bookmarkOptions.find((option) => option.id === selectedBookmarkId) ?? null
    );
  }, [bookmarkOptions, selectedBookmarkId]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Saved Views
          </div>
          <div className="text-xs text-zinc-600">
            Save the current inspector setup and load it later.
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            type="text"
            value={draftLabel}
            onChange={(event) => setDraftLabel(event.target.value)}
            placeholder="Bookmark name"
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
          />

          <button
            type="button"
            onClick={() => {
              onSaveBookmark(draftLabel);
              setDraftLabel("");
            }}
            className="rounded-full border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
          >
            Save View
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <select
            value={selectedBookmarkId}
            onChange={(event) => setSelectedBookmarkId(event.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
          >
            <option value="">Select saved view</option>
            {bookmarkOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (selectedBookmarkId) {
                onLoadBookmark(selectedBookmarkId);
              }
            }}
            disabled={!selectedBookmarkId}
            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
              selectedBookmarkId
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            Load
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedBookmarkId) {
                onDeleteBookmark(selectedBookmarkId);
                setSelectedBookmarkId("");
              }
            }}
            disabled={!selectedBookmarkId}
            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
              selectedBookmarkId
                ? "border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
                : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            Delete
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-600">
          {selectedBookmark ? (
            <span>{selectedBookmark.subtitle}</span>
          ) : (
            <span>
              {bookmarkOptions.length > 0
                ? `${bookmarkOptions.length} saved view(s) available.`
                : "No saved views yet."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}