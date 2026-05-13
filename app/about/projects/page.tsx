"use client";

import Link from "next/link";

const CURRENT_ROLE = [
  "Projects act as containers where users can start organizing music work.",
  "They allow creating and opening project spaces.",
  "They group together work that belongs to the same idea or song.",
];

const FUTURE_ROLE = [
  "Hold songs, stems, drafts, and generated audio.",
  "Track versions and changes over time.",
  "Store prompts and generation history.",
  "Connect directly to metadata records and relationships.",
  "Link to Global Player playback and Find It navigation paths.",
];

const HOW_TO_USE = [
  {
    step: "Step 1",
    title: "Create a project",
    text: "Start a project when you have a song idea, concept, or direction you want to build.",
  },
  {
    step: "Step 2",
    title: "Add your work",
    text: "Put your audio, notes, lyrics, and ideas inside the project instead of scattering them.",
  },
  {
    step: "Step 3",
    title: "Keep related things together",
    text: "Group sounds, versions, and ideas that belong to the same creative direction.",
  },
  {
    step: "Step 4",
    title: "Expand with metadata",
    text: "Later, connect your project to metadata records to explain what you are building.",
  },
];

const WHY_IT_MATTERS = [
  "Projects prevent music work from being scattered across random files.",
  "They make it easier to return to an idea later without losing context.",
  "They allow metadata to explain what each project actually is.",
  "They prepare the system for AI generation tracking and regeneration.",
];

const RELATED_LINKS = [
  {
    label: "Open Projects",
    href: "/workspace/projects",
    note: "Go to the working project list.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See how project knowledge connects to records and relationships.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how navigation will help locate projects quickly.",
  },
  {
    label: "Global Player",
    href: "/about/global-player",
    note: "See how playback will connect to project audio.",
  },
  {
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See how future generation work will live inside projects.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See where Projects fit in the overall roadmap.",
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
            Core Workspace System
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Projects
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            Projects are where music work lives. They are the place where ideas,
            audio, notes, and future generation history come together into one
            clear container.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Working now, but still early. Projects allow basic organization
              and will expand into full creative containers.
            </p>
          </div>
        </section>

        {/* START HERE (NEW) */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Start Here
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Begin working with projects
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Link
              href="/workspace/projects"
              className="rounded-2xl border border-white/10 bg-black/35 p-4 hover:border-white/30"
            >
              <p className="font-semibold text-white">Open Projects</p>
              <p className="mt-2 text-sm text-white/60">
                View and open your existing project workspaces
              </p>
            </Link>

            <Link
              href="/workspace/projects"
              className="rounded-2xl border border-white/10 bg-black/35 p-4 hover:border-white/30"
            >
              <p className="font-semibold text-white">Create Project</p>
              <p className="mt-2 text-sm text-white/60">
                Start a new project when you have an idea or direction
              </p>
            </Link>
          </div>
        </section>

        {/* CURRENT vs FUTURE */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              What They Do Now
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Current role
            </h2>

            <div className="mt-5 space-y-3">
              {CURRENT_ROLE.map((item) => (
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
              What They Become
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Future role
            </h2>

            <div className="mt-5 space-y-3">
              {FUTURE_ROLE.map((item) => (
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

        {/* HOW TO USE */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            How To Use Projects
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            The simple workflow
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

        {/* WHY */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Why It Matters
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Projects give structure to creative work
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

        {/* RELATED */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Related Pages
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Where projects connect
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