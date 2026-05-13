"use client";

import Link from "next/link";

const CURRENT_BEHAVIOR = [
  "Find It opens from the title bar so the user does not have to remember where the helper lives.",
  "The search box accepts plain words like metadata, projects, player, create, or manual.",
  "Arrow keys move through results without forcing the user to click every row.",
  "Enter is protected so the user can inspect a target path before jumping away.",
  "Results can include app navigation pages and metadata-related results.",
];

const FUTURE_BEHAVIOR = [
  "Show a clearer tree of where the user is right now.",
  "Show the target page and the exact path from current location to target.",
  "Explain whether the path goes up, down, across, or stays on the same page.",
  "Connect manual pages, metadata records, relationship cards, and future child pages.",
  "Eventually explain words and ideas inside the app, not only route names.",
];

const HOW_TO_USE = [
  {
    step: "Step 1",
    title: "Open Find It",
    text: "Use the Find It button in the title bar.",
  },
  {
    step: "Step 2",
    title: "Type the thing you need",
    text: "Use normal words. You do not need to know the exact page route.",
  },
  {
    step: "Step 3",
    title: "Read the target path",
    text: "Look at the path panel before moving so you know where the app is sending you.",
  },
  {
    step: "Step 4",
    title: "Choose the best match",
    text: "Use the visible result that best matches the page, system, or record you wanted.",
  },
];

const SYSTEM_CONNECTIONS = [
  {
    title: "Manual",
    href: "/about",
    text: "Find It should help users open the right explanation page when they are confused.",
  },
  {
    title: "Metadata System",
    href: "/about/metadata",
    text: "Find It should surface metadata records, shelves, sections, and relationship pages.",
  },
  {
    title: "Projects",
    href: "/about/projects",
    text: "Find It should help users locate project pages, saved work, and future project tools.",
  },
  {
    title: "Site Tree",
    href: "/about/site-tree",
    text: "Find It depends on the app tree so it can explain where pages live.",
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
            Core Navigation System
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Find It System
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-white/72">
            Find It is the ADD-friendly wayfinding system for The Muzes Garden.
            Its job is to answer three plain questions: where am I, what am I
            trying to find, and how do I get there without guessing?
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
            <p className="text-sm font-semibold text-emerald-100/90">
              Current status
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/75">
              Building now. Navigation search works, keyboard movement works,
              Enter is protected from accidental jumping, target path behavior
              exists, and metadata results are being connected.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
              What It Is
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              A guide, not just a search box
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/68">
              Normal search only gives a list of matches. Find It should go
              further. It should show the user the best destination, the path to
              reach it, and enough context to avoid getting lost inside a deep
              app.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
              Why It Exists
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              The app needs a memory-friendly map
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/68">
              The Muzes Garden is growing into projects, metadata, manual
              pages, generator tools, player tools, and future child pages. Find
              It keeps that depth usable by turning the app structure into a
              visible path.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            How To Use It
          </p>

          <h2 className="mt-2 text-2xl font-semibold">The simple user flow</h2>

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

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              Working Now
            </p>

            <h2 className="mt-2 text-2xl font-semibold">Current behavior</h2>

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
              Next Version
            </p>

            <h2 className="mt-2 text-2xl font-semibold">Future behavior</h2>

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
            System Connections
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            What Find It connects to
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {SYSTEM_CONNECTIONS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/35 hover:bg-white/[0.06]"
              >
                <p className="text-lg font-semibold text-white">
                  {link.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/62">
                  {link.text}
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