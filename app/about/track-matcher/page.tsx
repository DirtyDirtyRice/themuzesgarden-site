import Link from "next/link";

const TRACK_MATCHER_POINTS = [
  "Track A and Track B can be loaded for comparison.",
  "BPM control changes playback speed live.",
  "Key controls are visual only right now.",
  "Auto Sync and Nudge are early building blocks for future beat-grid syncing.",
  "Advanced opens the future timeline intelligence system.",
  "Analyze currently uses fake timeline data until real audio analysis is added.",
];

const FUTURE_PHASES = [
  "Phase 2: real BPM and key detection",
  "Phase 3: stems such as drums, bass, guitar, and vocals",
  "Phase 4: AI explanations for musical changes",
  "Phase 5: game and training tools for guessing tempo, key, and rhythm shifts",
];

export default function TrackMatcherInfoPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/"
          className="inline-flex rounded-md border border-white/30 bg-black px-3 py-2 text-sm font-semibold text-white hover:scale-[0.99] active:scale-[0.98]"
        >
          Return Home
        </Link>

        <section className="mt-8 rounded-2xl border border-white/15 bg-black p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/55">
            More Info
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Track Matcher
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            Track Matcher is the app section for comparing songs, matching
            tempo, exploring key relationships, and building toward deeper
            timeline-based music intelligence.
          </p>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-black p-5">
            <h2 className="text-2xl font-black text-white">Working now</h2>

            <div className="mt-4 flex flex-col gap-3">
              {TRACK_MATCHER_POINTS.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-white/15 bg-black p-4 text-sm leading-6 text-white/80"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black p-5">
            <h2 className="text-2xl font-black text-white">Future phases</h2>

            <div className="mt-4 flex flex-col gap-3">
              {FUTURE_PHASES.map((phase) => (
                <div
                  key={phase}
                  className="rounded-xl border border-white/15 bg-black p-4 text-sm leading-6 text-white/80"
                >
                  {phase}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/15 bg-black p-5">
          <h2 className="text-2xl font-black text-white">
            Advanced timeline idea
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/80">
            The advanced system is being built to show how a song changes over
            time. Instead of only saying one BPM or one key, it will eventually
            map moments like tempo changes, key changes, rhythm shifts, and
            energy changes across the song timeline.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/track-matcher"
              className="rounded-md border border-white/30 bg-black px-4 py-2 text-sm font-semibold text-white hover:scale-[0.99] active:scale-[0.98]"
            >
              Open Track Matcher
            </Link>

            <Link
              href="/tools/track-matcher/advanced"
              className="rounded-md border border-white/30 bg-black px-4 py-2 text-sm font-semibold text-white hover:scale-[0.99] active:scale-[0.98]"
            >
              Open Advanced
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}