"use client";

import { useMemo, useRef, useState } from "react";
import { TRACKS_SEED } from "../lib/tracksSeed";

export default function HomePage() {
  const tracks = useMemo(() => TRACKS_SEED ?? [], []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safeIndex =
    tracks.length === 0 ? 0 : Math.min(Math.max(selectedIndex, 0), tracks.length - 1);

  const selected = tracks[safeIndex];

  function loadAndPlay() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.load();
    el.play().catch(() => {});
  }

  function selectIndex(i: number) {
    setSelectedIndex(i);
    setTimeout(() => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      el.load();
    }, 0);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a, #020617)",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: 32,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 32, color: "#f8fafc" }}>
        The Muzes Garden
      </h1>

      <p style={{ margin: 0, color: "#cbd5f5" }}>
        Choose a track from the dropdown.
      </p>

      {/* DROPDOWN + PLAYER */}
      <div
        style={{
          width: "min(900px, 100%)",
          background: "#020617",
          border: "1px solid #334155",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 8 }}>
          Player
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={safeIndex}
            size={1}
            onChange={(e) => selectIndex(Number(e.target.value))}
            style={{
              minWidth: 420,
              height: 44,
              background: "#020617",
              color: "#f8fafc",
              border: "1px solid #475569",
              borderRadius: 10,
              padding: "8px 12px",
            }}
          >
            {tracks.map((track, index) => (
              <option key={track.id} value={index}>
                {track.title}
              </option>
            ))}
          </select>

          <button
            onClick={loadAndPlay}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Play
          </button>

          <div style={{ fontSize: 12, color: "#cbd5f5" }}>
            Selected: <strong style={{ color: "#f8fafc" }}>{selected.title}</strong>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <audio ref={audioRef} controls preload="none" style={{ width: "100%" }}>
            <source src={selected.url} />
          </audio>
        </div>
      </div>
    </main>
  );
}