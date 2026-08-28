"use client";

import ManualShell from "../components/ManualShell";
import { ManualInfoSection, ManualInlineLink } from "../components/ManualCards";

const ROADMAP_UPDATED = "8/28/26";

const DAW_BRANCHES = [
  {
    title: "Session, transport, playhead, zoom, and scrolling",
    status: "DONE",
    date: "8/27/26",
    details: ["Protected sessions", "Play, pause, stop, seek, zoom, and scroll", "Tempo map and musical grid"],
  },
  {
    title: "Recording",
    status: "DONE",
    date: "8/27/26",
    details: ["Input checks, levels, latency, count-in, and metronome", "Saved takes and interruption recovery", "Punch and multi-pass recording"],
  },
  {
    title: "Tracks and arrangement",
    status: "DONE",
    date: "8/21/26",
    details: ["Import, waveform, move, trim, split, repeat, and fades", "Selection, group editing, undo/redo, and snapshots", "Track locking, colors, shortcuts, folders, and groups"],
  },
  {
    title: "Regions and arrangement sections",
    status: "DONE",
    date: "8/21/26",
    open: true,
    details: ["Name and color regions", "Resize, duplicate, and move regions", "Jump, loop, and repeat regions", "Create tracks from selected regions"],
  },
  {
    title: "Three-version riff comparison",
    status: "DONE",
    date: "8/21/26",
    details: ["Color-coded matching riff families", "Audition each version or hear matches across tracks", "Advance through matching riffs"],
  },
  {
    title: "Hybrid edit track",
    status: "DONE",
    date: "8/21/26",
    details: ["Fourth edit lane", "Copy, cut, paste, and arrange sections from alternate versions"],
  },
  {
    title: "Session View",
    status: "DONE",
    date: "8/26/26",
    details: ["Clip launching and scene workflow", "Session-to-arrangement music workflow"],
  },
  {
    title: "Mixing, routing, automation, and effects",
    status: "DONE",
    date: "8/27/26",
    details: ["Gain, pan, mute, solo, sends, and routing", "Automation and effect controls", "Mix decisions and saved state"],
  },
  {
    title: "MIDI and instruments",
    status: "DONE",
    date: "8/27/26",
    details: ["MIDI import and clip creation", "Piano-roll editing and instrument workflow"],
  },
  {
    title: "Recovery, collaboration, and review",
    status: "DONE",
    date: "8/25/26",
    details: ["Protected checkpoints and session snapshots", "Review comments and collaboration controls", "Safe restore workflow"],
  },
  {
    title: "Export and delivery",
    status: "DONE",
    date: "8/25/26",
    details: ["WAV and stem delivery setup", "Saved render specifications and manifests", "Checksum-protected delivery workflow"],
  },
  {
    title: "Owner seven-step musician sign-off",
    status: "MUST DO",
    date: "8/27/26",
    details: ["Complete the final owner listening judgment", "Record the final pass or problem report"],
  },
  {
    title: "Production export reliability",
    status: "MUST DO",
    date: "8/27/26",
    details: ["Resolve large-file and stem-package failures", "Verify completed downloads on production"],
  },
  {
    title: "Baby-step help: How do I get there? / How do I do this?",
    status: "MUST DO",
    date: "8/27/26",
    details: ["Attach destination help to every important control", "Show one small action at a time", "Remember the current help step after navigation and refresh"],
  },
  {
    title: "Shorter DAW workspace pages",
    status: "MUST DO",
    date: "8/27/26",
    details: ["Replace long pages with compact work-area menus", "Open only the section the musician chooses", "Keep return-to-step controls visible"],
  },
  {
    title: "Full browser, hardware, and plug-in production QA",
    status: "MUST DO",
    date: "8/27/26",
    details: ["Chrome and supported-browser testing", "Audio-device and recording-hardware testing", "Plug-in compatibility and performance testing"],
  },
] as const;

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
      <details className="group rounded-2xl border border-white/10 bg-white/[0.03]">
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

      <details
        className="group rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.035]"
        open
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/65">
              DAW roadmap · updated {ROADMAP_UPDATED}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              DAW Tree — dates, DONE, and MUST DO
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            <span className="group-open:hidden">Open</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </summary>

        <div className="border-t border-cyan-300/15 p-5">
          <p className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/65">
            DONE means implemented in The Muzes Garden. It does not claim complete
            Ableton Live or Pro Tools feature parity.
          </p>

          <div className="mt-4 grid gap-3">
            {DAW_BRANCHES.map((branch) => (
              <details
                key={branch.title}
                className="group/branch rounded-xl border border-white/10 bg-black/30"
                open
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white/85">
                    <span aria-hidden="true" className="text-cyan-300/70">
                      ├─
                    </span>
                    {branch.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        branch.status === "DONE"
                          ? "rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100"
                          : "rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100"
                      }
                    >
                      {branch.status}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
                      Updated {branch.date}
                    </span>
                  </span>
                </summary>

                <ul className="space-y-2 border-t border-white/10 px-5 py-4 text-sm leading-6 text-white/65">
                  {branch.details.map((detail, detailIndex) => (
                    <li
                      key={detail}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[.07] bg-white/[.025] px-3 py-2"
                    >
                      <span className="flex min-w-0 items-start gap-2">
                        <span aria-hidden="true" className="text-cyan-300/60">
                          {detailIndex === branch.details.length - 1 ? "└─" : "├─"}
                        </span>
                        <span>{detail}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={
                            branch.status === "DONE"
                              ? "rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-100"
                              : "rounded-full border border-amber-300/20 bg-amber-300/[.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-100"
                          }
                        >
                          {branch.status}
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-white/40">
                          {branch.date}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
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
