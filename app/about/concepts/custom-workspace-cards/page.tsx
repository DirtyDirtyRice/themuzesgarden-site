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
    label: "Member Workstations",
    href: "/about/concepts/member-workstations",
    note: "See the larger personal workspace system.",
  },
  {
    label: "User Notes",
    href: "/about/concepts/user-notes",
    note: "See how cards can hold notes and explanations.",
  },
  {
    label: "Right-Click Actions",
    href: "/about/concepts/right-click-actions",
    note: "See how users may create cards from context menus.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function CustomWorkspaceCardsConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Custom Workspace Cards"
      description="Custom workspace cards are future user-created blocks for notes, explanations, buttons, quick links, project context, and personal workflow helpers."
    >
      <ManualStatusBanner status="Planned.">
        Custom cards are not built yet. This page defines the target behavior so
        future workstation tools can be added without becoming random widgets.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          A custom workspace card is a small block the user can place inside a
          workspace. It might hold text, a button, a project explanation, a
          saved route, a reminder, a note, or a link to a track, record, or
          manual page.
        </p>

        <p>
          The card should be useful on its own, but it should also remain
          connected to the rest of The Muzes Garden. A card should know what it
          points to and why it exists.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why cards matter">
        <p>
          The user wants a system where members can customize their own working
          sections. Cards are one of the safest ways to do that because they are
          flexible without forcing every page to become a giant custom editor.
        </p>

        <p>
          A card could explain what a project is, store a next-step note, open a
          favorite route, show a saved Find It path, or describe why a song
          version exists.
        </p>

        <p>
          This connects directly to{" "}
          <ManualInlineLink href="/about/concepts/member-workstations">
            Member Workstations
          </ManualInlineLink>{" "}
          because workstations need reusable building blocks.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible card types">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Text explanation card.</li>
          <li>• Project note card.</li>
          <li>• Saved route card.</li>
          <li>• Track shortcut card.</li>
          <li>• Metadata watch card.</li>
          <li>• AI generation task card.</li>
          <li>• Manual explanation card.</li>
          <li>• Custom button card.</li>
        </ul>
      </ManualInfoSection>

      <ManualInfoSection title="Future workflow example">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Open Project → Create Card → Add Explanation → Link Track → Save to
            Workstation
          </p>
          <p className="text-sm leading-7 text-white/70">
            Right-Click Song → Create Note Card → Attach Metadata → Find Later
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Shared card data model.</li>
          <li>• Create card menu.</li>
          <li>• Card editing controls.</li>
          <li>• Safe card deletion and recovery.</li>
          <li>• Links from cards into projects, metadata, and Find It.</li>
          <li>• Searchable card text and card titles.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}