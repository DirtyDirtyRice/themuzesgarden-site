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
    note: "See the project container system workstations should connect to.",
  },
  {
    label: "Right-Click Actions",
    href: "/about/concepts/right-click-actions",
    note: "See how users may create custom workspace items in context.",
  },
  {
    label: "Navigation Tree",
    href: "/about/concepts/navigation-tree",
    note: "See how custom pages need to remain findable.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function MemberWorkstationsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Member Workstations"
      description="Member workstations are the future customizable areas where users can shape their own workspace around projects, notes, buttons, explanations, and creative tasks."
    >
      <ManualStatusBanner status="Planned.">
        This is a future customization system. It is documented now so the app
        can grow toward user-created workspaces instead of fixed pages only.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A member workstation is a personal working area inside the app. It
          should let users create sections, notes, buttons, explanation cards,
          and project-specific layouts that match how they work.
        </p>

        <p>
          Instead of forcing every user into the same screen, the workstation
          should eventually let users build their own working surfaces while
          still staying connected to the main app systems.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future create button">
        <p>
          A future Create button in the title bar could open a menu of things a
          member can create: project notes, custom cards, quick links, manual
          explanations, relationship notes, track comments, or workspace
          sections.
        </p>

        <p>
          This should connect with{" "}
          <ManualInlineLink href="/about/concepts/right-click-actions">
            Right-Click Actions
          </ManualInlineLink>{" "}
          so users can create items from the title bar or directly from the
          thing they are looking at.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="What a workstation may contain">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Custom buttons.</li>
          <li>• Project explanation cards.</li>
          <li>• Personal notes.</li>
          <li>• Saved Find It paths.</li>
          <li>• Track shortcuts.</li>
          <li>• Metadata watch lists.</li>
          <li>• AI generation task boards.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Why it matters">
        <p>
          Music workflows are personal. One user may want lyrics first. Another
          may want audio versions first. Another may want metadata and notes.
          Workstations should eventually let each member build the layout that
          helps them stay focused.
        </p>

        <p>
          The workstation should still be searchable through Find It and visible
          in the navigation tree so customization does not become chaos.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}