"use client";

import Link from "next/link";

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
    label: "Metadata System",
    href: "/about/metadata",
    note: "See the larger system that records belong to.",
  },
  {
    label: "Find It Paths",
    href: "/about/concepts/find-it-paths",
    note: "See how records can become searchable destinations.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function MetadataRecordsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Metadata Records"
      description="Metadata records are the reusable explanation units inside The Muzes Garden knowledge system."
    >
      <ManualStatusBanner status="Building now.">
        Starter records exist in the seed library and are already beginning to
        appear inside Find It results.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A metadata record is one named piece of knowledge. It can explain a
          music theory concept, a songwriting structure, a project phase, an
          artist reference, a sound choice, or another reusable idea.
        </p>

        <p>
          A record is different from a tag. A tag is usually short. A record can
          have a title, description, fields, relationships, visibility, and a
          page that users can open.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Record shape">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Library → Shelf → Section → Record → Field → Relationship
          </p>
        </div>

        <p>
          The current seed records include examples like C Major, Verse / Chorus
          Form, and Metadata Foundation Phase. Those records prove the basic
          structure before deeper relationship tools are added.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why records matter">
        <p>
          Records are what let the app remember meaning. A project can point to
          a record. A track can point to a record. A future generator prompt can
          point to a record. Find It can search records.
        </p>

        <p>
          This is what turns the app from file storage into a connected music
          knowledge system. The{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata System
          </ManualInlineLink>{" "}
          is the library, and records are the individual explanations inside
          that library.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Richer record pages with better field layouts.</li>
          <li>• Relationship browsing between records.</li>
          <li>• Record search inside Find It with better ranking.</li>
          <li>• Record links from projects, tracks, and player details.</li>
          <li>• Manual words that link directly to matching metadata records.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />

      <div className="mt-8">
        <Link
          href="/metadata"
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
        >
          Open Metadata
        </Link>
      </div>
    </ManualShell>
  );
}