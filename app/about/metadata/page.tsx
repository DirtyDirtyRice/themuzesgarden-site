"use client";

import Link from "next/link";

const METADATA_LEVELS = [
  {
    level: "Library",
    title: "The full knowledge system",
    text: "The Library is the whole metadata world. It holds every shelf, section, record, and relationship.",
  },
  {
    level: "Shelves",
    title: "Big subject areas",
    text: "Shelves group records by broad topics like music theory, production, lyrics, projects, instruments, genres, artists, and technical notes.",
  },
  {
    level: "Sections",
    title: "Smaller folders inside shelves",
    text: "Sections narrow the shelf down into useful areas like concepts, techniques, terms, tools, works, references, and notes.",
  },
  {
    level: "Records",
    title: "One clear thing at a time",
    text: "A record explains one idea, tool, song, lyric note, prompt detail, sound, or project item.",
  },
  {
    level: "Relationships",
    title: "How records connect",
    text: "Relationships show that one record belongs to, uses, references, influences, or connects to another record.",
  },
];

const WHY_IT_MATTERS = [
  "Metadata turns scattered music notes into a searchable knowledge system.",
  "Find It can use metadata records to help users reach the right page faster.",
  "Projects can connect songs, audio files, lyrics, prompts, and notes together.",
  "The future AI generator can use metadata as memory instead of guessing every time.",
];

const RELATED_LINKS = [
  {
    label: "Manual Home",
    href: "/about",
    note: "Return to the full manual index.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how navigation search connects to metadata records.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See where metadata can attach to songs, audio, and project work.",
  },
  {
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See the future system that can use metadata for better generation.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See where metadata fits in the larger app roadmap.",
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

        {/* HERO */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Core Knowledge System
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Metadata System
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            Metadata is the knowledge layer for The Muzes Garden. It is how the
            app remembers what a thing is, where it belongs, what it connects
            to, and why it matters.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Building now. The app has metadata types, seed records, library
              routes, record pages, relationship handling, and early Find It
              metadata search connections.
            </p>
          </div>
        </section>

        {/* START HERE */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Start Here
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Begin exploring metadata
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Link href="/metadata" className="rounded-2xl border border-white/10 bg-black/35 p-4 hover:border-white/30">
              <p className="font-semibold">Open Library</p>
              <p className="text-sm text-white/60 mt-2">Browse all metadata records</p>
            </Link>

            <Link href="/metadata/shelf/music_theory" className="rounded-2xl border border-white/10 bg-black/35 p-4 hover:border-white/30">
              <p className="font-semibold">Explore Shelves</p>
              <p className="text-sm text-white/60 mt-2">Start from a subject area</p>
            </Link>

            <Link href="/metadata/create" className="rounded-2xl border border-white/10 bg-black/35 p-4 hover:border-white/30">
              <p className="font-semibold">Create Record</p>
              <p className="text-sm text-white/60 mt-2">Add new knowledge to the system</p>
            </Link>
          </div>
        </section>

        {/* STRUCTURE */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Main Structure
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Library → Shelves → Sections → Records → Relationships
          </h2>

          <div className="mt-5 grid gap-4">
            {METADATA_LEVELS.map((item) => (
              <div key={item.level} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                  {item.level}
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/66">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Why It Matters
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Metadata makes the app smarter
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {WHY_IT_MATTERS.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm leading-6 text-white/68">{item}</p>
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
            Where metadata connects
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