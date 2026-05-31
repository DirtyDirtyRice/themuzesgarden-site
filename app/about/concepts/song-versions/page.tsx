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
    label: "Project Containers",
    href: "/about/concepts/project-containers",
    note: "See where versions should live.",
  },
  {
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See future generated version workflows.",
  },
];

export default function SongVersionsPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Song Versions"
      description="Song versions are different states of a piece of music over time."
    >
      <ManualStatusBanner status="Planned.">
        Version awareness is expected to become a major future project feature.
      </ManualStatusBanner>

      <ManualInfoSection title="Why versions matter">
        <p>
          Music creation is iterative. Songs change constantly. Without version
          awareness, important ideas disappear.
        </p>

        <p>
          The app should help preserve evolution instead of replacing history.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Possible version chain">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Original Idea → Demo → Arrangement Version → Mix Version →
            Master Version
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Future goals">
        <p>
          Users should be able to compare versions, listen to differences,
          inspect notes, and understand why a version changed.
        </p>

        <p>
          Future AI systems should create versions instead of overwriting work.
        </p>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}