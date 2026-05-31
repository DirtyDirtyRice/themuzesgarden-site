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
    label: "Global Player",
    href: "/about/global-player",
    note: "See the playback system track details should connect to.",
  },
  {
    label: "Stems",
    href: "/about/concepts/stems",
    note: "See how separate song parts should be explained.",
  },
  {
    label: "Metadata Records",
    href: "/about/concepts/metadata-records",
    note: "See how track details can connect to reusable records.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function TrackDetailsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Track Details"
      description="Track details are the future explanation layer for a piece of audio: what it is, where it belongs, what it contains, and what can be done with it."
    >
      <ManualStatusBanner status="Planned / foundation.">
        Basic listening exists now, but the richer track detail layer still
        needs to be built and connected to projects, metadata, and player state.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          Track details are the information attached to an audio item. A track
          should eventually explain its title, project, version, source,
          description, tags, metadata records, relationships, notes, stems,
          lyrics, prompt history, and playback context.
        </p>

        <p>
          This matters because listening alone is not enough. The user often
          needs to know what the track is, why it exists, what version it is,
          what problems it has, and what should happen next.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Connection to the player">
        <p>
          The{" "}
          <ManualInlineLink href="/about/global-player">
            Global Player
          </ManualInlineLink>{" "}
          should eventually expose track details directly. If a sound is
          playing, the user should be able to open its details without hunting
          through folders or pages.
        </p>

        <p>
          Track details should help answer: what am I listening to, where is it
          stored, what project uses it, what metadata describes it, and what
          related work exists?
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible detail sections">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Basic title, artist, source, and project.</li>
          <li>• Version and stem information.</li>
          <li>• Notes and user comments.</li>
          <li>• Metadata records and relationship links.</li>
          <li>• Lyrics and meaning notes.</li>
          <li>• Prompt and generation history.</li>
          <li>• Timeline markers and problem spots.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Future workflow example">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Play Track → Open Details → View Project → Inspect Stems → Open
            Metadata → Add Note → Return to Player
          </p>
        </div>

        <p>
          This workflow keeps sound, explanation, and action connected inside
          one system.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Find It connection">
        <p>
          Future track detail pages should appear in{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>
          . A user should be able to search for a track name, project note,
          lyric fragment, metadata term, or problem description and land on the
          correct track detail page.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}