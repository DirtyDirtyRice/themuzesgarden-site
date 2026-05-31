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
    label: "Timeline Markers",
    href: "/about/concepts/timeline-markers",
    note: "See how exact audio moments can be marked.",
  },
  {
    label: "Generation Repair Loop",
    href: "/about/concepts/generation-repair-loop",
    note: "See how problems can become repair tasks.",
  },
  {
    label: "Track Details",
    href: "/about/concepts/track-details",
    note: "See where audio problem notes should be displayed.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function AudioProblemNotesConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Audio Problem Notes"
      description="Audio problem notes are future comments attached to specific issues in a track, stem, timeline marker, generated output, or mix version."
    >
      <ManualStatusBanner status="Planned.">
        Problem notes are not a finished tool yet. This page defines the
        behavior so future player, marker, and repair systems connect cleanly.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          An audio problem note explains something wrong or questionable in a
          piece of audio. It might describe a bad vocal word, weak bass, harsh
          cymbal, wrong harmony, timing issue, mix problem, or strange generated
          artifact.
        </p>

        <p>
          The note should attach to the correct thing. Sometimes that is a whole
          track. Sometimes it is a stem. Sometimes it is an exact timeline
          marker.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why problem notes matter">
        <p>
          Music problems are easy to hear and easy to forget. A user may notice
          something wrong while listening, then lose the exact place later.
        </p>

        <p>
          Problem notes help turn a vague memory into an actionable task. They
          can connect listening to editing, metadata, and future AI repair.
        </p>

        <p>
          This connects directly to{" "}
          <ManualInlineLink href="/about/concepts/generation-repair-loop">
            Generation Repair Loop
          </ManualInlineLink>{" "}
          because repair starts with knowing what is wrong.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible problem note types">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Pronunciation problem.</li>
          <li>• Wrong lyric.</li>
          <li>• Weak hook.</li>
          <li>• Bad transition.</li>
          <li>• Mix issue.</li>
          <li>• Timing issue.</li>
          <li>• Generated artifact.</li>
          <li>• Stem-specific issue.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Future workflow">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Listen → Hear Problem → Add Problem Note → Attach Marker → Create
            Repair Task
          </p>
          <p className="text-sm leading-7 text-white/70">
            Problem Note → Metadata Tag → Find It Result → Repair History
          </p>
        </div>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}