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
    label: "Relationship Graph",
    href: "/about/concepts/relationship-graph",
    note: "See the visual graph idea this knowledge system will use.",
  },
  {
    label: "Metadata Relationships",
    href: "/about/concepts/metadata-relationships",
    note: "See how individual metadata records connect.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "Return to the larger metadata manual page.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function MusicKnowledgeGraphConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Music Knowledge Graph"
      description="The music knowledge graph is the future connected map of songs, projects, sounds, theory, lyrics, prompts, relationships, and manual explanations."
    >
      <ManualStatusBanner status="Planned / foundation.">
        The seed metadata structure exists now. The full graph layer is still a
        future system.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A music knowledge graph is a connected web of information. It lets the
          app understand that a project can contain songs, a song can contain
          sections, a section can contain lyrics, lyrics can connect to meaning,
          and meaning can connect to metadata records.
        </p>

        <p>
          This is different from a normal list or folder. A graph lets the user
          follow connections across the app instead of only browsing one page at
          a time.
        </p>

        <p>
          In The Muzes Garden, the knowledge graph should eventually connect
          the{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata System
          </ManualInlineLink>
          , Projects, Find It, manual pages, player context, and AI generation
          memory.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why it matters">
        <p>
          Music work is not flat. A bass stem may relate to a project version,
          a timeline marker, a prompt, a metadata record, and a future repair
          task. A normal folder structure cannot explain that.
        </p>

        <p>
          The graph gives the app a way to show meaning. Instead of saying here
          is a file, the app can say here is the sound, here is what it belongs
          to, here is how it was made, here is what it means, and here is what
          you can do next.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future graph route examples">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Project → Song Version → Stem → Timeline Marker → Repair Loop
          </p>
          <p className="text-sm leading-7 text-white/70">
            Lyric Line → Meaning Note → Theme Record → Related Project
          </p>
          <p className="text-sm leading-7 text-white/70">
            Prompt Memory → Generated Track → Metadata Record → Find It Result
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Graph data model beyond the current seed records.</li>
          <li>• Visual graph browser for users.</li>
          <li>• Graph-aware Find It search results.</li>
          <li>• Links from project pages into metadata graph nodes.</li>
          <li>• Links from player context into graph explanations.</li>
          <li>• AI generation memory saved as graph relationships.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}