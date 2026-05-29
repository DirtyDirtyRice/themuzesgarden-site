"use client";

import Link from "next/link";

import ManualShell from "../components/ManualShell";
import {
  ManualInfoSection,
  ManualInlineLink,
  ManualRelatedLinks,
  ManualStatusBanner,
  type ManualRelatedLink,
} from "../components/ManualCards";

const RELATED_LINKS: ManualRelatedLink[] = [
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See the knowledge base the generator should use.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See where generated material should be stored.",
  },
  {
    label: "Global Player",
    href: "/about/global-player",
    note: "See how generated audio will be heard, compared, and saved.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See the future roadmap.",
  },
];

export default function Page() {
  return (
    <ManualShell
      eyebrow="More Info"
      title="AI Music Generator"
      description="The future AI Music Generator is planned as a serious creation system for prompts, lyrics, pronunciation, timing, sound design, regeneration, metadata, and project storage."
    >
      <ManualStatusBanner status="Planned.">
        This is future behavior, not a finished current tool. The architecture
        is being prepared through Projects, Metadata, Find It, and the Global
        Player.
      </ManualStatusBanner>

      <ManualInfoSection title="What the generator is planned to be">
        <p>
          The future AI Music Generator is not meant to be a simple prompt box.
          It should become a controlled music creation workstation where the
          user can describe lyrics, sound, arrangement, mood, style, timing,
          instruments, and corrections in normal language.
        </p>

        <p>
          The system should connect generation to{" "}
          <ManualInlineLink href="/about/projects">
            Projects
          </ManualInlineLink>{" "}
          so created audio does not disappear into a random download folder.
          Generated tracks should belong to projects, versions, notes, metadata,
          prompts, and future comparison tools.
        </p>

        <p>
          The larger goal is to make generation understandable. The app should
          remember what was asked, what was created, what worked, what failed,
          and what the user wanted to change next.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Pronunciation pipeline">
        <p>
          One of the major planned systems is a pronunciation pipeline for sung
          lyrics. The user should be able to write normal lyrics without being
          forced to manually spell every word phonetically.
        </p>

        <p>
          Internally, the generator should plan pronunciation, convert words
          into singing-friendly guidance, generate the audio, verify the sung
          result, and regenerate or repair sections that were pronounced wrong.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Lyrics → Pronunciation Planning → Singing Generation →
            Pronunciation Check → Repair / Regenerate → Save Version
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Metadata connection">
        <p>
          The generator should eventually use the{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata System
          </ManualInlineLink>{" "}
          as a memory layer. Prompts, styles, instruments, chord changes,
          timing choices, lyrics, and generation notes should become searchable
          instead of being trapped inside one output.
        </p>

        <p>
          That means a generated sound could later be found through Find It, a
          project page, a metadata relationship, or a manual explanation page.
        </p>

        <p>
          This is why the metadata foundation matters before the generator is
          built deeply. The app needs a place to store meaning before AI output
          can become truly reusable.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future generator modules">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Lyric and prompt input.</li>
          <li>• Pronunciation planning and verification.</li>
          <li>• Prompt-within-prompt structures.</li>
          <li>• Timing and section control.</li>
          <li>• Instrument and sound-shaping metadata.</li>
          <li>• Regeneration and repair loop.</li>
          <li>• Project save and version history.</li>
          <li>• Searchable generation memory.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />

      <div className="mt-8">
        <Link
          href="/about/site-tree"
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
        >
          View generator roadmap context
        </Link>
      </div>
    </ManualShell>
  );
}