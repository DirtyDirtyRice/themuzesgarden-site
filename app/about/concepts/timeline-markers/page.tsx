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
    label: "Track Details",
    href: "/about/concepts/track-details",
    note: "See where timeline markers should live.",
  },
  {
    label: "Stems",
    href: "/about/concepts/stems",
    note: "See how markers can attach to separate audio parts.",
  },
  {
    label: "Find It Paths",
    href: "/about/concepts/find-it-paths",
    note: "See how marker destinations could become searchable routes.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function TimelineMarkersConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Timeline Markers"
      description="Timeline markers are future notes attached to exact moments in audio, such as hooks, problems, transitions, lyric moments, and regeneration targets."
    >
      <ManualStatusBanner status="Planned.">
        Timeline marker documentation is being added before the full marker
        tool exists so future audio workflows have a clear target.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A timeline marker is a note attached to a specific time inside a
          track. Instead of saying the chorus has a problem somewhere, the user
          could mark the exact second where the problem happens.
        </p>

        <p>
          Markers could identify hooks, transitions, vocal mistakes, strong
          moments, weak moments, lyric sections, generated artifacts, drum
          fills, harmony entries, or mix problems.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why markers matter">
        <p>
          Music is time-based. A normal note is often too vague. If the app can
          attach information to a specific moment, the user can return to that
          moment quickly and understand why it mattered.
        </p>

        <p>
          Markers also help future AI workflows. Instead of regenerating an
          entire song, the user may want to repair one phrase, one transition,
          one stem, or one pronunciation problem.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible marker types">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Hook marker</li>
          <li>• Problem marker</li>
          <li>• Transition marker</li>
          <li>• Lyric marker</li>
          <li>• Pronunciation issue marker</li>
          <li>• Stem-specific marker</li>
          <li>• Regeneration target marker</li>
          <li>• Arrangement note marker</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Future route example">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Project → Track Details → Timeline Marker → Metadata Note →
            Regeneration Task → Saved Version
          </p>
        </div>

        <p>
          This is how the manual, player, metadata, and generator can all
          connect around one exact audio moment.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Connection to Find It">
        <p>
          A mature{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>{" "}
          system should eventually find timeline markers. The user might search
          for hook, bad vocal, second chorus, bass problem, or pronunciation
          issue and jump straight to the relevant marker.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}