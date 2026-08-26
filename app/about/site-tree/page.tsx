"use client";

import ManualShell from "../components/ManualShell";
import { ManualInfoSection, ManualInlineLink } from "../components/ManualCards";

const ROADMAP_UPDATED = "8/25/26";

const TREE = [
  {
    label: "DONE",
    tone: "border-emerald-200/20 bg-emerald-300/[0.04]",
    items: [
      "Home is the front door with current system cards, working destinations, and update dates",
      "Top navigation routes and dropdowns connect the main app sections",
      "Library remains the source collection and tracks can be linked into Projects",
      "Projects support private workspaces, linked tracks, notes, setlists, playback, and DAW sessions",
      "The Global Player preserves project and setlist context while users move through the app",
      "Find It searches navigation and metadata together with source chips, highlights, and Clear / Reset",
      "Find It exposes related metadata paths and opens connected metadata records",
      "Metadata supports shelves, sections, records, track links, relationships, layered queries, and results",
      "The manual uses reusable layouts with deeper child pages for important concepts",
      "Working app links and More Info explanation links are separated on Home cards",
      "Core DAW recording, arrangement, regions, riff comparison, mixing, MIDI, recovery, and export features are implemented",
      "Large DAW exports can resume and private render sources can upload directly",
      "Long manual and metadata pages now use compact Open / Close controls",
    ],
  },
  {
    label: "DOING",
    tone: "border-amber-200/20 bg-amber-300/[0.04]",
    items: [
      "Complete the owner’s seven-step real-musician DAW sign-off",
      "Continue expanding the in-app manual into a complete living encyclopedia",
      "Connect more live project and Library information to metadata records",
      "Expand Find It beyond seeded manual and metadata content as new systems are added",
      "Finish and verify the closed-beta onboarding, handoff, and large-export experience",
      "Keep large workspaces compact, understandable, and friendly for ADD-style workflows",
    ],
  },
  {
    label: "STILL TO DO",
    tone: "border-white/10 bg-white/[0.03]",
    items: [
      "Build the future AI music generator architecture",
      "Create a complete interactive visual navigation tree that users can browse",
      "Add full-text manual search across every explanation and concept page",
      "Replace remaining seed-only knowledge with durable owner-managed metadata where appropriate",
      "Complete real-musician beta testing and resolve any issues found before production release",
      "Add richer cross-system links among projects, lyrics, prompts, metadata, playback, and future generation history",
    ],
  },
];

const SYSTEM_FLOW = [
  "Home",
  "Manual",
  "Projects",
  "Metadata",
  "Find It",
  "Global Player",
  "AI Music Generator",
  "Site Tree",
];

export default function SiteTreePage() {
  return (
    <ManualShell
      eyebrow="Roadmap"
      title="Site Tree / Roadmap"
      description="This page is the map for where The Muzes Garden is now and where it is going. It tracks done, doing, and still-to-do work so the app can grow without losing the plot."
    >
      <details open className="group rounded-2xl border border-white/10 bg-white/[0.03]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
          <h2 className="text-2xl font-semibold text-white">Roadmap status</h2>
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
            <span className="group-open:hidden">Open</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </summary>
      <section className="grid gap-4 border-t border-white/10 p-5 lg:grid-cols-3">
        {TREE.map((group) => (
          <article
            key={group.label}
            className={[
              "rounded-2xl border p-5",
              group.tone,
            ].join(" ")}
          >
            <h2 className="text-2xl font-semibold text-white">
              {group.label}
            </h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/65">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <p>{item}</p>
                  <p className="mt-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                    Updated {ROADMAP_UPDATED}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      </details>

      <ManualInfoSection title="Current big-picture structure">
        <p>
          The app is becoming a connected creative operating system. The current
          structure starts with{" "}
          <ManualInlineLink href="/">
            Home
          </ManualInlineLink>
          , then branches into working tools and manual explanations.
        </p>

        <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-4 md:grid-cols-4">
          {SYSTEM_FLOW.map((item, index) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                Step {index + 1}
              </p>

              <p className="mt-1 text-sm font-semibold text-white/75">
                {item}
              </p>
            </div>
          ))}
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Future tree idea">
        <p>
          The final version should let users click through a tree like:
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Home → Metadata → Library → Record → Relationships → More Info →
            Related Concept → Project → Player
          </p>
        </div>

        <p>
          That same tree should help{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>{" "}
          explain exactly how to get from the current page to the target page.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why this roadmap matters">
        <p>
          The Muzes Garden is already deep enough that a roadmap is not optional.
          Without a clear tree, the app would turn into scattered features.
        </p>

        <p>
          The roadmap keeps the build honest. It shows what already works, what
          is actively being shaped, and what should not be pretended to be done
          yet.
        </p>

        <p>
          This page should eventually become both a developer map and a user map.
          Users should be able to see where features live, while development can
          use the same tree to avoid duplicating systems.
        </p>
      </ManualInfoSection>
    </ManualShell>
  );
}
