"use client";

import Link from "next/link";

type HomeInfoCard = {
  title: string;
  appHref: string | null;
  infoHref: string;
  summary: string;
  status: "Working now" | "Building now" | "Planned";
};

const CURRENT_SYSTEMS: HomeInfoCard[] = [
  {
    title: "Projects",
    appHref: "/workspace/projects",
    infoHref: "/about/projects",
    summary:
      "Create, open, and organize music projects while the app grows around the project workspace.",
    status: "Working now",
  },
  {
    title: "Metadata System",
    appHref: "/metadata",
    infoHref: "/about/metadata",
    summary:
      "Build a structured music knowledge library with shelves, sections, records, and relationships.",
    status: "Building now",
  },
  {
    title: "Track Matcher",
    appHref: "/tools/track-matcher",
    infoHref: "/about/track-matcher",
    summary:
      "Match BPM, explore key relationships, and analyze how tracks change over time using timeline-based intelligence.",
    status: "Working now",
  },
  {
    title: "Find It System",
    appHref: null,
    infoHref: "/about/find-it",
    summary:
      "Search for where things live in the app, see target paths, and avoid getting lost.",
    status: "Building now",
  },
  {
    title: "Global Player",
    appHref: "/listen",
    infoHref: "/about/global-player",
    summary:
      "Keep music playback visible while moving through projects, metadata, and future tools.",
    status: "Working now",
  },
];

const PLANNED_SYSTEMS: HomeInfoCard[] = [
  {
    title: "AI Music Generator",
    appHref: null,
    infoHref: "/about/ai-music-generator",
    summary:
      "Future prompt-based music creation with pronunciation planning, tags, timing, and regeneration loops.",
    status: "Planned",
  },
  {
    title: "Site Tree / Roadmap",
    appHref: null,
    infoHref: "/about/site-tree",
    summary:
      "A built-in manual showing what is done, what is being built, and what still needs to exist.",
    status: "Building now",
  },
];

function HomeInfoCardView({ card }: { card: HomeInfoCard }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {card.appHref ? (
            <Link
              href={card.appHref}
              className="text-lg font-semibold text-white underline-offset-4 hover:underline"
            >
              {card.title}
            </Link>
          ) : (
            <p className="text-lg font-semibold text-white/85">{card.title}</p>
          )}

          <p className="mt-1 text-sm text-white/60">{card.summary}</p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {card.status}
        </span>
      </div>

      <div className="mt-4">
        <Link
          href={card.infoHref}
          className="inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          More Info
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black px-6 py-10 text-white">
      <main className="mx-auto w-full max-w-6xl">
        <h1 className="text-4xl font-bold">The Muzes Garden</h1>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {CURRENT_SYSTEMS.map((card) => (
            <HomeInfoCardView key={card.title} card={card} />
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {PLANNED_SYSTEMS.map((card) => (
            <HomeInfoCardView key={card.title} card={card} />
          ))}
        </div>
      </main>
    </div>
  );
}