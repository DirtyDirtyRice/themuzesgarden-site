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
    label: "Find It",
    href: "/about/find-it",
    note: "Return to the Find It manual page.",
  },
  {
    label: "Find It Paths",
    href: "/about/concepts/find-it-paths",
    note: "See route explanations.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function SearchSourcesPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Search Sources"
      description="Search sources describe where Find It results come from."
    >
      <ManualStatusBanner status="Building now.">
        Navigation and metadata sources exist. More source types are planned.
      </ManualStatusBanner>

      <ManualInfoSection title="Current sources">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Navigation Results
          </p>
          <p className="text-sm leading-7 text-white/70">
            Metadata Results
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Future sources">
        <p>
          Find It should eventually search more than routes. It should search
          projects, records, manual pages, relationship cards, player context,
          and future AI content.
        </p>

        <p>
          Every result should clearly identify where it came from so users are
          never confused by mixed result types.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}