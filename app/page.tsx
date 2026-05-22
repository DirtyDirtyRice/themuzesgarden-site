"use client";

import Link from "next/link";

type HomeInfoCardStatus = "Working now" | "Building now" | "Planned";

type HomeInfoCard = {
  title: string;
  eyebrow: string;
  appHref: string | null;
  infoHref: string;
  summary: string;
  status: HomeInfoCardStatus;
  primaryActionLabel: string;
};

const buttonBase =
  "inline-flex min-w-[152px] items-center justify-center rounded-2xl border border-white/25 bg-black px-4 py-2 text-sm font-black text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const buttonDisabled =
  "inline-flex min-w-[152px] items-center justify-center rounded-2xl border border-white/25 bg-black px-4 py-2 text-sm font-black text-white/70";

const statusBase =
  "rounded-full border border-white/25 bg-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white";

const CURRENT_SYSTEMS: HomeInfoCard[] = [
  {
    title: "Projects",
    eyebrow: "Workspace",
    appHref: "/workspace/projects",
    infoHref: "/about/projects",
    summary:
      "Create, open, download, and organize music projects while the app grows around the project workspace.",
    status: "Working now",
    primaryActionLabel: "Open Projects",
  },
  {
    title: "Metadata System",
    eyebrow: "Knowledge Library",
    appHref: "/metadata",
    infoHref: "/about/metadata",
    summary:
      "Build a structured music knowledge library with shelves, sections, records, and relationships.",
    status: "Building now",
    primaryActionLabel: "Open Metadata",
  },
  {
    title: "Track Matcher",
    eyebrow: "Audio Tools",
    appHref: "/tools/track-matcher",
    infoHref: "/about/track-matcher",
    summary:
      "Match BPM, explore key relationships, and analyze how tracks change over time using timeline-based intelligence.",
    status: "Working now",
    primaryActionLabel: "Open Track Matcher",
  },
  {
    title: "Find It System",
    eyebrow: "Navigation Help",
    appHref: null,
    infoHref: "/about/find-it",
    summary:
      "Search for where things live in the app, see target paths, and avoid getting lost.",
    status: "Building now",
    primaryActionLabel: "Coming Soon",
  },
  {
    title: "Global Player",
    eyebrow: "Playback",
    appHref: "/listen",
    infoHref: "/about/global-player",
    summary:
      "Keep music playback visible while moving through projects, metadata, and future tools.",
    status: "Working now",
    primaryActionLabel: "Open Player",
  },
];

const PLANNED_SYSTEMS: HomeInfoCard[] = [
  {
    title: "AI Music Generator",
    eyebrow: "Future Studio",
    appHref: null,
    infoHref: "/about/ai-music-generator",
    summary:
      "Future prompt-based music creation with pronunciation planning, tags, timing, and regeneration loops.",
    status: "Planned",
    primaryActionLabel: "Planned",
  },
  {
    title: "Site Tree / Roadmap",
    eyebrow: "App Manual",
    appHref: null,
    infoHref: "/about/site-tree",
    summary:
      "A built-in manual showing what is done, what is being built, and what still needs to exist.",
    status: "Building now",
    primaryActionLabel: "Coming Soon",
  },
];

const QUICK_LINKS = [
  { label: "Projects", href: "/workspace/projects" },
  { label: "Library", href: "/library" },
  { label: "Listen", href: "/listen" },
  { label: "Upload", href: "/upload" },
  { label: "Track Matcher", href: "/tools/track-matcher" },
  { label: "Metadata", href: "/metadata" },
];

function HomeInfoCardView({ card }: { card: HomeInfoCard }) {
  return (
    <article className="flex min-h-[230px] flex-col justify-between rounded-3xl border border-white/25 bg-black p-5 shadow-2xl shadow-black/30">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
              {card.eyebrow}
            </p>

            {card.appHref ? (
              <Link
                href={card.appHref}
                className="mt-2 inline-flex text-2xl font-black tracking-tight text-white underline-offset-4 hover:scale-[1.01]"
              >
                {card.title}
              </Link>
            ) : (
              <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                {card.title}
              </h3>
            )}
          </div>

          <span className={statusBase}>{card.status}</span>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
          {card.summary}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {card.appHref ? (
          <Link href={card.appHref} className={buttonBase}>
            {card.primaryActionLabel}
          </Link>
        ) : (
          <span className={buttonDisabled}>{card.primaryActionLabel}</span>
        )}

        <Link href={card.infoHref} className={buttonBase}>
          More Info
        </Link>
      </div>
    </article>
  );
}

function QuickLinkBar() {
  return (
    <nav className="mt-8 flex flex-wrap gap-2 rounded-3xl border border-white/25 bg-black p-3 shadow-2xl shadow-black/25">
      {QUICK_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={buttonBase}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto flex w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <section className="rounded-[2rem] border border-white/25 bg-black p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-white/70">
                The Muzes Garden
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Music workspace, knowledge library, and audio tools.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
                Open the working systems, check what is being built, and jump
                straight into the pages that matter without digging through the
                folder tree.
              </p>
            </div>

            <Link href="/workspace/projects" className={buttonBase}>
              Open Projects
            </Link>
          </div>

          <QuickLinkBar />
        </section>

        <section className="mt-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              Working / Building
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Current Systems
            </h2>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {CURRENT_SYSTEMS.map((card) => (
              <HomeInfoCardView key={card.title} card={card} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              Roadmap
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Planned Systems
            </h2>
          </div>

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
