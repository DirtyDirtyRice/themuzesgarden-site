"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

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
              className="text-lg font-semibold text-white underline-offset-4 transition hover:text-white/75 hover:underline"
            >
              {card.title}
            </Link>
          ) : (
            <p className="text-lg font-semibold text-white/85">{card.title}</p>
          )}

          <p className="mt-1 text-sm leading-6 text-white/60">
            {card.summary}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          {card.status}
        </span>
      </div>

      <div className="mt-4">
        <Button href={card.infoHref} variant="secondary">
          More Info (Manual Page)
        </Button>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black px-6 py-10 text-white">
      <main className="mx-auto w-full max-w-6xl">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
            Home
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            The Muzes Garden
          </h1>

          <p className="mt-3 max-w-4xl text-lg leading-8 text-white/70">
            A growing system for music creation, organization, metadata,
            navigation help, and AI-assisted sound exploration. The goal is not
            just a music app. The goal is a connected system where songs,
            lyrics, sounds, projects, notes, relationships, and future AI
            generation can explain each other.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
          <p className="text-sm font-semibold text-amber-200">
            🚧 Under Construction
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-100/80">
            Core systems are working, but still being shaped. Use the titles to
            enter working areas. Use “More Info” to read the manual pages that
            explain each system.
          </p>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Current Systems
              </p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Title = open the system.  
                More Info = learn what the system means.
              </p>
            </div>

            <Button href="/about" variant="secondary">
              Manual Home
            </Button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {CURRENT_SYSTEMS.map((card) => (
              <HomeInfoCardView key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Planned Systems
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {PLANNED_SYSTEMS.map((card) => (
              <HomeInfoCardView key={card.title} card={card} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}