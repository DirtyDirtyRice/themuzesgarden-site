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
    label: "Projects",
    href: "/about/projects",
    note: "Return to the Projects manual page.",
  },
  {
    label: "Song Versions",
    href: "/about/concepts/song-versions",
    note: "See how project versions should work.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function ProjectContainersPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Project Containers"
      description="Projects are intended to become containers for music work, context, notes, versions, metadata, and future AI activity."
    >
      <ManualStatusBanner status="Working foundation.">
        Projects exist now, but the deeper container architecture is still being expanded.
      </ManualStatusBanner>

      <ManualInfoSection title="Container philosophy">
        <p>
          A project should not be a folder full of files. It should explain what
          the user is creating, what assets belong together, and why those
          assets matter.
        </p>

        <p>
          The goal is for every important piece of music work to have a home.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future contents">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Songs</li>
          <li>• Stems</li>
          <li>• Lyrics</li>
          <li>• Prompt history</li>
          <li>• Notes</li>
          <li>• Metadata records</li>
          <li>• Relationship maps</li>
          <li>• AI generation history</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}