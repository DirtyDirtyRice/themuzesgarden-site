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
    label: "Open Metadata",
    href: "/metadata",
    note: "Go to the working metadata entry point.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how metadata search appears in navigation.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See how project knowledge will connect to records.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See done, doing, and still-to-do.",
  },
];

export default function Page() {
  return (
    <ManualShell
      eyebrow="More Info"
      title="Metadata System"
      description="The Metadata System is the structured knowledge layer of The Muzes Garden. It is where music ideas, project context, records, and relationships become searchable and reusable."
    >
      <ManualStatusBanner status="Building now.">
        The foundation exists, starter records exist, and metadata results are
        being connected into Find It.
      </ManualStatusBanner>

      <ManualInfoSection title="What Metadata means here">
        <p>
          Metadata is not just tags. In The Muzes Garden, metadata is the
          structured knowledge system that lets the app describe music, project
          work, ideas, relationships, and future AI decisions.
        </p>

        <p>
          The current model is built as: Library → Shelves → Sections → Records
          → Relationships. That gives the app a stable way to organize music
          theory ideas, songwriting concepts, artist references, project phases,
          and eventually very detailed sound-shaping information.
        </p>

        <p>
          This structure matters because the app should not only store files. It
          should explain what those files mean and how they connect.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Current foundation">
        <p>
          The seed metadata library already contains starter shelves for music
          theory, songwriting, artists, and projects. It also includes records
          such as C Major, Verse / Chorus Form, and the Metadata Foundation
          Phase.
        </p>

        <p>
          Those starter records prove the shape of the system: records can have
          titles, slugs, visibility, excerpts, descriptions, fields, and
          relationships. That is enough to begin connecting metadata into{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>{" "}
          without guessing fake fields.
        </p>

        <p>
          The next important step is making metadata records searchable,
          navigable, and understandable from multiple places in the app.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="What it will become">
        <p>
          The long-term metadata system should support very deep explanation and
          relationship browsing. A word in a song, a chord change, a sound, an
          instrument, a lyric meaning, or a project note could all point to
          related records.
        </p>

        <p>
          This is the foundation for a future knowledge graph. Instead of only
          browsing pages, users should be able to follow meaning: a project can
          point to a song, the song can point to a chorus, the chorus can point
          to a chord progression, and the chord progression can point to a music
          theory explanation.
        </p>

        <p>
          Later, AI generation should use this same metadata foundation so
          prompts and outputs are not lost as random one-time events.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Metadata tree">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Library → Shelf → Section → Record → Field → Relationship → More
            Info → Search Result
          </p>
        </div>

        <p>
          This tree is intentionally simple right now. The goal is to keep the
          shape understandable before adding deeper relationship tools and large
          UI systems.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />

      <div className="mt-8">
        <Link
          href="/metadata"
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
        >
          Open working Metadata page
        </Link>
      </div>
    </ManualShell>
  );
}