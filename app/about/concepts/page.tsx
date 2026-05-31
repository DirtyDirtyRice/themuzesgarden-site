"use client";

import ManualShell from "../components/ManualShell";
import { ManualInfoSection } from "../components/ManualCards";
import ManualSystemGrid, {
  type ManualSystemCard,
} from "../components/ManualSystemGrid";

type ConceptGroup = {
  title: string;
  body: string;
  systems: ManualSystemCard[];
};

const CONCEPT_GROUPS: ConceptGroup[] = [
  {
    title: "Metadata Concepts",
    body: "These pages explain the knowledge layer: records, relationships, graphs, and the larger music memory system.",
    systems: [
      {
        title: "Metadata Records",
        href: "/about/concepts/metadata-records",
        summary:
          "Reusable explanation units for music ideas, project context, fields, slugs, and relationships.",
        whyItMatters:
          "Records are the building blocks that let the app explain meaning instead of only storing files.",
        status: "Building now",
      },
      {
        title: "Metadata Relationships",
        href: "/about/concepts/metadata-relationships",
        summary:
          "The links that connect records together into a structured knowledge graph.",
        whyItMatters:
          "Relationships let the app explain why two music ideas, projects, or records belong together.",
        status: "Building now",
      },
      {
        title: "Relationship Graph",
        href: "/about/concepts/relationship-graph",
        summary:
          "The future visual map of how records, projects, lyrics, prompts, and ideas connect.",
        whyItMatters:
          "A graph shows meaning across systems instead of trapping information inside separate pages.",
        status: "Planned",
      },
      {
        title: "Music Knowledge Graph",
        href: "/about/concepts/music-knowledge-graph",
        summary:
          "The larger connected map of songs, sounds, theory, lyrics, prompts, and manual explanations.",
        whyItMatters:
          "The knowledge graph is the long-term memory layer for the entire app.",
        status: "Planned",
      },
    ],
  },
  {
    title: "Navigation Concepts",
    body: "These pages explain how users find pages, records, routes, manual words, and saved destinations.",
    systems: [
      {
        title: "Find It Paths",
        href: "/about/concepts/find-it-paths",
        summary:
          "Route explanations showing where you are, where you are going, and how to get there.",
        whyItMatters:
          "Deep apps need visible routes so users do not have to memorize hidden page structure.",
        status: "Building now",
      },
      {
        title: "Search Sources",
        href: "/about/concepts/search-sources",
        summary:
          "The source labels that explain whether a Find It result came from navigation, metadata, manual pages, or future systems.",
        whyItMatters:
          "Users need to know what kind of result they are clicking before they navigate.",
        status: "Building now",
      },
      {
        title: "Navigation Tree",
        href: "/about/concepts/navigation-tree",
        summary:
          "The structured app map for pages, child pages, records, tools, and manual sections.",
        whyItMatters:
          "The app needs a visible tree so deep navigation does not become confusing.",
        status: "Building now",
      },
      {
        title: "Saved Find It Paths",
        href: "/about/concepts/saved-find-it-paths",
        summary:
          "Reusable routes that can bring users back to important pages, records, or work areas.",
        whyItMatters:
          "Saved paths turn repeated navigation into visible shortcuts for ADD-friendly workflows.",
        status: "Planned",
      },
      {
        title: "Manual Word Links",
        href: "/about/concepts/manual-word-links",
        summary:
          "Wikipedia-style links inside manual text that open deeper explanation pages.",
        whyItMatters:
          "Word links let users go deeper without making every page too long.",
        status: "Building now",
      },
    ],
  },
  {
    title: "Project + Audio Concepts",
    body: "These pages explain how projects, songs, stems, versions, track details, and audio problems should connect.",
    systems: [
      {
        title: "Project Containers",
        href: "/about/concepts/project-containers",
        summary:
          "The future container structure for songs, stems, notes, prompts, metadata, and generation history.",
        whyItMatters:
          "Projects should explain creative context instead of becoming random folders.",
        status: "Building now",
      },
      {
        title: "Song Versions",
        href: "/about/concepts/song-versions",
        summary:
          "Different states of a song over time, including demos, arrangements, mixes, and generated versions.",
        whyItMatters:
          "Version awareness protects creative history from being overwritten or forgotten.",
        status: "Planned",
      },
      {
        title: "Stems",
        href: "/about/concepts/stems",
        summary:
          "Separate audio parts such as drums, bass, vocals, instruments, harmonies, and generated layers.",
        whyItMatters:
          "Stems let users inspect, organize, repair, and regenerate smaller pieces of a song.",
        status: "Planned",
      },
      {
        title: "Track Details",
        href: "/about/concepts/track-details",
        summary:
          "The future explanation layer for a piece of audio: what it is, where it belongs, and what can be done with it.",
        whyItMatters:
          "Track details connect listening to projects, notes, metadata, prompts, and next actions.",
        status: "Planned",
      },
      {
        title: "Audio Problem Notes",
        href: "/about/concepts/audio-problem-notes",
        summary:
          "Notes attached to specific audio problems in tracks, stems, markers, generated outputs, or mixes.",
        whyItMatters:
          "Problem notes turn vague listening issues into actionable repair tasks.",
        status: "Planned",
      },
      {
        title: "Timeline Markers",
        href: "/about/concepts/timeline-markers",
        summary:
          "Notes attached to exact moments in audio, including hooks, mistakes, transitions, and repair targets.",
        whyItMatters:
          "Music is time-based, so notes need to attach to exact moments.",
        status: "Planned",
      },
    ],
  },
  {
    title: "AI Generation Concepts",
    body: "These pages explain the planned AI music workflow: prompts, pronunciation, repair loops, and saved generation memory.",
    systems: [
      {
        title: "Prompt Memory",
        href: "/about/concepts/prompt-memory",
        summary:
          "Saved prompt history connecting what was asked, what was generated, what worked, and what failed.",
        whyItMatters:
          "Prompt memory keeps generation history reusable instead of throwaway.",
        status: "Planned",
      },
      {
        title: "Pronunciation Pipeline",
        href: "/about/concepts/pronunciation-pipeline",
        summary:
          "The planned lyric-to-singing system for pronunciation planning, checking, repair, and saved versions.",
        whyItMatters:
          "Singers should pronounce normal lyrics correctly without forcing users to write phonetics by hand.",
        status: "Planned",
      },
      {
        title: "Generation Repair Loop",
        href: "/about/concepts/generation-repair-loop",
        summary:
          "The process for finding what is wrong in generated music, targeting the problem, and regenerating carefully.",
        whyItMatters:
          "Music generation becomes useful when users can repair specific problems instead of starting over.",
        status: "Planned",
      },
    ],
  },
  {
    title: "Workspace Concepts",
    body: "These pages explain future member customization, context actions, notes, cards, and personal working areas.",
    systems: [
      {
        title: "Member Workstations",
        href: "/about/concepts/member-workstations",
        summary:
          "Personal work areas where users can shape their own project notes, cards, buttons, and routes.",
        whyItMatters:
          "Music workflows are personal, so the app needs customizable working surfaces.",
        status: "Planned",
      },
      {
        title: "Custom Workspace Cards",
        href: "/about/concepts/custom-workspace-cards",
        summary:
          "User-created blocks for notes, explanations, buttons, quick links, and personal workflow helpers.",
        whyItMatters:
          "Cards let users customize workspaces without turning every page into chaos.",
        status: "Planned",
      },
      {
        title: "Right-Click Actions",
        href: "/about/concepts/right-click-actions",
        summary:
          "Context menus that let users create, explain, inspect, or connect something from where they are.",
        whyItMatters:
          "Context actions reduce menu hunting and make creation happen at the point of need.",
        status: "Planned",
      },
      {
        title: "User Notes",
        href: "/about/concepts/user-notes",
        summary:
          "Personal or project-specific notes attached to projects, tracks, markers, metadata, prompts, and workstations.",
        whyItMatters:
          "Notes are a memory layer for decisions, problems, ideas, and next steps.",
        status: "Planned",
      },
    ],
  },
  {
    title: "Lyrics + Meaning Concepts",
    body: "These pages explain lyric meaning, themes, sung delivery, pronunciation context, and future searchable text layers.",
    systems: [
      {
        title: "Lyrics and Meaning",
        href: "/about/concepts/lyrics-and-meaning",
        summary:
          "The future explanation layer for words, themes, story choices, emotional intent, and sung delivery.",
        whyItMatters:
          "Lyrics need meaning and delivery context, not just plain text storage.",
        status: "Planned",
      },
    ],
  },
];

export default function ConceptsPage() {
  const totalConcepts = CONCEPT_GROUPS.reduce(
    (total, group) => total + group.systems.length,
    0,
  );

  return (
    <ManualShell
      eyebrow="Manual Concepts"
      title="Concept Pages"
      description="Concept pages are the second layer of the manual. They explain important words, systems, and future features that appear across many parts of The Muzes Garden."
    >
      <ManualInfoSection title="How this concept index works">
        <p>
          This page is organized by concept families instead of one long flat
          list. That makes the manual easier to browse as the encyclopedia
          grows.
        </p>

        <p>
          Each concept page explains one idea in plain language, shows why it
          matters, and links to related manual pages. This is the beginning of
          the pages-within-pages structure.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Manual → Concept Family → Concept Page → Related Concept → Future
            Metadata Record
          </p>
        </div>

        <p className="text-sm leading-7 text-white/55">
          Current concept count: {totalConcepts}
        </p>
      </ManualInfoSection>

      {CONCEPT_GROUPS.map((group) => (
        <ManualSystemGrid
          key={group.title}
          title={group.title}
          body={group.body}
          systems={group.systems}
        />
      ))}
    </ManualShell>
  );
}