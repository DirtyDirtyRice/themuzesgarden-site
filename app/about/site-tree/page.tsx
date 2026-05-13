"use client";

import Link from "next/link";

const START_HERE = [
  {
    title: "Use this as your map",
    text: "This page shows what is done, what is being built, and what is still coming.",
  },
  {
    title: "Understand before navigating",
    text: "Instead of guessing where something is, use this page to see how the app is structured.",
  },
  {
    title: "Follow system connections",
    text: "Use related pages and Find It to move through the app using the structure shown here.",
  },
];

const ROADMAP_GROUPS = [
  {
    label: "Done",
    summary: "Stable pieces that are already in place.",
    items: [
      "Home page exists and no longer redirects to Projects.",
      "TitleBar Home and Project routes are fixed.",
      "Find It opens cleanly with Clear / Reset behavior.",
      "Find It highlights results and shows selected/top result clarity.",
      "Metadata seed records exist.",
      "Metadata results are starting to appear inside Find It.",
      "Manual pages exist for the major systems.",
    ],
  },
  {
    label: "Doing",
    summary: "Current active structure work.",
    items: [
      "Build the in-app manual / encyclopedia.",
      "Connect metadata records deeper into Find It.",
      "Separate app-section links from More Info explanation pages.",
      "Keep files split before they grow too large.",
      "Keep manual pages green while improving their structure.",
    ],
  },
  {
    label: "Still To Do",
    summary: "Larger future systems and deeper app behavior.",
    items: [
      "Create deeper child manual pages for important words and features.",
      "Add relationship-aware metadata search.",
      "Improve project pages and connect projects to metadata.",
      "Build the future AI music generator architecture.",
      "Create a full navigation tree view that users can browse visually.",
      "Connect the tree view to Find It target paths.",
    ],
  },
];

const FUTURE_TREE_PATHS = [
  {
    path: "Home → Manual → Metadata System",
    purpose: "Learn what the metadata system means.",
  },
  {
    path: "Home → Metadata → Library → Record → Relationships",
    purpose: "Move from the library into a specific knowledge record.",
  },
  {
    path: "Home → Projects → Project Detail → Audio → Metadata",
    purpose: "Move from a project sound into its explanation layer.",
  },
  {
    path: "Home → Find It → Target Path → Destination",
    purpose: "Search for a goal and follow the visible route.",
  },
];

const RELATED_LINKS = [
  {
    label: "Manual Home",
    href: "/about",
    note: "Return to the manual index.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how the tree should help users navigate.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See the knowledge structure the tree must explain.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See the project workspace the roadmap connects to.",
  },
  {
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See the future creation system on the roadmap.",
  },
];

export default function SiteTreePage() {
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

        {/* HERO */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            App Map
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Site Tree / Roadmap
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            This page is the plain map for where The Muzes Garden is now, what
            is being built, and what still needs to happen.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Working as a roadmap page. Future versions should connect this
              structure directly to Find It and visible navigation paths.
            </p>
          </div>
        </section>

        {/* START HERE */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Start Here
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Use this page as your map
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

        {/* ROADMAP */}
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {ROADMAP_GROUPS.map((group) => (
            <article
              key={group.label}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Roadmap
              </p>

              <h2 className="mt-2 text-2xl font-semibold">{group.label}</h2>

              <p className="mt-3 text-sm leading-6 text-white/60">
                {group.summary}
              </p>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-white/68">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-white/10 bg-black/35 p-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        {/* FUTURE TREE */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Future Tree Idea
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            The app should explain paths, not hide them
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {FUTURE_TREE_PATHS.map((item) => (
              <div
                key={item.path}
                className="rounded-2xl border border-white/10 bg-black/35 p-4"
              >
                <p className="text-sm font-semibold text-white">{item.path}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {item.purpose}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RELATED */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Related Pages
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Where the roadmap connects
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