"use client";

import Link from "next/link";

const START_HERE = [
  {
    title: "Play something first",
    text: "Start with audio. The player is meant to keep the sound present while you move through the app.",
  },
  {
    title: "Keep exploring",
    text: "Move through Projects, Metadata, Manual pages, and Find It without losing listening context.",
  },
  {
    title: "Connect the sound later",
    text: "Future player tools should connect tracks to tags, notes, lyrics, stems, projects, and metadata records.",
  },
];

const CURRENT_BEHAVIOR = [
  "The player stays visible while moving between pages.",
  "Playback continues when navigating through the app.",
  "The user can keep listening without reopening tracks.",
];

const FUTURE_BEHAVIOR = [
  "Show track details like title, tags, and description.",
  "Link the playing track to its project container.",
  "Connect the track to metadata records and relationships.",
  "Expose lyrics, stems, and prompt history.",
  "Allow jumping directly from sound to editing or explanation tools.",
];

const HOW_TO_USE = [
  {
    step: "Step 1",
    title: "Play a track",
    text: "Start playback from any page that has audio.",
  },
  {
    step: "Step 2",
    title: "Move through the app",
    text: "Navigate freely while the audio continues playing.",
  },
  {
    step: "Step 3",
    title: "Stay connected to the sound",
    text: "Use the player as your anchor while exploring projects, metadata, and tools.",
  },
];

const WHY_IT_MATTERS = [
  "Music work starts with listening, not menus.",
  "The player keeps context while the user moves through the app.",
  "It connects sound to explanation, not just playback.",
  "It prepares the app for deeper audio-driven workflows.",
];

const RELATED_LINKS = [
  {
    label: "Projects",
    href: "/about/projects",
    note: "See how playback connects to project containers.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See how tracks connect to knowledge records.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how navigation can help locate playing tracks.",
  },
  {
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See how generated audio will connect to the player.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See the full roadmap.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="text-sm font-semibold text-white/60 hover:text-white">
            ← Home
          </Link>
          <Link href="/about" className="text-sm font-semibold text-white/60 hover:text-white">
            Manual
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Core Listening System
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Global Player
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            The Global Player keeps music playing while the user moves through
            the app. It is the constant listening layer that connects sound to
            everything else.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Working now. Playback remains active while navigating through
              pages.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Start Here
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Begin with the sound
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {START_HERE.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <p className="font-semibold text-white">{item.title}</p>

                <p className="mt-2 text-sm leading-6 text-white/62">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              What It Does Now
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Current behavior
            </h2>

            <div className="mt-5 space-y-3">
              {CURRENT_BEHAVIOR.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/35 p-4"
                >
                  <p className="text-sm leading-6 text-white/68">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              What It Becomes
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Future behavior
            </h2>

            <div className="mt-5 space-y-3">
              {FUTURE_BEHAVIOR.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/35 p-4"
                >
                  <p className="text-sm leading-6 text-white/68">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            How To Use It
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Stay anchored to the sound
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {HOW_TO_USE.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                  {item.step}
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/65">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Why It Matters
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Listening drives everything else
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {WHY_IT_MATTERS.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <p className="text-sm leading-6 text-white/68">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Related Pages
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Where the player connects
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {RELATED_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/35 hover:bg-white/[0.06]"
              >
                <p className="text-lg font-semibold text-white">
                  {link.label}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/62">
                  {link.note}
                </p>

                <p className="mt-4 text-sm font-semibold text-white/75">
                  Open related manual page →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}