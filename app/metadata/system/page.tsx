import Link from "next/link";

export default function MetadataSystemPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                Metadata
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                System
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                Foundation
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Metadata System
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Depth Model and Parent Structure
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
              This page explains the deeper direction of the metadata system.
              The goal is to let users go as deep as they want without making
              the visible interface feel crowded or messy. The surface stays
              clean. The structure underneath stays powerful.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/metadata"
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Metadata Library
              </Link>

              <Link
                href="/metadata/system/more"
                className="inline-flex rounded-md border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20"
              >
                More Information
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Core Principle
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Deep Underneath, Clean on the Surface
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-white/75 md:text-base">
            <p>
              The system is being designed so that important things can have
              parent-child structure, related records, deeper pages, examples,
              and future tutorial branches. At the same time, the visible page
              should not overwhelm the user with too many buttons, links, or
              distractions.
            </p>

            <p>
              This means the architecture can be deep even when the page looks
              simple. A user who wants only the basics can stay near the top.
              A user who wants to explore can keep going deeper through more
              information pages, relationship links, context actions, or future
              create tools.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Structure Model
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Shared Parenthood Ability
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Parent
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                A page, term, control, record, or future create item can become
                a parent when it leads to child concepts, deeper examples,
                advanced explanations, or related branches.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Child
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                A child can be a deeper explanation page, a practical example, a
                tutorial branch, a system note, a music concept, or a future
                create-system record.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Related
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Not everything has to be parent and child. Some records should
                connect sideways through relationships so users can move across
                the knowledge network instead of only down a single chain.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Depth
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                The rabbit hole can go as deep as needed. The important rule is
                that the UI should only expose that depth when it helps the user
                instead of cluttering the surface.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Entry Paths
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Ways Users Can Go Deeper
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                More Information Buttons
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Major pages and important records can expose a visible More
                Information button when a deeper explanation makes sense.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Hover Help
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Short help text can appear on hover for quick explanations. This
                keeps the interface friendly for beginners without forcing them
                into long pages immediately.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Right-Click Context Actions
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Advanced users can use right-click or future context menus to go
                deeper directly from the thing they are interacting with.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Top-Bar Systems
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Top-bar areas like Metadata and the future Create tab can act as
                clean entry points into the deeper knowledge structure.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Create Connection
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Future Create-System Expansion
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-white/75 md:text-base">
            <p>
              The future Create system can use this same structure. A create
              item can have a short explanation, a beginner example, a More
              Information page, and future child pages beneath it. That means
              the create layer and the metadata layer do not need separate help
              systems.
            </p>

            <p>
              This allows the app to grow without becoming inconsistent. Buttons,
              records, controls, pages, and future create items can all plug
              into the same deeper knowledge model.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Future Slots
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              What Can Grow Here Later
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Tutorials
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Step-by-step walkthroughs for beginners and advanced users.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Examples
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Practical musical and interface examples that show how concepts
                work in real situations.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Help Records
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Dedicated system explanations for controls, labels, tabs, and
                future create actions.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Media
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Later this can grow into embedded demos, screenshots, and video
                guidance.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}