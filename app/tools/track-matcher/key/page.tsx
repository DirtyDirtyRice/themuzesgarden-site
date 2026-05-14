"use client";

import Link from "next/link";
import { useState } from "react";

const ROOT_NOTES = ["A", "A#", "Bb", "B", "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab"];

const MODE_TYPES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];

export default function TrackMatcherKeyPage() {
  const [rootNote, setRootNote] = useState("C");
  const [majorMinor, setMajorMinor] = useState<"major" | "minor">("major");
  const [modeType, setModeType] = useState("Ionian");

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Choose Key</h1>

            <p className="mt-2 max-w-2xl text-base leading-7 text-white">
              Choose a root note, major or minor, and a modal color. This prepares the key system.
            </p>

            <p className="mt-1 max-w-2xl text-base leading-7 text-white/80">
              For now, key selection is visual only until real pitch shifting is added.
            </p>
          </div>

          <Link
            href="/tools/track-matcher"
            className="rounded border border-white/20 bg-white px-4 py-2 font-bold !text-black"
          >
            ← Back to Track Matcher
          </Link>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-white">Root Note</span>
              <select
                value={rootNote}
                onChange={(event) => setRootNote(event.target.value)}
                className="rounded border border-white/20 bg-black px-3 py-2 text-white"
              >
                {ROOT_NOTES.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-bold text-white">Major / Minor</legend>

              <label className="flex items-center gap-2 text-white">
                <input
                  type="radio"
                  name="majorMinor"
                  checked={majorMinor === "major"}
                  onChange={() => setMajorMinor("major")}
                />
                Major
              </label>

              <label className="flex items-center gap-2 text-white">
                <input
                  type="radio"
                  name="majorMinor"
                  checked={majorMinor === "minor"}
                  onChange={() => setMajorMinor("minor")}
                />
                Minor
              </label>
            </fieldset>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-white">Mode Type</span>
              <select
                value={modeType}
                onChange={(event) => setModeType(event.target.value)}
                className="rounded border border-white/20 bg-black px-3 py-2 text-white"
              >
                {MODE_TYPES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold text-white">Current Visual Selection</h2>

          <p className="mt-3 text-lg text-white">
            {rootNote} {majorMinor} — {modeType}
          </p>

          <p className="mt-3 text-sm leading-6 text-white/80">
            This does not change audio yet. The next phase is real pitch shifting, where the chosen key can affect
            how Track A or Track B is transformed.
          </p>
        </section>
      </div>
    </main>
  );
}