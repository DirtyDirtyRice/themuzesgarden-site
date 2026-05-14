"use client";

import Link from "next/link";

export default function TrackMatcherDetailsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-4xl">

        {/* TOP NAV */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Track Matcher — Details
          </h1>

          <Link
            href="/tools/track-matcher"
            className="text-sm text-white/60 hover:text-white"
          >
            ← Back to Track Matcher
          </Link>
        </div>

        {/* INTRO */}
        <p className="mt-6 text-sm text-white/70">
          Learn how syncing, BPM, and controls work in the Track Matcher.
        </p>

        {/* BPM SECTION */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">BPM (Tempo)</h2>
          <p className="mt-2 text-sm text-white/70">
            Changing BPM affects playback speed in real time. You can move the slider
            while audio is playing to hear the tempo shift immediately.
          </p>
        </div>

        {/* KEY SECTION */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Key</h2>
          <p className="mt-2 text-sm text-white/70">
            Key controls are currently visual only. They show intended pitch direction,
            but do not yet change the actual audio.
          </p>
        </div>

        {/* AUTO SYNC */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Auto Sync</h2>
          <p className="mt-2 text-sm text-white/70">
            Auto Sync adjusts Track B toward Track A's tempo to help align them quickly.
          </p>
        </div>

        {/* SYNC STRENGTH */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Sync Strength</h2>
          <p className="mt-2 text-sm text-white/70">
            Sync Strength controls how aggressively Track B moves toward Track A.
            Lower values are subtle, higher values are more forceful.
          </p>
        </div>

        {/* NUDGE */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Nudge</h2>
          <p className="mt-2 text-sm text-white/70">
            Nudge lets you push Track B slightly forward or backward in time to tighten alignment.
          </p>
        </div>

        {/* SIMPLE HOW TO */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Quick How-To</h2>
          <ol className="mt-2 list-decimal pl-5 text-sm text-white/70 space-y-2">
            <li>Load Track A and Track B</li>
            <li>Press Play Both</li>
            <li>Adjust BPM to match tempos</li>
            <li>Use Auto Sync if needed</li>
            <li>Fine-tune with Nudge</li>
          </ol>
        </div>

      </div>
    </main>
  );
}