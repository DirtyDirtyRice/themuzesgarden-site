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
    label: "Find It",
    href: "/about/find-it",
    note: "See the larger navigation helper system.",
  },
  {
    label: "Metadata Records",
    href: "/about/concepts/metadata-records",
    note: "See how records become searchable destinations.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function FindItPathsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Find It Paths"
      description="Find It paths are the route explanations that show how a user gets from where they are now to the destination they are trying to reach."
    >
      <ManualStatusBanner status="Building now.">
        Target path display works for navigation results, and metadata results
        are being added carefully without guessing fields.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A Find It path is not just a search result. It is the explanation of
          how a result fits inside the app.
        </p>

        <p>
          The user should be able to see the current page, the target page, the
          route steps, and whether they are already there before clicking
          anything.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why paths matter">
        <p>
          The Muzes Garden is planned to have projects, metadata records, manual
          pages, relationship pages, player tools, and future generator tools.
          That is too much to navigate by memory.
        </p>

        <p>
          Find It paths are the safety layer. They help the user understand the
          app structure instead of just jumping somewhere blindly.
        </p>

        <p>
          This is especially important for ADD workflows because it reduces the
          mental work of remembering where every page lives.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future path examples">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Home → Manual → Metadata System → Metadata Records
          </p>
          <p className="text-sm leading-7 text-white/70">
            Project → Track → Metadata Record → Relationship → More Info
          </p>
          <p className="text-sm leading-7 text-white/70">
            Find It → Search Result → Target Path → Go Button
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Connection to metadata">
        <p>
          When{" "}
          <ManualInlineLink href="/about/concepts/metadata-records">
            Metadata Records
          </ManualInlineLink>{" "}
          appear in Find It, they also need understandable paths. A record should
          not feel like a random result. It should show where it belongs in the
          library and why it appeared.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}