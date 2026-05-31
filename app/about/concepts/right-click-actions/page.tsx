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
    label: "Track Details",
    href: "/about/concepts/track-details",
    note: "See one place where context actions should appear.",
  },
  {
    label: "Metadata Records",
    href: "/about/concepts/metadata-records",
    note: "See the record targets that context actions may create or open.",
  },
  {
    label: "Project Containers",
    href: "/about/concepts/project-containers",
    note: "See where user-created workspace content should live.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function RightClickActionsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Right-Click Actions"
      description="Right-click actions are future context menus that let users create, explain, connect, or inspect something directly from where they are."
    >
      <ManualStatusBanner status="Planned.">
        Context-create actions are not finished yet. This page documents the
        intended behavior before the feature is built deeply.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A right-click action is a menu that appears when the user right-clicks
          something in the app. The action should understand context. Right
          clicking a track should offer different choices than right clicking a
          manual word, a project card, a metadata record, or a timeline marker.
        </p>

        <p>
          The goal is to let users create and explain things without hunting for
          the correct page first.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future examples">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Right-click a project card → add project note.</li>
          <li>• Right-click a track → open track details or attach metadata.</li>
          <li>• Right-click a lyric line → add meaning note.</li>
          <li>• Right-click a timeline moment → create marker.</li>
          <li>• Right-click a manual word → create deeper explanation page.</li>
          <li>• Right-click a metadata record → add relationship.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Why this matters">
        <p>
          The Muzes Garden is becoming a deep system. If every action requires
          navigating through menus first, the app will feel slow and confusing.
        </p>

        <p>
          Context actions let the app ask: what is the user pointing at right
          now, and what useful actions belong to that thing?
        </p>

        <p>
          This connects to the future{" "}
          <ManualInlineLink href="/about/concepts/music-knowledge-graph">
            Music Knowledge Graph
          </ManualInlineLink>{" "}
          because context actions can create new graph links directly from
          visible items.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Shared context-menu component.</li>
          <li>• Safe action permissions by item type.</li>
          <li>• Create-note actions.</li>
          <li>• Create-metadata-record actions.</li>
          <li>• Create-relationship actions.</li>
          <li>• Find It integration for context-created pages.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}