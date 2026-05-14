import Link from "next/link";

const TIMELINE_EVENTS = [
  {
    time: "0:00",
    bpm: "120 BPM",
    key: "C minor",
    event: "Opening groove",
    note: "Stable intro pulse with dark minor-center feel.",
  },
  {
    time: "0:30",
    bpm: "124 BPM",
    key: "C minor",
    event: "Tempo lift",
    note: "Small push forward while the key center stays locked.",
  },
  {
    time: "1:10",
    bpm: "124 BPM",
    key: "D# major",
    event: "Key color shift",
    note: "Harmony brightens while the tempo stays steady.",
  },
  {
    time: "1:45",
    bpm: "112 BPM",
    key: "D# major",
    event: "Tempo drop + rhythmic shift",
    note: "Energy pulls back and the rhythmic feel changes.",
  },
];

const FUTURE_LAYERS = [
  "Real BPM detection",
  "Real key detection",
  "Drum and bass stem tracking",
  "AI explanation cards",
  "Training game prompts",
];

export default function TrackMatcherAnalyzePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-2xl border border-white/15 bg-black p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                Track Matcher Advanced
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
                Analyze Timeline
              </h1>
            </div>

            <Link
              href="/tools/track-matcher/advanced"
              className="rounded-full border border-white/25 bg-black px-4 py-2 text-sm font-bold text-white hover:border-white/60"
            >
              Return to Advanced
            </Link>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/80">
            This page uses fake timeline data only. The goal is to build the
            intelligence map first, so real audio analysis can plug into this
            structure later without redesigning the page.
          </p>
        </header>

        <section className="rounded-2xl border border-white/15 bg-black p-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">
              Timeline map
            </p>
            <h2 className="text-2xl font-black text-white">
              Tempo + key movement
            </h2>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {TIMELINE_EVENTS.map((item, index) => (
              <article
                key={`${item.time}-${item.event}`}
                className="grid gap-4 rounded-2xl border border-white/15 bg-black p-4 md:grid-cols-[120px_1fr]"
              >
                <div className="flex md:flex-col md:items-start">
                  <span className="rounded-full border border-white/25 bg-black px-4 py-2 text-sm font-black text-white">
                    {item.time}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-bold text-white/85">
                      {item.bpm}
                    </span>
                    <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-bold text-white/85">
                      {item.key}
                    </span>
                    <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-bold text-white/70">
                      Map point {index + 1}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-white">
                    {item.event}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    {item.note}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">
              Intelligence summary
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Fake analysis result
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              The track begins steady, pushes slightly faster, brightens with a
              key-color change, then drops tempo while the rhythm shifts. Later,
              this summary can be generated from real detection data.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">
              Future layers
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FUTURE_LAYERS.map((layer) => (
                <div
                  key={layer}
                  className="rounded-xl border border-white/15 bg-black p-4 text-sm font-bold text-white/80"
                >
                  {layer}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}