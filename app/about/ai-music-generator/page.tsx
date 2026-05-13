"use client";

import Link from "next/link";

const START_HERE = [
  {
    title: "Think in ideas, not prompts",
    text: "Write lyrics, concepts, or directions normally. The system should handle the technical translation.",
  },
  {
    title: "Let the system plan first",
    text: "Instead of generating immediately, the system breaks your idea into structure, timing, and intent.",
  },
  {
    title: "Refine instead of restart",
    text: "Fix only the parts that are wrong instead of regenerating entire songs.",
  },
];

const SYSTEM_STAGES = [
  {
    title: "Input",
    text: "The user provides normal-language lyrics, prompts, or ideas without needing phonetic spelling or technical formatting.",
  },
  {
    title: "Planning",
    text: "The system breaks input into structure, timing, pronunciation, instrumentation, and intent before generation.",
  },
  {
    title: "Generation",
    text: "Audio is created using the planned structure instead of guessing from raw text alone.",
  },
  {
    title: "Verification",
    text: "The system checks output for errors like mispronounced words, timing issues, or incorrect emphasis.",
  },
  {
    title: "Regeneration",
    text: "Only the incorrect parts are regenerated instead of restarting the entire song.",
  },
];

const PRONUNCIATION_PIPELINE = [
  "Lyrics are written normally by the user.",
  "The system internally converts words into phonetic plans.",
  "Singing is generated using those phonetic plans.",
  "Output is checked for incorrect pronunciation.",
  "Problem sections are repaired or regenerated.",
];

const FUTURE_CAPABILITIES = [
  "Track prompt history and decisions across versions.",
  "Store generation attempts inside projects.",
  "Link generated audio to metadata records.",
  "Search for sounds, lyrics, or structures across past work.",
  "Allow precise control over timing and musical changes.",
];

const WHY_IT_MATTERS = [
  "Most current AI music tools guess instead of planning.",
  "Pronunciation errors break otherwise good generations.",
  "Users lose track of what prompt created what result.",
  "A structured system allows improvement instead of repetition.",
];

const RELATED_LINKS = [
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See the knowledge base the generator should use.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See where generated material should be stored.",
  },
  {
    label: "Global Player",
    href: "/about/global-player",
    note: "See how generated audio will be played and explored.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how generated content can be found later.",
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
            Future Creation System
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            AI Music Generator
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            The AI Music Generator is planned as a structured music creation
            system. It is not just a prompt box. It is designed to plan,
            generate, check, and refine music in a controlled way.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Planned system. No full generator exists yet. This page defines
              how it should work.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            Start Here
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            How this system should be used
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
            System Flow
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Input → Planning → Generation → Verification → Regeneration
          </h2>

          <div className="mt-5 grid gap-4">
            {SYSTEM_STAGES.map((item) => (
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

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              Key Feature
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Pronunciation pipeline
            </h2>

            <div className="mt-5 space-y-3">
              {PRONUNCIATION_PIPELINE.map((item) => (
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
              Future Capabilities
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              What this system enables
            </h2>

            <div className="mt-5 space-y-3">
              {FUTURE_CAPABILITIES.map((item) => (
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
            Why It Matters
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Better structure leads to better music output
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
            What the generator connects to
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