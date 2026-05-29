"use client";

import ManualShell from "./components/ManualShell";
import ManualSystemGrid, {
  type ManualSystemCard,
} from "./components/ManualSystemGrid";
import {
  ManualInfoSection,
  ManualInlineLink,
} from "./components/ManualCards";

const CORE_SYSTEMS: ManualSystemCard[] = [
  {
    title: "Projects",
    href: "/about/projects",
    summary:
      "Project containers for organizing songs, stems, prompts, notes, lyrics, and future AI work.",
    whyItMatters:
      "Projects are becoming the central containers that connect sounds, metadata, navigation, and future generation systems.",
    status: "Working now",
  },
  {
    title: "Metadata System",
    href: "/about/metadata",
    summary:
      "Structured music knowledge using shelves, sections, records, and relationships.",
    whyItMatters:
      "Metadata is the foundation for reusable music knowledge, future AI understanding, and relationship-aware navigation.",
    status: "Building now",
  },
  {
    title: "Find It",
    href: "/about/find-it",
    summary:
      "ADD-friendly navigation helper for finding routes, pages, records, and future knowledge links.",
    whyItMatters:
      "The app will eventually become too deep to navigate comfortably without intelligent guidance.",
    status: "Building now",
  },
  {
    title: "Global Player",
    href: "/about/global-player",
    summary:
      "Persistent playback while moving through projects, metadata, and future creation tools.",
    whyItMatters:
      "Music work often begins with hearing something. The player keeps sound connected to the rest of the system.",
    status: "Working now",
  },
];

const FUTURE_SYSTEMS: ManualSystemCard[] = [
  {
    title: "AI Music Generator",
    href: "/about/ai-music-generator",
    summary:
      "Future prompt-based music creation with pronunciation planning and regeneration pipelines.",
    whyItMatters:
      "The goal is a controllable professional creation system, not a random prompt toy.",
    status: "Planned",
  },
  {
    title: "Site Tree / Roadmap",
    href: "/about/site-tree",
    summary:
      "Track what is done, what is being built, and how systems connect together.",
    whyItMatters:
      "As the app grows, users need a clear map of where systems live and how they relate.",
    status: "Building now",
  },
];

export default function AboutHomePage() {
  return (
    <ManualShell
      eyebrow="Manual"
      title="The Muzes Garden Manual"
      description="This manual is the beginning of the built-in encyclopedia and help layer for The Muzes Garden. The long-term goal is a connected knowledge system where pages, concepts, routes, music ideas, and future tools explain each other through linked information."
    >
      <ManualInfoSection title="What this manual is becoming">
        <p>
          Right now, the manual explains the major systems of the app. Over
          time, important concepts inside the text should also become linkable.
          A user should eventually be able to move from a page like{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>{" "}
          into deeper pages explaining navigation structure, metadata search,
          relationship graphs, and future routing systems.
        </p>

        <p>
          The long-term idea is closer to a living encyclopedia than a normal
          help page. The system should eventually support pages within pages,
          relationship browsing, visual trees, and explanation layers similar to
          large creative software manuals.
        </p>

        <p>
          This manual is also meant to reduce confusion for users with ADD by
          making routes, explanations, and relationships easier to follow step
          by step.
        </p>
      </ManualInfoSection>

      <ManualSystemGrid
        title="Core Systems"
        body="These are the systems currently shaping the foundation of The Muzes Garden."
        systems={CORE_SYSTEMS}
      />

      <ManualSystemGrid
        title="Future Systems"
        body="These systems are planned or partially started and will expand as the architecture grows."
        systems={FUTURE_SYSTEMS}
      />

      <ManualInfoSection title="How the systems connect">
        <p>
          The important architectural idea is that these systems are not
          supposed to remain isolated from each other.
        </p>

        <p>
          A future workflow might look like:
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Project → Track → Metadata Record → Relationship → Prompt →
            Generator → Playback → Explanation → Navigation Path
          </p>
        </div>

        <p>
          That means a sound being played in the{" "}
          <ManualInlineLink href="/about/global-player">
            Global Player
          </ManualInlineLink>{" "}
          could eventually connect directly to metadata explanations, AI
          generation history, lyric meaning, project context, or future editing
          tools.
        </p>

        <p>
          The{" "}
          <ManualInlineLink href="/about/find-it">
            Find It System
          </ManualInlineLink>{" "}
          is also evolving from a simple route helper into a true knowledge
          navigation layer.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Current philosophy">
        <p>
          The Muzes Garden is intentionally being built slowly and structurally
          instead of rushing random disconnected features into the app.
        </p>

        <p>
          The current focus is:
        </p>

        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Keep the build green.</li>
          <li>• Split oversized files before architecture becomes unstable.</li>
          <li>• Create reusable systems instead of one-off hacks.</li>
          <li>• Make navigation understandable for ADD-style workflows.</li>
          <li>• Build future AI systems on structured metadata foundations.</li>
        </ul>

        <p>
          The result should eventually feel less like a normal music app and
          more like a connected creative operating system.
        </p>
      </ManualInfoSection>
    </ManualShell>
  );
}