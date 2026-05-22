"use client";

import TitleBar from "../components/TitleBar";
import {
  glossaryItems,
  helpCoreSectionSummaries,
  quickAnswers,
} from "./helpFoundationDataCore";
import {
  howDoICards,
  routeCards,
  routeMaps,
} from "./helpFoundationDataWorkflows";
import {
  helpCards,
  libraryCards,
  metadataCards,
  playerCards,
  projectCards,
  setlistCards,
  tipCards,
  trackMatcherCards,
  whatIsThisCards,
} from "./helpFoundationDataAreas";
import { whatsNewCards } from "./helpFoundationDataUpdates";
import { HelpHeroPanel } from "./helpFoundationHeroPanel";
import {
  FindItSectionPanel,
  GlossaryPanel,
  HelpSection,
  QuickAnswersPanel,
  RouteMapPanel,
  WhatsNewPanel,
} from "./helpFoundationSectionPanels";
import { insetPanelClass, pageShellClass, panelClass, subTextClass } from "./helpFoundationStyles";
import type { HelpCard } from "./helpFoundationTypes";
import { RouteSteps, StatusPill } from "./helpFoundationUiAtoms";

const verifiedWorkflowSteps = [
  "Upload",
  "Choose Folder",
  "Library",
  "Select Track",
  "Choose Project",
  "Send To",
  "Project",
  "Play",
];

const foundationRules = [
  "Open one Help branch at a time.",
  "Use Find It when a member knows the goal but not the page.",
  "Use Route Maps when exact click order matters.",
  "Use How Do I when a workflow needs plain steps.",
  "Use What Is This when a label needs plain-language meaning.",
  "Keep Help based on verified workflows first.",
  "Do not document fake controls as finished workflows.",
  "Keep the TitleBar stable during this phase.",
];

const helpBranchCards = [
  {
    title: "Find It",
    body: "Best first stop when the member knows what they want but does not know where it lives.",
    route: ["Help", "Find It"],
  },
  {
    title: "How Do I?",
    body: "Step-by-step guidance for common member workflows.",
    route: ["Help", "How Do I"],
  },
  {
    title: "What Is This?",
    body: "Plain-language meaning for app labels, areas, and controls.",
    route: ["Help", "What Is This"],
  },
  {
    title: "Routes",
    body: "Click-order paths for getting from one app area to another.",
    route: ["Help", "Routes"],
  },
  {
    title: "Quick Answers",
    body: "Fast answers for common confusion without opening the whole knowledge base.",
    route: ["Help", "Quick Answers"],
  },
  {
    title: "Glossary",
    body: "Small definitions that keep Help language consistent.",
    route: ["Help", "Glossary"],
  },
];

const searchCards: HelpCard[] = [
  {
    title: "Library Search",
    body: "Use Library Search when the user needs to narrow tracks by title, tag, source, mood, or keyword.",
    route: ["TitleBar", "Library", "Search"],
    status: "verified",
  },
  {
    title: "Help Search",
    body: "Use Find It and Quick Answers when the user needs to search Help guidance instead of scrolling the whole page.",
    route: ["TitleBar", "Help", "Find It", "Search"],
    status: "verified",
  },
  {
    title: "Metadata Search",
    body: "Use Metadata search or browse paths when the user needs to find a record, shelf, section, concept, or explanation.",
    route: ["TitleBar", "Metadata", "Search Or Browse"],
    status: "foundation",
  },
  {
    title: "Project Search",
    body: "Use project areas when the user needs tracks, setlists, overview information, or project metadata.",
    route: ["TitleBar", "Projects", "Open Project", "Project Areas"],
    status: "foundation",
  },
  {
    title: "Future Global Search",
    body: "Future global search should eventually connect tracks, projects, metadata, and Help from one search path.",
    route: ["Future", "Global Search"],
    status: "planned",
  },
];

const relationshipCards: HelpCard[] = [
  {
    title: "Metadata Relationships",
    body: "Metadata relationships connect records, concepts, explanations, and future knowledge objects.",
    route: ["TitleBar", "Metadata", "Record", "Relationships"],
    status: "foundation",
  },
  {
    title: "Track Matcher Lane Relationships",
    body: "Lane relationships explain how Track Matcher analysis lanes connect and support each other.",
    route: ["TitleBar", "Track Matcher", "Lane Relationships"],
    status: "verified",
  },
  {
    title: "Future Project Relationships",
    body: "Future project relationships will connect projects to tracks, notes, metadata, and other projects.",
    route: ["Projects", "Open Project", "Future Relationships"],
    status: "planned",
  },
  {
    title: "Future Track Relationships",
    body: "Future track relationships will connect versions, similar tracks, references, and Track Matcher results.",
    route: ["Library", "Open Track", "Future Track Relationships"],
    status: "planned",
  },
];

const workspaceCards: HelpCard[] = [
  {
    title: "Projects Workspace",
    body: "Projects are the current main workspace for organizing tracks into a working collection.",
    route: ["TitleBar", "Projects"],
    status: "verified",
  },
  {
    title: "Project Overview Workspace",
    body: "The project overview gives the user a starting point before opening tracks, setlists, playback, or metadata.",
    route: ["TitleBar", "Projects", "Open Project", "Overview"],
    status: "verified",
  },
  {
    title: "Track Matcher Workspace",
    body: "Track Matcher is the workspace for comparing, analyzing, preparing, and eventually matching tracks.",
    route: ["TitleBar", "Track Matcher"],
    status: "foundation",
  },
  {
    title: "Future Workspace Areas",
    body: "Future workspace areas can grow after Projects and Track Matcher are stable.",
    route: ["Workspace", "Future Areas"],
    status: "planned",
  },
];

function HelpFoundationStartPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            Help Control Center
          </div>

          <h2 className="mt-1 text-xl font-black text-white">
            Open one help branch, then go as deep as you want
          </h2>

          <p className={`mt-2 ${subTextClass}`}>
            Help is now organized like a dropdown tree instead of a giant wall
            of information. Start with Find It when you feel lost, or open the
            branch that matches the thing you are trying to understand.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="SIMPLE TOP" />
          <StatusPill label="DEEP DROPDOWNS" />
          <StatusPill label="ADD FRIENDLY" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {helpBranchCards.map((card) => (
          <div key={card.title} className={insetPanelClass}>
            <div className="text-sm font-bold text-white">{card.title}</div>
            <p className={`mt-2 ${subTextClass}`}>{card.body}</p>
            <RouteSteps steps={card.route} />
          </div>
        ))}
      </div>
    </section>
  );
}

function HelpFoundationOverviewPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            Help Overview
          </div>

          <h2 className="mt-1 text-xl font-black text-white">
            The Help system now has a real backbone
          </h2>

          <p className={`mt-2 ${subTextClass}`}>
            Find It, Route Maps, How Do I, What Is This, Quick Answers,
            Glossary, Tips, and What&apos;s New work together so members can
            find places, follow routes, understand words, and recover when they
            feel lost.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="HELP HOME" />
          <StatusPill label="CONTROL CENTER" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {helpCoreSectionSummaries.map((summary) => (
          <a
            key={summary.href}
            href={summary.href}
            className="rounded-2xl border border-white/10 bg-black/70 p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="text-sm font-bold text-white">{summary.title}</div>
            <p className={`mt-2 ${subTextClass}`}>{summary.body}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function HelpFoundationGuardrailsPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            Build Guardrails
          </div>

          <h2 className="mt-1 text-xl font-black text-white">
            Help grows from real app behavior
          </h2>

          <p className={`mt-2 ${subTextClass}`}>
            This page can get much bigger over time, but it should stay split
            into data files, small panels, and dropdown branches so the route
            stays easy to protect.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="GREEN FIRST" />
          <StatusPill label="NO NAV REDESIGN" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/70 p-4">
          <div className="text-sm font-bold text-white">Verified route</div>

          <RouteSteps steps={verifiedWorkflowSteps} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/70 p-4">
          <div className="text-sm font-bold text-white">
            Rules for future Help content
          </div>

          <div className="mt-3 grid gap-2">
            {foundationRules.map((rule) => (
              <div key={rule} className="text-sm leading-6 text-white/70">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HelpMainSections() {
  return (
    <>
      <FindItSectionPanel />

      <HelpSection
        id="how-do-i"
        eyebrow="How Do I?"
        title="Common member workflows"
        body="Step-by-step routes for the things members will do most often. Verified workflows come first."
        cards={howDoICards}
      />

      <HelpSection
        id="what-is-this"
        eyebrow="What Is This?"
        title="Core app concepts"
        body="Plain-language explanations for the major areas of The Muzes Garden."
        cards={whatIsThisCards}
      />

      <HelpSection
        id="routes"
        eyebrow="Routes"
        title="How to get from here to there"
        body="Navigation paths for moving through the app without guessing."
        cards={routeCards}
      />

      <QuickAnswersPanel answers={quickAnswers} />
    </>
  );
}

function HelpAppAreaSections() {
  return (
    <>
      <HelpSection
        id="library-help"
        eyebrow="Library"
        title="Library help"
        body="Help for uploaded tracks, Library search, tags, filters, track details, and audio sources."
        cards={libraryCards}
      />

      <HelpSection
        id="projects-help"
        eyebrow="Projects"
        title="Projects help"
        body="Help for project overview, project tracks, top tracks, project playback, metadata, and future relationships."
        cards={projectCards}
      />

      <HelpSection
        id="player-help"
        eyebrow="Player"
        title="Player help"
        body="Help for now playing, playback controls, current track information, and switching tracks."
        cards={playerCards}
      />

      <HelpSection
        id="search-help"
        eyebrow="Search"
        title="Search help"
        body="Help for finding tracks, metadata, projects, Help answers, and future global results."
        cards={searchCards}
      />
    </>
  );
}

function HelpSpecialAreaSections() {
  return (
    <>
      <RouteMapPanel maps={routeMaps} />

      <HelpSection
        id="track-matcher"
        eyebrow="Track Matcher"
        title="Track Matcher help foundation"
        body="Plain-language guidance for comparing tracks, loading Track A and Track B, reviewing lanes, and understanding future intelligence panels."
        cards={trackMatcherCards}
      />

      <HelpSection
        id="metadata-help"
        eyebrow="Metadata"
        title="Metadata help foundation"
        body="Help guidance for the app knowledge system: library, shelves, sections, records, relationships, and details."
        cards={metadataCards}
      />

      <HelpSection
        id="relationships-help"
        eyebrow="Relationships"
        title="Relationships help"
        body="Help for understanding how metadata records, Track Matcher lanes, projects, tracks, and future intelligence results connect."
        cards={relationshipCards}
      />

      <HelpSection
        id="setlists"
        eyebrow="Setlists"
        title="Project setlist help foundation"
        body="Basic guidance for understanding project order and future setlist controls."
        cards={setlistCards}
      />

      <HelpSection
        id="workspace-help"
        eyebrow="Workspace"
        title="Workspace help"
        body="Help for Projects as the current workspace, Track Matcher as the comparison workspace, and future app organization areas."
        cards={workspaceCards}
      />

      <HelpSection
        id="help-system"
        eyebrow="Help System"
        title="How this Help page works"
        body="Help for Find It, Route Maps, How Do I, What Is This, Tips, and What's New."
        cards={helpCards}
      />
    </>
  );
}

function HelpSupportSections() {
  return (
    <>
      <HelpSection
        id="tips"
        eyebrow="Tips"
        title="Small things that prevent confusion"
        body="Quick reminders for workflows that can be easy to miss."
        cards={tipCards}
      />

      <GlossaryPanel items={glossaryItems} />
      <WhatsNewPanel cards={whatsNewCards} />
    </>
  );
}

function HelpFoundationBody() {
  return (
    <div className="mt-6 grid gap-6">
      <HelpFoundationStartPanel />
      <HelpFoundationOverviewPanel />
      <HelpFoundationGuardrailsPanel />
      <HelpMainSections />
      <HelpAppAreaSections />
      <HelpSpecialAreaSections />
      <HelpSupportSections />
    </div>
  );
}

function HelpFoundationLayout() {
  return (
    <div className={pageShellClass}>
      <TitleBar />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <HelpHeroPanel />
        <HelpFoundationBody />
      </main>
    </div>
  );
}

export default function HelpFoundationController() {
  return <HelpFoundationLayout />;
}
