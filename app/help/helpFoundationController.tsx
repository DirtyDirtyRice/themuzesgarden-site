"use client";

import TitleBar from "../components/TitleBar";
import { helpJumpLinks, glossaryItems, quickAnswers } from "./helpFoundationDataCore";
import {
  howDoICards,
  routeCards,
  routeMaps,
} from "./helpFoundationDataWorkflows";
import {
  metadataCards,
  setlistCards,
  tipCards,
  trackMatcherCards,
  whatIsThisCards,
} from "./helpFoundationDataAreas";
import { whatsNewCards } from "./helpFoundationDataUpdates";
import { HelpHeroPanel } from "./helpFoundationHeroPanel";
import {
  GlossaryPanel,
  HelpSection,
  JumpToPanel,
  QuickAnswersPanel,
  RouteMapPanel,
  WhatsNewPanel,
} from "./helpFoundationSectionPanels";
import { pageShellClass, panelClass, subTextClass } from "./helpFoundationStyles";
import { StatusPill } from "./helpFoundationUiAtoms";

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
  "Keep Help based on verified workflows first.",
  "Keep Navigation focused on where members can go.",
  "Keep Help focused on how members get there.",
  "Do not redesign the TitleBar during this phase.",
  "Do not document fake controls as finished workflows.",
];

function HelpFoundationGuardrailsPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-wide text-white">
            Build Guardrails
          </div>
          <h2 className="mt-1 text-xl font-black text-white">
            Help grows from real app behavior
          </h2>
          <p className={`mt-2 ${subTextClass}`}>
            This page can get much bigger over time, but it should stay split
            into data files and small panels so the route stays easy to protect.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="GREEN FIRST" />
          <StatusPill label="NO NAV REDESIGN" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/25 bg-black p-4">
          <div className="text-sm font-bold text-white">Verified route</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {verifiedWorkflowSteps.map((step, index) => (
              <span key={`${step}-${index}`} className="flex items-center gap-2">
                <StatusPill label={step} />
                {index < verifiedWorkflowSteps.length - 1 ? (
                  <span className="text-xs font-bold text-white/70">↓</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/25 bg-black p-4">
          <div className="text-sm font-bold text-white">Rules for future Help content</div>
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
      <HelpSection
        id="how-do-i"
        eyebrow="How Do I?"
        title="Common member workflows"
        body="Step-by-step routes for the things members will do most often. Verified workflows come first."
        cards={howDoICards}
      />

      <QuickAnswersPanel answers={quickAnswers} />

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
        body="The beginning of plain-language guidance for the Track Matcher area."
        cards={trackMatcherCards}
      />

      <HelpSection
        id="metadata-help"
        eyebrow="Metadata"
        title="Metadata help foundation"
        body="The beginning of Help guidance for the app knowledge system."
        cards={metadataCards}
      />

      <HelpSection
        id="setlists"
        eyebrow="Setlists"
        title="Project setlist help foundation"
        body="Basic guidance for understanding project order and future setlist controls."
        cards={setlistCards}
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
      <JumpToPanel links={helpJumpLinks} />
      <HelpFoundationGuardrailsPanel />
      <HelpMainSections />
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
