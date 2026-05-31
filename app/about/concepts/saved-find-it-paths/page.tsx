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
    label: "Find It Paths",
    href: "/about/concepts/find-it-paths",
    note: "See the route explanation system saved paths come from.",
  },
  {
    label: "Navigation Tree",
    href: "/about/concepts/navigation-tree",
    note: "See how saved paths fit into the wider app map.",
  },
  {
    label: "Custom Workspace Cards",
    href: "/about/concepts/custom-workspace-cards",
    note: "See how saved paths could become workstation cards.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function SavedFindItPathsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Saved Find It Paths"
      description="Saved Find It paths are future reusable routes that let users return to important pages, records, project areas, and explanations without searching again."
    >
      <ManualStatusBanner status="Planned.">
        Find It can already show target paths. Saving those paths is a future
        workstation and navigation feature.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A saved path is a remembered route. If the user often travels from the
          home page to a project, a metadata record, a manual page, or a track
          detail page, the app should eventually let that route be saved.
        </p>

        <p>
          This is different from a normal browser bookmark. A saved Find It path
          should know the current page, the target page, the route steps, and
          why the path is useful.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why saved paths matter">
        <p>
          The Muzes Garden is planned to become very deep. Users should not have
          to remember every route manually, especially when the route crosses
          projects, metadata, manual pages, and player tools.
        </p>

        <p>
          Saved paths are especially useful for ADD workflows because they turn
          repeated navigation into visible shortcuts.
        </p>

        <p>
          A saved path could later appear inside a{" "}
          <ManualInlineLink href="/about/concepts/custom-workspace-cards">
            Custom Workspace Card
          </ManualInlineLink>{" "}
          or a member workstation.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible saved path examples">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Home → Manual → Concepts → Metadata Records
          </p>
          <p className="text-sm leading-7 text-white/70">
            Project → Track Details → Timeline Markers
          </p>
          <p className="text-sm leading-7 text-white/70">
            Metadata → Record → Relationship Graph
          </p>
          <p className="text-sm leading-7 text-white/70">
            AI Generator → Prompt Memory → Generation Repair Loop
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Future features">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Save current Find It result as a path.</li>
          <li>• Name saved paths.</li>
          <li>• Add saved paths to workstations.</li>
          <li>• Show saved paths in Find It suggestions.</li>
          <li>• Attach saved paths to projects or manual pages.</li>
          <li>• Use saved paths as onboarding and help routes.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}