"use client";

import ManualShell from "../../components/ManualShell";
import {
  ManualInfoSection,
  ManualInlineLink,
  ManualRelatedLinks,
  ManualStatusBanner,
  type ManualRelatedLink,
} from "../../components/ManualCards";

const RELATED_LINKS: ManualRelatedLink[] = [
  {
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See the larger planned generator system.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See where lyric and pronunciation knowledge can be stored.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function PronunciationPipelineConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Pronunciation Pipeline"
      description="The pronunciation pipeline is the planned process for helping future AI singers pronounce normal written lyrics correctly."
    >
      <ManualStatusBanner status="Planned.">
        This is future behavior. It is documented now so the generator
        architecture can be built around it later.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          The user should be able to write normal lyrics. The app should do the
          hard internal work of planning how those words should be sung.
        </p>

        <p>
          The user should not have to manually write fake phonetics for every
          word just to make the singer pronounce lyrics correctly.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Pipeline idea">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Lyrics → Pronunciation Planning → Singing Generation →
            Pronunciation Check → Repair / Regenerate → Save Version
          </p>
        </div>

        <p>
          This loop is important because generation is not finished when audio
          appears. The app should check whether the output actually matches the
          user's intent.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Connection to metadata">
        <p>
          Pronunciation choices should eventually connect to the{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata System
          </ManualInlineLink>
          . That could let the app remember pronunciation decisions, lyric
          problem spots, singer behavior, and successful repair strategies.
        </p>

        <p>
          This turns pronunciation from a one-time correction into reusable
          knowledge.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Lyric input with normal text.</li>
          <li>• Internal pronunciation planning.</li>
          <li>• Singing generation connection.</li>
          <li>• Pronunciation verification.</li>
          <li>• Repair and regeneration loop.</li>
          <li>• Saved versions tied to projects and metadata.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}