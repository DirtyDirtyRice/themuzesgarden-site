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
    label: "Project Containers",
    href: "/about/concepts/project-containers",
    note: "See where stems should live inside project structure.",
  },
  {
    label: "Song Versions",
    href: "/about/concepts/song-versions",
    note: "See how stems can change across versions.",
  },
  {
    label: "Global Player",
    href: "/about/global-player",
    note: "See how playback should eventually connect to track parts.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function StemsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Stems"
      description="Stems are separate audio parts of a song, such as drums, bass, vocals, instruments, harmonies, and generated layers."
    >
      <ManualStatusBanner status="Planned / foundation.">
        Stem awareness is part of the future project and player architecture.
        The manual is documenting it now so future pages have a stable place to
        connect.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A stem is a separated part of a song. Instead of one finished audio
          file, the music can be broken into pieces such as drums, bass, lead
          vocal, backing vocal, guitar, piano, synth, effects, or generated
          layers.
        </p>

        <p>
          Stems matter because they let the user inspect and work on smaller
          musical pieces. A whole mix might sound wrong, but the real problem
          could be only the vocal, only the snare, only the bass, or only a
          transition layer.
        </p>

        <p>
          In The Muzes Garden, stems should eventually connect to{" "}
          <ManualInlineLink href="/about/concepts/project-containers">
            Project Containers
          </ManualInlineLink>
          , the player, metadata records, and future AI tools.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why stems matter inside projects">
        <p>
          Projects should not only know that a song exists. They should know
          what parts make up the song. If the user has a project with five
          versions, each version may have different stems, different generated
          layers, and different notes.
        </p>

        <p>
          A strong stem system lets a project answer questions like: which vocal
          take belongs to this version, which bass part changed, which generated
          harmony was kept, and which drum layer came from an earlier version?
        </p>

        <p>
          That is why stems belong in the same long-term structure as{" "}
          <ManualInlineLink href="/about/concepts/song-versions">
            Song Versions
          </ManualInlineLink>
          . Versions explain the timeline of a song, while stems explain the
          parts inside each version.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future stem tree">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Project → Song → Version → Stem Group → Stem File → Notes
          </p>
          <p className="text-sm leading-7 text-white/70">
            Stem → Metadata Record → Relationship → More Info
          </p>
          <p className="text-sm leading-7 text-white/70">
            Stem → Player Moment → Problem Note → Regeneration Task
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Metadata connection">
        <p>
          Stems should eventually be described by metadata. A stem might have
          tags for instrument, mood, section, source, generation prompt,
          recording take, mix status, key, BPM, or relationship to another
          sound.
        </p>

        <p>
          This would allow Find It and future search tools to locate a specific
          sound inside a project. The user should be able to search for things
          like vocal harmony, weak bass, chorus drum layer, or generated guitar
          and get useful destinations.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Stem upload and organization inside projects.</li>
          <li>• Stem groups for vocals, drums, bass, instruments, and effects.</li>
          <li>• Player controls for isolated stem playback.</li>
          <li>• Metadata records linked to stem files.</li>
          <li>• Notes attached to specific stems and song moments.</li>
          <li>• Future AI regeneration tasks for one stem instead of the full song.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}