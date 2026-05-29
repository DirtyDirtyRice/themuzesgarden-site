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
    label: "Projects",
    href: "/about/projects",
    note: "See how playback connects to project containers.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See how tracks will connect to knowledge records.",
  },
  {
    label: "Find It",
    href: "/about/find-it",
    note: "See how playing tracks should become searchable context.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See the full roadmap.",
  },
];

export default function Page() {
  return (
    <ManualShell
      eyebrow="More Info"
      title="Global Player"
      description="The Global Player keeps listening present while the user moves through The Muzes Garden. It is the sound layer that should eventually connect playback to projects, metadata, notes, and future generation history."
    >
      <ManualStatusBanner status="Working now.">
        Playback is present in the app, but the deeper project and metadata
        connections are still being built.
      </ManualStatusBanner>

      <ManualInfoSection title="What the Global Player is now">
        <p>
          The Global Player is the always-available playback area. Its purpose
          is to keep music accessible while the user moves through pages instead
          of trapping listening inside one screen.
        </p>

        <p>
          Right now, the important stability goal is simple: playback should
          remain reliable while the user explores Projects, Metadata, Find It,
          Library, and future tools.
        </p>

        <p>
          That stable foundation matters because nearly every future music tool
          will need to refer back to the sound currently being heard.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why it matters">
        <p>
          Music work often starts with hearing something. The user hears a hook,
          texture, mistake, rhythm, lyric, transition, or emotional moment. The
          app should make it easy to connect that moment to explanation and
          action.
        </p>

        <p>
          The player should eventually connect to{" "}
          <ManualInlineLink href="/about/projects">
            Projects
          </ManualInlineLink>
          , metadata records, track details, stem information, lyrics, prompts,
          and relationship pages.
        </p>

        <p>
          This means the player is not only a control bar. It is a future bridge
          between sound, memory, structure, and creation.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="What it will become">
        <p>
          In the final app, playing audio should be able to open related
          information. A track could point to its project, tags, metadata
          records, generated prompt, lyric explanation, waveform notes, and
          relationship matches.
        </p>

        <p>
          A user should be able to hear a sound and quickly ask: what is this,
          where did it come from, what project uses it, what metadata describes
          it, and what can I do with it next?
        </p>

        <p>
          The Global Player should also become one of the main entry points into
          the future AI music workflow, because generated audio needs playback,
          comparison, tagging, regeneration, and storage.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future workflow example">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Play Track → Open Details → View Project → Inspect Metadata →
            Compare Version → Save Note → Return to Playback
          </p>
        </div>

        <p>
          This loop keeps listening connected to information instead of forcing
          users to jump between unrelated screens.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still missing">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Stronger track details connected to the player.</li>
          <li>• Project-aware playback context.</li>
          <li>• Metadata record links from playing tracks.</li>
          <li>• Version comparison and generated-audio history.</li>
          <li>• Better player-to-Find-It actions.</li>
          <li>• Future stem and waveform navigation tools.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />

      <div className="mt-8">
        <Link
          href="/listen"
          className="inline-flex rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:opacity-85 active:scale-[0.98]"
        >
          Open Listen page
        </Link>
      </div>
    </ManualShell>
  );
}