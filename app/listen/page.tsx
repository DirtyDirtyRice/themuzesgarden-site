"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TRACKS_SEED } from "../../lib/tracksSeed";

type Track = {
  id: string;
  title: string;
  url: string;
  artist?: string;
  tags?: string[];
};

function Nav() {
  const baseBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid #475569",
    background: "#020617",
    color: "#e5e7eb",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 13,
  };

  const activeBtn: React.CSSProperties = {
    ...baseBtn,
    background: "#1e293b",
    border: "1px solid #93c5fd",
    color: "#f8fafc",
  };

  return (
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Link href="/" style={baseBtn}>
        Player
      </Link>
      <Link href="/library" style={baseBtn}>
        Library
      </Link>
      <span style={activeBtn}>Listen</span>
    </nav>
  );
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function uniqueTagsFromTracks(tracks: Track[]): string[] {
  const set = new Set<string>();
  for (const t of tracks) for (const tag of t.tags ?? []) set.add(tag);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function ListenPage() {
  const tracks = useMemo<Track[]>(() => (TRACKS_SEED as Track[]) ?? [], []);
  const allTags = useMemo(() => uniqueTagsFromTracks(tracks), [tracks]);

  // --- Player ---
  const [selectedId, setSelectedId] = useState<string | null>(tracks[0]?.id ?? null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Library filters ---
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

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

  const selectedTrack = useMemo(() => {
    const inFiltered = filteredTracks.find((t) => t.id === selectedId);
    if (inFiltered) return inFiltered;
    return filteredTracks[0] ?? tracks[0] ?? null;
  }, [filteredTracks, selectedId, tracks]);

  useEffect(() => {
    if (!selectedTrack) return;
    if (selectedId !== selectedTrack.id) setSelectedId(selectedTrack.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack?.id]);

  function loadAndPlay() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.load();
    el.play().catch(() => {});
  }

  function selectTrackById(id: string) {
    setSelectedId(id);
    setTimeout(() => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      el.load();
    }, 0);
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

  function clearTags() {
    setSelectedTags([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function openDropdown() {
    setIsOpen(true);
  }
  function closeDropdown() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) closeDropdown();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

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
      <div style={{ maxWidth: 1100, margin: "0 auto" }} ref={containerRef}>
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#f8fafc" }}>Listen</h1>
            <p style={{ margin: "6px 0 0", color: "#cbd5f5" }}>
              Player + Library unified (filter tags, then play).
            </p>
            <div style={{ marginTop: 12 }}>
              <Nav />
            </div>
          </div>

          <button
            type="button"
            onClick={clearTags}
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

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
          {/* LEFT: Library */}
          <section>
            {/* Selected tags */}
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
                placeholder="Search tags… (↑ ↓ Enter)"
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

            {/* Track list */}
            <div style={{ marginTop: 18 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 18, color: "#f8fafc" }}>
                Tracks{" "}
                <span style={{ opacity: 0.7, fontWeight: 500 }}>({filteredTracks.length})</span>
              </h2>

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
                    {filteredTracks.map((t, idx) => {
                      const isSelected = t.id === selectedTrack?.id;
                      return (
                        <li
                          key={t.id}
                          style={{
                            padding: 14,
                            borderTop: idx === 0 ? "none" : "1px solid #0b1220",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            background: isSelected ? "#0b1220" : "transparent",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={() => selectTrackById(t.id)}
                              style={{
                                display: "block",
                                textAlign: "left",
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                color: "#f8fafc",
                                cursor: "pointer",
                                width: "100%",
                              }}
                              title="Load into player"
                            >
                              <div style={{ fontWeight: 800, color: "#f8fafc" }}>
                                {t.title}
                                {t.artist ? (
                                  <span style={{ opacity: 0.7, fontWeight: 500 }}> — {t.artist}</span>
                                ) : null}
                              </div>
                              <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 6 }}>
                                Click to load
                              </div>
                            </button>

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

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: Player */}
          <section
            style={{
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              height: "fit-content",
              position: "sticky",
              top: 18,
            }}
          >
            <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 8 }}>Player</div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedTrack?.id ?? ""}
                size={1}
                onChange={(e) => selectTrackById(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  background: "#020617",
                  color: "#f8fafc",
                  border: "1px solid #475569",
                  borderRadius: 10,
                  padding: "8px 12px",
                }}
              >
                {filteredTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              <button
                onClick={loadAndPlay}
                disabled={!selectedTrack}
                style={{
                  width: "100%",
                  background: selectedTrack ? "#3b82f6" : "#0b1220",
                  color: selectedTrack ? "white" : "#64748b",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: selectedTrack ? "pointer" : "not-allowed",
                }}
              >
                Play
              </button>

              <div style={{ fontSize: 12, color: "#cbd5f5" }}>
                Selected:{" "}
                <strong style={{ color: "#f8fafc" }}>{selectedTrack?.title ?? "None"}</strong>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <audio ref={audioRef} controls preload="none" style={{ width: "100%" }}>
                <source src={selectedTrack?.url ?? ""} />
              </audio>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
              Tip: filter on the left, click a track to load, then hit Play.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}