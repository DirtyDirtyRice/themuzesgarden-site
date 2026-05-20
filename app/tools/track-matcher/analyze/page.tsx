import Link from "next/link";

type AnalyzeFeatureCard = {
  title: string;
  status: "Ready" | "Next" | "Later";
  description: string;
};

const FEATURE_CARDS: AnalyzeFeatureCard[] = [
  {
    title: "Analyze Shell",
    status: "Ready",
    description:
      "This page is now the safe foundation for rebuilding analysis without importing missing engines.",
  },
  {
    title: "Analyze Controller",
    status: "Ready",
    description:
      "The controller shell now exists and uses local state only, so it does not depend on broken Analyze contracts.",
  },
  {
    title: "Playback Bridge",
    status: "Next",
    description:
      "The next layer will connect this page back to the current green Track Matcher playback state.",
  },
  {
    title: "Waveform Map",
    status: "Later",
    description:
      "Waveform display returns after the shell and controller are stable.",
  },
  {
    title: "Beat Grid",
    status: "Later",
    description:
      "Beat-grid logic comes after real source files exist, so we do not invent types again.",
  },
  {
    title: "Mix Suggestions",
    status: "Later",
    description:
      "Mix points and transition scoring will be rebuilt only after the analyze data contract is real.",
  },
  {
    title: "Aural Training",
    status: "Later",
    description:
      "Game and listening prompts come back after the analysis foundation is green.",
  },
];

function getStatusClass(status: AnalyzeFeatureCard["status"]) {
  if (status === "Ready") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "Next") {
    return "border-sky-300/30 bg-sky-300/10 text-sky-100";
  }

  return "border-white/10 bg-white/5 text-white/65";
}

export default function TrackMatcherAnalyzePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
              Track Matcher
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              Analyze
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
              This is the clean rebuild point for the Analyze system. We are
              starting with a stable shell first, then adding one verified layer
              at a time so missing types and guessed contracts do not come back.
            </p>
          </div>

          <Link
            href="/tools/track-matcher"
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
          >
            Return to Track Matcher
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Current rebuild rule
          </p>

          <h2 className="mt-3 text-2xl font-black text-white">
            Green first. Contracts second. Features third.
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/65">
            This page intentionally keeps analysis engine imports out of the
            route. The controller shell is paused while Pro Pitch DSP is being
            built, so this page stays green without importing unfinished Analyze
            files.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getStatusClass(
                  card.status,
                )}`}
              >
                {card.status}
              </div>

              <h3 className="mt-4 text-lg font-black text-white">
                {card.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/60">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-black p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Next safe layer
          </p>

          <h2 className="mt-3 text-xl font-black text-white">
            Build Pro Pitch DSP first.
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/65">
            Analyze is now safely paused. The next file should be the Track
            Matcher audio engine, so real Pro Pitch DSP can move forward without
            pulling unfinished Analyze contracts back into the build.
          </p>
        </section>
      </div>
    </main>
  );
}