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
    label: "Open Projects",
    href: "/workspace/projects",
    note: "Go to the working project list.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See how project knowledge will connect to records.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how users will find project pages and project explanations.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See where Projects sit in the full roadmap.",
  },
];

export default function Page() {
  return (
    <ManualShell
      eyebrow="More Info"
      title="Projects"
      description="Projects are the working containers for music ideas, songs, stems, notes, prompts, versions, and future metadata-connected creation history."
    >
      <ManualStatusBanner status="Working now.">
        Projects are usable today, but the long-term project workspace is still
        early and will keep expanding.
      </ManualStatusBanner>

      <ManualInfoSection title="What Projects are now">
        <p>
          Projects are where the user starts gathering music work into a named
          place. Right now they help create and open project areas. The current
          version is intentionally simple because the project system has to stay
          stable while the rest of the app grows.
        </p>

        <p>
          A project can be thought of as the container that holds the creative
          context around a song or group of songs. It is where the app can later
          attach files, notes, lyrics, versions, references, metadata, and
          playback history.
        </p>

        <p>
          The working project area should remain the practical place where users
          go when they want to organize real music work instead of only reading
          explanation pages.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="What Projects will become">
        <p>
          The future version of Projects should become much more than a folder.
          A project should explain what the user is making, why sounds belong
          together, what versions exist, what ideas were tried, and how the work
          connects to the{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata System
          </ManualInlineLink>
          .
        </p>

        <p>
          A finished project workspace may eventually include song lists, stem
          organization, reference tracks, lyric notes, prompt history, mix notes,
          arrangement decisions, and generated audio versions. Those pieces
          should not be isolated. They should connect through records,
          relationships, and search.
        </p>

        <p>
          This matters because music projects can become messy fast. The Muzes
          Garden should help users remember what each piece is, why it exists,
          and what to do with it next.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Project knowledge links">
        <p>
          Project pages should eventually connect directly to the{" "}
          <ManualInlineLink href="/about/global-player">
            Global Player
          </ManualInlineLink>
          , metadata records, Find It routes, and AI generation history. A user
          should be able to start with a song, open its explanation, inspect its
          metadata, and then return to the project without losing context.
        </p>

        <p>
          Important project words should later become deeper manual links too:
          stems, versions, reference songs, prompts, hooks, lyrics, arrangement,
          mix notes, and relationships can all become their own explanation
          pages.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Future route idea: Project → Song → Track Details → Metadata →
            Relationships → More Info → Back to Project
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="What is still missing">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Stronger project dashboard layout.</li>
          <li>• Project notes and explanation cards.</li>
          <li>• Track-to-project metadata connections.</li>
          <li>• Clear project tree / child page structure.</li>
          <li>• Better connection between project songs and the player.</li>
          <li>• Future AI generation history inside each project.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />

      <div className="mt-8">
        <Link
          href="/workspace/projects"
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
        >
          Open working Projects page
        </Link>
      </div>
    </ManualShell>
  );
}