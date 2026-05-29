"use client";

import Link from "next/link";

import ManualShell from "../components/ManualShell";
import ManualSystemGrid, {
  type ManualSystemCard,
} from "../components/ManualSystemGrid";
import { ManualInfoSection, ManualInlineLink } from "../components/ManualCards";

const CONCEPT_PAGES: ManualSystemCard[] = [
  {
    title: "Metadata Records",
    href: "/about/concepts/metadata-records",
    summary:
      "A plain explanation of records, fields, slugs, shelves, sections, and why metadata is more than tags.",
    whyItMatters:
      "Records are the units that let the app explain music ideas, project context, and future AI decisions.",
    status: "Building now",
  },
  {
    title: "Find It Paths",
    href: "/about/concepts/find-it-paths",
    summary:
      "How Find It should explain where you are, where you are going, and what route connects those pages.",
    whyItMatters:
      "A deep app needs route explanations so users do not have to memorize hidden menus or page structure.",
    status: "Building now",
  },
  {
    title: "Pronunciation Pipeline",
    href: "/about/concepts/pronunciation-pipeline",
    summary:
      "The planned lyric-to-singing process for pronunciation planning, checking, repairing, and saving versions.",
    whyItMatters:
      "The future generator needs singers to pronounce words correctly without forcing users to write phonetics by hand.",
    status: "Planned",
  },
];

export default function ConceptsPage() {
  return (
    <ManualShell
      eyebrow="Manual Concepts"
      title="Concept Pages"
      description="Concept pages are the next layer below the main manual. They explain important words and systems that appear across many parts of The Muzes Garden."
    >
      <ManualInfoSection title="Why concept pages exist">
        <p>
          The top-level manual pages explain big systems like{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata
          </ManualInlineLink>
          ,{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>
          , and{" "}
          <ManualInlineLink href="/about/ai-music-generator">
            AI Music Generator
          </ManualInlineLink>
          . Concept pages go one level deeper.
        </p>

        <p>
          This is the beginning of the Wikipedia-style structure. When a word or
          idea needs more explanation, it can become its own page instead of
          making every manual page too long.
        </p>
      </ManualInfoSection>

      <ManualSystemGrid
        title="First concept pages"
        body="These are starter concept pages that can later grow into a larger built-in encyclopedia."
        systems={CONCEPT_PAGES}
      />

      <ManualInfoSection title="Future concept tree">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Manual → System Page → Concept Page → Child Concept → Related
            Metadata Record → Find It Path
          </p>
        </div>

        <p>
          The final version should let important words inside manual text link
          naturally to deeper explanations.
        </p>
      </ManualInfoSection>

      <div className="mt-8">
        <Link
          href="/about"
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
        >
          Back to Manual Home
        </Link>
      </div>
    </ManualShell>
  );
}