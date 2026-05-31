"use client";

import ManualShell from "../../components/ManualShell";
import {
  ManualInfoSection,
  ManualRelatedLinks,
  ManualStatusBanner,
  type ManualRelatedLink,
} from "../../components/ManualCards";

const RELATED_LINKS: ManualRelatedLink[] = [
  {
    label: "Metadata Records",
    href: "/about/concepts/metadata-records",
    note: "Understand the records that relationships connect together.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "Return to the larger metadata overview.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function MetadataRelationshipsPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Metadata Relationships"
      description="Relationships are the links that connect records together into a knowledge graph."
    >
      <ManualStatusBanner status="Building now.">
        Relationship foundations exist, but the future browsing and visual
        exploration layers are still ahead.
      </ManualStatusBanner>

      <ManualInfoSection title="What a relationship is">
        <p>
          A relationship connects one metadata record to another. Instead of
          storing isolated information, the system can describe how concepts
          influence, explain, contain, reference, or depend on other concepts.
        </p>

        <p>
          This is the difference between a list of facts and a knowledge graph.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Example">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            C Major → Related To → Circle Of Fifths
          </p>
          <p className="text-sm leading-7 text-white/70">
            Chorus → Contains → Hook
          </p>
          <p className="text-sm leading-7 text-white/70">
            Project Alpha → Uses → Reference Song
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Why this matters">
        <p>
          Relationships are how the app eventually learns meaning. Instead of
          only storing information, it can explain why two things are connected.
        </p>

        <p>
          Future Find It searches, project pages, AI systems, and metadata
          records should all benefit from these connections.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}