"use client";

import Link from "next/link";

type HomeInfoCard = {
  title: string;
  appHref: string | null;
  infoHref: string;
  summary: string;
  status: "Working now" | "Building now" | "Planned";
  whyItMatters: string;
};

const CURRENT_SYSTEMS: HomeInfoCard[] = [
  {
    title: "Projects",
    appHref: "/workspace/projects",
    infoHref: "/about/projects",
    summary:
      "Create, open, and organize music projects while the app grows around the project workspace.",
    status: "Working now",
    whyItMatters:
      "Projects are the containers that will connect songs, notes, versions, metadata, playback, and future AI generation history.",
  },
  {
    title: "Metadata System",
    appHref: "/metadata",
    infoHref: "/about/metadata",
    summary:
      "Build a structured music knowledge library with shelves, sections, records, and relationships.",
    status: "Building now",
    whyItMatters:
      "Metadata gives the app memory and meaning so sounds, songs, prompts, and project notes can be searched and connected.",
  },
  {
    title: "Find It System",
    appHref: null,
    infoHref: "/about/find-it",
    summary:
      "Search for where things live in the app, see target paths, and avoid getting lost.",
    status: "Building now",
    whyItMatters:
      "Find It is the navigation safety layer for a deep app with pages, records, relationship paths, and manual explanations.",
  },
  {
    title: "Global Player",
    appHref: "/listen",
    infoHref: "/about/global-player",
    summary:
      "Keep music playback visible while moving through projects, metadata, and future tools.",
    status: "Working now",
    whyItMatters:
      "The player keeps sound connected to the rest of the system instead of trapping listening inside one page.",
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
    whyItMatters:
      "The future generator should become a controlled creation workstation, not a random prompt toy.",
  },
  {
    title: "Site Tree / Roadmap",
    appHref: null,
    infoHref: "/about/site-tree",
    summary:
      "A built-in manual showing what is done, what is being built, and what still needs to exist.",
    status: "Building now",
    whyItMatters:
      "The roadmap keeps the app understandable as the system grows into pages within pages.",
  },
];

const HOME_PROMISES = [
  "A music workspace that keeps projects, playback, metadata, and explanations connected.",
  "A manual system that grows like an in-app encyclopedia instead of a single help page.",
  "A future AI music system designed around controlled generation, pronunciation checks, and reusable memory.",
];

function getStatusClass(status: HomeInfoCard["status"]) {
  if (status === "Working now") {
    return "border-emerald-100/20 bg-emerald-300/[0.06] text-emerald-50/80";
  }

  if (status === "Building now") {
    return "border-amber-100/20 bg-amber-300/[0.06] text-amber-50/80";
  }

  return "border-white/15 bg-white/[0.04] text-white/55";
}

function HomeInfoCardView({ card }: { card: HomeInfoCard }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {card.appHref ? (
            <Link
              href={card.appHref}
              className="text-xl font-semibold text-white underline-offset-4 transition hover:text-white/75 hover:underline"
            >
              {card.title}
            </Link>
          ) : (
            <p className="text-xl font-semibold text-white/85">{card.title}</p>
          )}

          <p className="mt-2 text-sm leading-6 text-white/60">
            {card.summary}
          </p>
        </div>

        <span
          className={[
            "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
            getStatusClass(card.status),
          ].join(" ")}
        >
          {card.status}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
          Why it matters
        </p>

        <p className="mt-1 text-sm leading-6 text-white/55">
          {card.whyItMatters}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.appHref ? (
          <Link
            href={card.appHref}
            className="inline-flex rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
          >
            Open Section
          </Link>
        ) : null}

        <Link
          href={card.infoHref}
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
          style={{ backgroundColor: "#ffffff", color: "#000000" }}
        >
          More Info
        </Link>
      </div>
    </article>
  );
}

function SystemSection({
  title,
  body,
  cards,
}: {
  title: string;
  body: string;
  cards: HomeInfoCard[];
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            {title}
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            {body}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {cards.length} cards
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <HomeInfoCardView key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black px-6 py-10 text-white">
      <main className="mx-auto w-full max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
            Home
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            The Muzes Garden
          </h1>

          <p className="mt-4 max-w-4xl text-lg leading-8 text-white/72">
            A growing system for music creation, organization, metadata,
            navigation help, and AI-assisted sound exploration. The goal is a
            garden of connected tools where songs, lyrics, sounds, projects,
            notes, relationships, and future AI generation can all explain each
            other.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="rounded-lg border border-white/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
              style={{ backgroundColor: "#ffffff", color: "#000000" }}
            >
              Open Manual
            </Link>

            <Link
              href="/about/site-tree"
              className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
            >
              View Site Tree
            </Link>

            <Link
              href="/workspace/projects"
              className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
            >
              Open Projects
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5">
          <p className="text-sm font-semibold text-amber-200">
            🚧 Under Construction
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-100/80">
            Core systems are functional, but many pages are still being shaped.
            This home page is the front door. The More Info pages are the start
            of the built-in manual that will eventually explain the whole app
            like a living book.
          </p>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {HOME_PROMISES.map((promise) => (
            <div
              key={promise}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
            >
              <p className="text-sm leading-6 text-white/62">{promise}</p>
            </div>
          ))}
        </section>

        <SystemSection
          title="Current Systems"
          body="Click Open Section for the working app page when one exists. Click More Info for the manual page."
          cards={CURRENT_SYSTEMS}
        />

        <SystemSection
          title="Planned Systems"
          body="These systems are planned or partially started and will keep expanding as the architecture grows."
          cards={PLANNED_SYSTEMS}
        />
      </main>
    </div>
  );
}