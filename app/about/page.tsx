"use client";

import Link from "next/link";

const CORE_SYSTEMS = [
  {
    title: "Projects",
    href: "/about/projects",
    summary:
      "The containers for songs, generated audio, notes, metadata, and future creation work.",
    status: "Core workspace system",
  },
  {
    title: "Metadata System",
    href: "/about/metadata",
    summary:
      "The knowledge library built from shelves, sections, records, relationships, and deeper explanation pages.",
    status: "Core knowledge system",
  },
  {
    title: "Find It",
    href: "/about/find-it",
    summary:
      "The navigation helper that tells you where you are and how to reach what you need.",
    status: "Core guidance system",
  },
  {
    title: "Global Player",
    href: "/about/global-player",
    summary:
      "The app-wide playback layer that keeps music available while users move through the workspace.",
    status: "Core listening system",
  },
];

const FUTURE_SYSTEMS = [
  {
    title: "AI Music Generator",
    href: "/about/ai-music-generator",
    summary:
      "The planned generation system for prompts, pronunciation control, regeneration, and creative decision tracking.",
    status: "Future creation system",
  },
  {
    title: "Site Tree / Roadmap",
    href: "/about/site-tree",
    summary:
      "The done, doing, and still-to-do map for the full Muzes Garden structure.",
    status: "Future planning map",
  },
];

const WHY_IT_MATTERS = [
  "The app is becoming too deep for memory-only navigation.",
  "The manual explains each system in plain language.",
  "Find It turns that understanding into direct navigation.",
  "Metadata will become the meaning layer behind everything.",
];

function SystemCard({
  href,
  status,
  summary,
  title,
}: {
  href: string;
  status: string;
  summary: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/35 hover:bg-white/[0.06]"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
        {status}
      </p>

      <h3 className="mt-3 text-xl font-semibold text-white group-hover:text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-white/65">{summary}</p>

      <p className="mt-4 text-sm font-semibold text-white/80 group-hover:text-white">
        Open manual page →
      </p>
    </Link>
  );
}

export default function AboutHomePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-white/60 hover:text-white"
        >
          ← Back Home
        </Link>

        {/* NEW: FIND IT SHORTCUT */}
        <section className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-400/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200/70">
            Find It Shortcut
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Not sure where something is?
          </h2>

          <p className="mt-2 text-sm text-blue-100/80">
            Use Find It to search for what you need and get a step-by-step path
            to it.
          </p>

          <Link
            href="/find-it"
            className="mt-4 inline-block rounded-full border border-blue-300/40 px-4 py-2 text-sm font-semibold text-blue-100 hover:border-blue-200 hover:text-white"
          >
            Open Find It →
          </Link>
        </section>

        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
            Manual Index
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            The Muzes Garden Manual
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            This is the in-app book for The Muzes Garden. It explains the main
            systems, how they connect, and how to move through the app with
            confidence.
          </p>

          <div className="mt-6 grid gap-3 text-sm text-white/65 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="font-semibold text-white">Step 1</p>
              <p className="mt-2 leading-6">
                Start with the system you are trying to understand.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="font-semibold text-white">Step 2</p>
              <p className="mt-2 leading-6">
                Use links to move between connected systems.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="font-semibold text-white">Step 3</p>
              <p className="mt-2 leading-6">
                Use Find It to jump directly to what you need.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
                Core Systems
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                What the app depends on now
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/60">
              These are the systems you will use the most. Learn them once, then
              use Find It to move between them instantly.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {CORE_SYSTEMS.map((system) => (
              <SystemCard key={system.href} {...system} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
                Future Systems
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                What the app is being prepared for
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/60">
              These systems are being built next and will connect directly into
              the same navigation and metadata layers.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {FUTURE_SYSTEMS.map((system) => (
              <SystemCard key={system.href} {...system} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Why It Matters
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            The manual + Find It = full navigation system
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {WHY_IT_MATTERS.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <p className="text-sm leading-6 text-white/70">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-4">
            <p className="text-sm font-semibold text-white">
              Best next reading path
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link
                href="/about/metadata"
                className="rounded-full border border-white/10 px-3 py-2 text-white/70 hover:border-white/35 hover:text-white"
              >
                Metadata System
              </Link>
              <Link
                href="/about/find-it"
                className="rounded-full border border-white/10 px-3 py-2 text-white/70 hover:border-white/35 hover:text-white"
              >
                Find It
              </Link>
              <Link
                href="/about/site-tree"
                className="rounded-full border border-white/10 px-3 py-2 text-white/70 hover:border-white/35 hover:text-white"
              >
                Site Tree / Roadmap
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}