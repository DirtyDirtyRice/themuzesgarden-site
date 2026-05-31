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
    label: "Member Workstations",
    href: "/about/concepts/member-workstations",
    note: "See where personal notes should live.",
  },
  {
    label: "Project Containers",
    href: "/about/concepts/project-containers",
    note: "See how notes connect to projects.",
  },
  {
    label: "Timeline Markers",
    href: "/about/concepts/timeline-markers",
    note: "See how notes can attach to exact audio moments.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function UserNotesConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="User Notes"
      description="User notes are future personal or project-specific explanations that help users remember decisions, problems, ideas, and next steps."
    >
      <ManualStatusBanner status="Planned / foundation.">
        Notes are part of the future workspace system. The manual is defining
        where they should connect before building the deeper note tools.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A user note is a written piece of context created by the user. It may
          describe why a song exists, what problem a track has, what prompt
          worked, what lyric needs changing, or what should happen next.
        </p>

        <p>
          Notes should not be random loose text. They should attach to useful
          things: projects, songs, stems, timeline markers, metadata records,
          prompts, player moments, and future workstation cards.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why notes matter">
        <p>
          Creative work creates lots of small decisions. If the app cannot save
          those decisions, the user has to remember everything. That is a bad
          fit for deep music work and especially bad for ADD workflows.
        </p>

        <p>
          Notes are one of the main ways the app can become a memory layer. They
          let the user leave instructions for themselves and keep those notes
          attached to the correct object.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible note targets">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Project notes.</li>
          <li>• Track notes.</li>
          <li>• Stem notes.</li>
          <li>• Timeline marker notes.</li>
          <li>• Lyric meaning notes.</li>
          <li>• Prompt memory notes.</li>
          <li>• Metadata record notes.</li>
          <li>• Personal workstation notes.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Connection to other systems">
        <p>
          Notes should connect to{" "}
          <ManualInlineLink href="/about/concepts/member-workstations">
            Member Workstations
          </ManualInlineLink>
          , Projects, Metadata, and Find It. A note should be easy to create,
          easy to find, and clearly tied to the thing it explains.
        </p>

        <p>
          Eventually, Find It should search notes so a user can type a phrase
          they remember and jump back to the right project, track, marker, or
          concept.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}