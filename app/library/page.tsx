"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TRACKS_SEED } from "../../lib/tracksSeed";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function uniqueTagsFromTracks(tracks: { tags?: string[] }[]): string[] {
  const set = new Set<string>();
  for (const t of tracks) for (const tag of t.tags ?? []) set.add(tag);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function parseTagsParam(v: string | null): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toTagsParam(tags: string[]) {
  return tags.join(",");
}

export default function LibraryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tracks = useMemo(() => TRACKS_SEED ?? [], []);

  const allTags = useMemo(() => uniqueTagsFromTracks(tracks), [tracks]);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Selected tags come from URL
  const selectedTags = useMemo(() => parseTagsParam(searchParams.get("tags")), [searchParams]);

  const filteredSuggestions = useMemo(() => {
    const q = normalize(query);
    const base = allTags.filter((t) => !selectedTags.includes(t));
    if (!q) return base.slice(0, 20);
    return base.filter((t) => normalize(t).includes(q)).slice(0, 20);
  }, [allTags, query, selectedTags]);

  const filteredTracks = useMemo(() => {
    if (selectedTags.length === 0) return tracks;
    return tracks.filter((t) => selectedTags.every((tag) => (t.tags ?? []).includes(tag)));
  }, [tracks, selectedTags]);

  function setSelectedTags(next: string[]) {
    const sp = new URLSearchParams(searchParams.toString());
    if (next.length === 0) sp.delete("tags");
    else sp.set("tags", toTagsParam(next));
    router.replace(`${pathname}?${sp.toString()}`);
  }

  function addTag(tag: string) {
    if (!tag) return;
    if (selectedTags.includes(tag)) return;
    setSelectedTags([...selectedTags, tag]);
    setQuery("");
    setIsOpen(true);
    setActiveIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function removeTag(tag: string) {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function openDropdown() {
    setIsOpen(true);
  }
  function closeDropdown() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  // Click outside closes
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) closeDropdown();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Keep activeIndex sane when suggestions change
  useEffect(() => {
    if (!isOpen) return;
    if (filteredSuggestions.length === 0) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= filteredSuggestions.length) {
      setActiveIndex(filteredSuggestions.length - 1);
    }
  }, [filteredSuggestions.length, activeIndex, isOpen]);

  // Keep highlighted item in view
  useEffect(() => {
    if (!isOpen) return;
    if (activeIndex < 0) return;
    const ul = listRef.current;
    if (!ul) return;
    const li = ul.querySelector<HTMLLIElement>(`li[data-idx="${activeIndex}"]`);
    li?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) openDropdown();

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        if (filteredSuggestions.length === 0) return;
        setActiveIndex((prev) => (prev < 0 ? 0 : (prev + 1) % filteredSuggestions.length));
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (filteredSuggestions.length === 0) return;
        setActiveIndex((prev) => {
          if (prev < 0) return filteredSuggestions.length - 1;
          const next = prev - 1;
          return next < 0 ? filteredSuggestions.length - 1 : next;
        });
        break;
      }
      case "Enter": {
        if (!isOpen) return;
        if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
          e.preventDefault();
          addTag(filteredSuggestions[activeIndex]);
          return;
        }
        const exact = filteredSuggestions.find((t) => normalize(t) === normalize(query));
        if (exact) {
          e.preventDefault();
          addTag(exact);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        closeDropdown();
        break;
      }
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a, #020617)",
        color: "#e5e7eb",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }} ref={containerRef}>
        <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#f8fafc" }}>Library</h1>
            <p style={{ margin: "6px 0 0", color: "#cbd5f5" }}>
              Filter tracks by tags (↑ ↓ + Enter).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTags([])}
            disabled={selectedTags.length === 0}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #475569",
              background: selectedTags.length === 0 ? "#0b1220" : "#020617",
              color: selectedTags.length === 0 ? "#64748b" : "#e5e7eb",
              cursor: selectedTags.length === 0 ? "not-allowed" : "pointer",
            }}
            title="Clear tag filters"
          >
            Clear
          </button>
        </header>

        {/* Selected tags */}
        <section style={{ marginTop: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => removeTag(t)}
                title="Click to remove"
                style={{
                  borderRadius: 999,
                  border: "1px solid #475569",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                {t} <span style={{ opacity: 0.7, marginLeft: 6 }}>×</span>
              </button>
            ))}

            {selectedTags.length === 0 && (
              <div style={{ color: "#94a3b8", fontSize: 14 }}>No tag filters selected.</div>
            )}
          </div>

          {/* Tag search */}
          <div style={{ position: "relative", marginTop: 12 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => openDropdown()}
              onKeyDown={onKeyDown}
              placeholder="Search tags…"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid #475569",
                background: "#020617",
                color: "#f8fafc",
                padding: "12px 14px",
                outline: "none",
              }}
            />

            {isOpen && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 20,
                  marginTop: 8,
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  background: "#020617",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  overflow: "hidden",
                }}
              >
                {filteredSuggestions.length === 0 ? (
                  <div style={{ padding: 12, color: "#94a3b8", fontSize: 14 }}>No matching tags</div>
                ) : (
                  <ul
                    ref={listRef}
                    style={{
                      maxHeight: 260,
                      overflow: "auto",
                      listStyle: "none",
                      padding: 6,
                      margin: 0,
                    }}
                  >
                    {filteredSuggestions.map((tag, idx) => {
                      const active = idx === activeIndex;
                      return (
                        <li
                          key={tag}
                          data-idx={idx}
                          style={{
                            padding: "10px 10px",
                            borderRadius: 10,
                            cursor: "pointer",
                            background: active ? "#1e293b" : "transparent",
                            color: "#e5e7eb",
                          }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addTag(tag)}
                        >
                          {tag}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Track list */}
        <section style={{ marginTop: 18 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 18, color: "#f8fafc" }}>Tracks</h2>

          <div
            style={{
              border: "1px solid #334155",
              borderRadius: 14,
              background: "#020617",
              overflow: "hidden",
            }}
          >
            {filteredTracks.length === 0 ? (
              <div style={{ padding: 14, color: "#94a3b8" }}>No tracks match these tags.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {filteredTracks.map((t, idx) => (
                  <li
                    key={t.id}
                    style={{
                      padding: 14,
                      borderTop: idx === 0 ? "none" : "1px solid #0b1220",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#f8fafc" }}>
                        {t.title} <span style={{ opacity: 0.7, fontWeight: 500 }}>— {t.artist}</span>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {(t.tags ?? []).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            title="Add filter"
                            style={{
                              borderRadius: 999,
                              border: "1px solid #475569",
                              background: "transparent",
                              color: "#cbd5f5",
                              padding: "6px 10px",
                              cursor: "pointer",
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: "#93c5fd",
                          textDecoration: "none",
                          border: "1px solid #334155",
                          borderRadius: 10,
                          padding: "8px 10px",
                        }}
                        title="Open the MP3 URL"
                      >
                        Open
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}