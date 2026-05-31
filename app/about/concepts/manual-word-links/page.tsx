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
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
  {
    label: "Navigation Tree",
    href: "/about/concepts/navigation-tree",
    note: "See how word links should remain part of a clear route structure.",
  },
  {
    label: "Metadata Records",
    href: "/about/concepts/metadata-records",
    note: "See how some manual words can connect to metadata records.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how manual pages may become searchable destinations.",
  },
];

export default function ManualWordLinksConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Manual Word Links"
      description="Manual word links are the future Wikipedia-style links inside explanation text that open deeper pages for important terms."
    >
      <ManualStatusBanner status="Building foundation.">
        The manual already has reusable inline links. The deeper automatic word
        linking and child-page system is still ahead.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A manual word link is a clickable word or phrase inside explanation
          text. When a term needs more explanation, the user should be able to
          click it and open a deeper concept page.
        </p>

        <p>
          This is the system that makes the manual feel like an encyclopedia
          instead of a stack of disconnected pages.
        </p>

        <p>
          For example, a page about Projects can link the phrase{" "}
          <ManualInlineLink href="/about/concepts/song-versions">
            Song Versions
          </ManualInlineLink>{" "}
          to a deeper explanation instead of explaining everything on the same
          page.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why word links matter">
        <p>
          Deep apps become confusing when every page tries to explain everything
          at once. Word links let pages stay readable while still allowing the
          user to go deeper.
        </p>

        <p>
          They are also important for ADD workflows because users can follow the
          exact word they do not understand instead of searching through a giant
          help document.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future link types">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Manual concept links.</li>
          <li>• Metadata record links.</li>
          <li>• Project page links.</li>
          <li>• Track detail links.</li>
          <li>• Find It saved path links.</li>
          <li>• Relationship graph links.</li>
          <li>• Generator workflow links.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Connection to Find It">
        <p>
          Manual word links should eventually appear in{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>{" "}
          search results. If a user searches for a word like stems, prompts,
          relationship graph, or pronunciation, the matching manual concept page
          should appear.
        </p>

        <p>
          That turns the manual into a searchable knowledge layer rather than a
          separate document.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}