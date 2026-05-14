import Link from "next/link";

const ADVANCED_STEPS = [
  {
    label: "Track A source",
    detail: "Uses the same Track A idea from Track Matcher, but stays read-only on this page.",
  },
  {
    label: "Analyze",
    detail: "Opens the first timeline intelligence map with fake data for now.",
  },
  {
    label: "Future expansion",
    detail: "Real BPM, key, rhythm, stems, and AI explanations will attach here later.",
  },
];

export default function TrackMatcherAdvancedPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-black p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                Track Matcher
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
                Advanced
              </h1>
            </div>

            <Link
              href="/tools/track-matcher"
              className="rounded-full border border-white/25 bg-black px-4 py-2 text-sm font-bold text-white hover:border-white/60"
            >
              Return to Track Matcher
            </Link>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-white/80">
            This is the advanced workbench for deeper track intelligence. Phase 1
            does not analyze real audio yet. It sets up the page flow and the
            visual system that future audio analysis will connect to.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">
              Track A
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Loaded source track
            </h2>

            <div className="mt-5 rounded-2xl border border-white/15 bg-black p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    Track A audio source
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    Read-only placeholder. The working upload system stays on the
                    main Track Matcher page.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-bold text-white/80">
                  Read-only
                </span>
              </div>

              <div className="mt-5 h-20 rounded-xl border border-white/10 bg-black p-3">
                <div className="flex h-full items-end gap-1">
                  {Array.from({ length: 36 }).map((_, index) => (
                    <span
                      key={index}
                      className="block w-full rounded-t bg-white/70"
                      style={{
                        height: `${22 + ((index * 17) % 48)}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/tools/track-matcher/advanced/analyze"
              className="mt-5 inline-flex rounded-full border border-white bg-black px-5 py-3 text-sm font-black text-white hover:bg-white hover:text-black"
            >
              Analyze
            </Link>
          </div>

          <aside className="rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">
              Phase 1 map
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              What this unlocks
            </h2>

            <div className="mt-5 flex flex-col gap-3">
              {ADVANCED_STEPS.map((step, index) => (
                <div
                  key={step.label}
                  className="rounded-xl border border-white/15 bg-black p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-base font-black text-white">
                    {step.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}