"use client";

import Link from "next/link";

const START_HERE = [
  {
    title: "Open Find It",
    text: "Use the Find It button in the title bar when you are not sure where something lives.",
  },
  {
    title: "Type normal words",
    text: "Search for ideas like metadata, projects, C Major, relationships, generator, or player.",
  },
  {
    title: "Read before moving",
    text: "Find It shows the selected destination and target path before you navigate.",
  },
];

const FIND_IT_LAYERS = [
  {
    title: "Navigation",
    text: "Find It searches the app structure so users can locate pages and systems.",
  },
  {
    title: "Metadata",
    text: "Find It searches metadata records so knowledge pages can appear beside normal routes.",
  },
  {
    title: "Relationships",
    text: "Find It can surface related ideas so search becomes guidance, not just a result list.",
  },
  {
    title: "Target Path",
    text: "Find It explains how to move from the current page to the selected destination.",
  },
];

const WHY_IT_MATTERS = [
  "The app is growing too deep for memory-only navigation.",
  "Users should not need to know exact route names.",
  "Search should explain why something matched.",
  "Find It should help users understand the app instead of just jumping around it.",
];

const RELATED_LINKS = [
  {
    label: "Manual Home",
    href: "/about",
    note: "Return to the manual index.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See the knowledge layer Find It searches.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See where project work will connect to Find It.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See the roadmap for app navigation.",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            ← Home
          </Link>
          <Link
            href="/about"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            Manual
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Core Guidance System
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Find It System
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            Find It is the app guide. It helps users search for a page, record,
            system, or idea, then shows the safest path before moving.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Find It v1 is built. It searches navigation, metadata records, and
              relationships, then shows ranked results and target-path guidance.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Start Here
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            How to use Find It
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

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Main Layers
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Search → Explain → Guide → Navigate
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {FIND_IT_LAYERS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/66">
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
            Find It makes the app easier to understand
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
            Where Find It connects
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