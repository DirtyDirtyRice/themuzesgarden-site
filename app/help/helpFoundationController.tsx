"use client";

import {
  glossaryItems,
  helpJumpLinks,
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
import {
  FindItSectionPanel,
  GlossaryPanel,
  HelpSection,
  QuickAnswersPanel,
  RouteMapPanel,
  WhatsNewPanel,
} from "./helpFoundationSectionPanels";
import { pageShellClass } from "./helpFoundationStyles";
import type { HelpCard } from "./helpFoundationTypes";

type HelpControlCard = {
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  icon: string;
  iconClass: string;
};

type HelpMetricCard = {
  label: string;
  value: string;
  detail: string;
  icon: string;
  iconClass: string;
};

type HelpQuickLinkCard = {
  label: string;
  href: string;
  detail: string;
  icon: string;
  iconClass: string;
};

const mainClass =
  "mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 lg:px-10";

const sectionRuleClass = "border-t border-white/10 pt-4";

const panelClass =
  "rounded-[2rem] border border-white/15 bg-black p-5 shadow-2xl shadow-black/35";

const cardClass =
  "rounded-3xl border border-white/15 bg-black p-5 shadow-2xl shadow-black/20";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-black px-4 py-2 text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const eyebrowClass =
  "text-xs font-black uppercase tracking-[0.28em] text-white/70";

const bodyClass = "text-sm leading-6 text-white/70";

const helpControlCards: HelpControlCard[] = [
  {
    title: "I'm Lost",
    body: "Start with Find It when you know the goal but not the page.",
    href: "#find-it",
    actionLabel: "Open Find It",
    icon: "?",
    iconClass: "from-sky-500 to-blue-700",
  },
  {
    title: "How Do I?",
    body: "Use workflow help for upload, projects, playback, and recovery.",
    href: "#how-do-i",
    actionLabel: "Open Workflows",
    icon: "✓",
    iconClass: "from-emerald-500 to-green-700",
  },
  {
    title: "Route Maps",
    body: "Use literal click paths when the order of steps matters.",
    href: "#route-maps",
    actionLabel: "Open Routes",
    icon: "↳",
    iconClass: "from-violet-600 to-fuchsia-500",
  },
  {
    title: "Definitions",
    body: "Use What Is This and Glossary when app words need meaning.",
    href: "#what-is-this",
    actionLabel: "Open Terms",
    icon: "Aa",
    iconClass: "from-yellow-500 to-orange-600",
  },
];

const helpMetricCards: HelpMetricCard[] = [
  {
    label: "Quick Answers",
    value: String(quickAnswers.length),
    detail: "Fast answers for common confusion",
    icon: "!",
    iconClass: "text-sky-400",
  },
  {
    label: "Routes",
    value: String(routeMaps.length + routeCards.length),
    detail: "Route maps and route cards",
    icon: "↳",
    iconClass: "text-violet-400",
  },
  {
    label: "Workflows",
    value: String(howDoICards.length),
    detail: "How Do I workflow guides",
    icon: "✓",
    iconClass: "text-emerald-400",
  },
  {
    label: "Glossary",
    value: String(glossaryItems.length),
    detail: "Plain-language definitions",
    icon: "Aa",
    iconClass: "text-yellow-400",
  },
];

const quickLinkCards: HelpQuickLinkCard[] = [
  {
    label: "Find It",
    href: "#find-it",
    detail: "Search for the page, tool, or workflow",
    icon: "⌕",
    iconClass: "text-sky-400",
  },
  {
    label: "Current Systems",
    href: "#library-help",
    detail: "Library, Projects, Player, and Search",
    icon: "▣",
    iconClass: "text-pink-400",
  },
  {
    label: "System Status",
    href: "#whats-new",
    detail: "Recent foundation updates and status",
    icon: "◇",
    iconClass: "text-cyan-400",
  },
  {
    label: "Metadata Help",
    href: "#metadata-help",
    detail: "Records, shelves, sections, and relationships",
    icon: "✧",
    iconClass: "text-fuchsia-400",
  },
  {
    label: "Track Matcher",
    href: "#track-matcher",
    detail: "Comparison lanes and audio intelligence",
    icon: "♬",
    iconClass: "text-orange-400",
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

function HelpHero() {
  return (
    <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <p className={eyebrowClass}>The Muzes Garden</p>

        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
          Help is the recovery center.
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-7 text-white/70">
          Start with one question. Open one help branch. Go deeper only when you
          need the details. The full Help encyclopedia is still here, but it no
          longer owns the whole page at once.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a href="#find-it" className={buttonClass}>
            Start Here
          </a>

          <a href="#deep-help-library" className={buttonClass}>
            Open Full Help
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/15 bg-black p-6 shadow-2xl shadow-black/25 lg:mx-auto lg:w-full lg:max-w-[520px]">
        <p className={eyebrowClass}>How to use Help</p>

        <h2 className="mt-3 text-2xl font-black leading-tight text-white">
          Pick the closest question. Then follow the route chips.
        </h2>

        <p className="mt-4 text-base leading-7 text-white/70">
          If you feel lost, use Find It first. If you need exact clicks, use
          Route Maps. If a word is confusing, use What Is This or Glossary.
        </p>
      </div>
    </section>
  );
}

function HelpControlCenter() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>Help Control Center</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {helpControlCards.map((card) => (
          <article key={card.title} className={cardClass}>
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconClass} text-2xl font-black text-white shadow-2xl shadow-black/40`}
              >
                {card.icon}
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-black text-white">
                  {card.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  {card.body}
                </p>

                <a href={card.href} className="mt-4 inline-flex">
                  <span className={buttonClass}>{card.actionLabel}</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HelpAtAGlance() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>At a Glance</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {helpMetricCards.map((metric) => (
          <article key={metric.label} className={cardClass}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-black ${metric.iconClass}`}>
                  {metric.label}
                </p>

                <div className={`mt-1 text-4xl font-black ${metric.iconClass}`}>
                  {metric.value}
                </div>
              </div>

              <div className={`text-4xl font-black ${metric.iconClass}`}>
                {metric.icon}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-white/70">
              {metric.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HelpQuickLinks() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>Quick Links</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {quickLinkCards.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex min-h-16 items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-black text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`text-lg ${link.iconClass}`}>{link.icon}</span>

              <span className="min-w-0">
                <span className="block truncate">{link.label}</span>
                <span className="block truncate text-xs font-medium text-white/70">
                  {link.detail}
                </span>
              </span>
            </span>

            <span className="text-white/70">›</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function HelpRecentActivity() {
  return (
    <section className={sectionRuleClass}>
      <p className={eyebrowClass}>Recovery Shortcut</p>

      <div className={`mt-3 ${panelClass}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black text-4xl text-white">
              ✧
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  The fastest route when you feel lost
                </h2>

                <span className="rounded-full border border-white/15 bg-black px-2 py-1 text-xs font-black text-white/70">
                  ADD Friendly
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                Open Help, choose Find It, search for the thing you want, then
                follow the visible route chips one step at a time.
              </p>
            </div>
          </div>

          <div className="flex h-20 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-4xl text-white/50 sm:w-32">
            ◷
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepHelpLibrary() {
  return (
    <section id="deep-help-library" className={sectionRuleClass}>
      <details className={`${panelClass} group overflow-hidden`}>
        <summary className="-m-2 flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 rounded-2xl p-2 transition-transform duration-150 hover:-translate-y-0.5 [&::-webkit-details-marker]:hidden">
          <div>
            <p className={eyebrowClass}>Full Help Library</p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Open the detailed Help encyclopedia only when you need it.
            </h2>

            <p className={`mt-2 max-w-4xl ${bodyClass}`}>
              The complete Help system is still preserved here. This keeps the
              page simple at first, while still allowing every Help branch to go
              deep when you choose to open it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs font-black uppercase tracking-wide text-white/70">
              {helpJumpLinks.length} branches
            </span>

            <span className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs font-black uppercase tracking-wide text-white/70 group-open:hidden">
              Open
            </span>

            <span className="hidden rounded-xl border border-white/10 bg-black px-3 py-2 text-xs font-black uppercase tracking-wide text-white/70 group-open:inline-flex">
              Close
            </span>
          </div>
        </summary>

        <div className="mt-5 grid gap-5 border-t border-white/10 pt-5">
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

          <HelpSection
            id="tips"
            eyebrow="Tips"
            title="Small things that prevent confusion"
            body="Quick reminders for workflows that can be easy to miss."
            cards={tipCards}
          />

          <GlossaryPanel items={glossaryItems} />
          <WhatsNewPanel cards={whatsNewCards} />
        </div>
      </details>
    </section>
  );
}

function HelpFoundationLayout() {
  return (
    <div className={pageShellClass}>
      <main className={mainClass}>
        <HelpHero />
        <HelpControlCenter />
        <HelpAtAGlance />
        <HelpRecentActivity />
        <HelpQuickLinks />
        <DeepHelpLibrary />
      </main>
    </div>
  );
}

export default function HelpFoundationController() {
  return <HelpFoundationLayout />;
}
