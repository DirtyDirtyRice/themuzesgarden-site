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
    label: "AI Music Generator",
    href: "/about/ai-music-generator",
    note: "See the future generation system prompt memory will support.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See where prompt meaning and reusable context can be stored.",
  },
  {
    label: "Project Containers",
    href: "/about/concepts/project-containers",
    note: "See where generation history should live.",
  },
  {
    label: "Concept Pages",
    href: "/about/concepts",
    note: "Return to the concept index.",
  },
];

export default function PromptMemoryConceptPage() {
  return (
    <ManualShell
      eyebrow="Concept"
      title="Prompt Memory"
      description="Prompt memory is the future system for saving what was asked, what was generated, what worked, what failed, and what should be reused."
    >
      <ManualStatusBanner status="Planned.">
        Prompt memory is not a finished current tool. It is documented here
        because future AI generation should be built around reusable memory, not
        throwaway text boxes.
      </ManualStatusBanner>

      <ManualInfoSection title="Plain meaning">
        <p>
          Prompt memory means the app remembers generation instructions and
          their results. A prompt should not disappear after audio is created.
          It should remain connected to the project, the generated file, the
          user notes, and the metadata that explains what the prompt was trying
          to do.
        </p>

        <p>
          This matters because music generation is usually iterative. The user
          may try a prompt, keep one part, reject another part, change the
          words, adjust the style, and regenerate several times.
        </p>

        <p>
          Without memory, that whole creative trail gets lost. With prompt
          memory, the app can help the user understand how a sound was made and
          how to get back to it later.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Prompt-within-prompt idea">
        <p>
          The future generator should support prompt-within-prompt structures.
          A song request might contain separate instructions for the singer, the
          drums, the bass, the harmony, the lyric delivery, the emotional tone,
          the arrangement, and the mix.
        </p>

        <p>
          Those smaller prompt pieces should be searchable and reusable. If a
          vocal style works well, the user should be able to find that vocal
          prompt later without digging through unrelated generated files.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Main Prompt → Vocal Prompt → Pronunciation Notes → Output Version →
            User Rating → Reusable Memory
          </p>
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Project connection">
        <p>
          Prompt memory should live inside{" "}
          <ManualInlineLink href="/about/concepts/project-containers">
            Project Containers
          </ManualInlineLink>
          . A project should know which prompts created which sounds, which
          versions came from those prompts, and which outputs were accepted or
          rejected.
        </p>

        <p>
          This is especially important when future AI systems create many
          versions. The app should help track why each version exists instead of
          leaving users with a pile of unnamed audio files.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Metadata connection">
        <p>
          Prompt memory should also connect to the{" "}
          <ManualInlineLink href="/about/metadata">
            Metadata System
          </ManualInlineLink>
          . Prompt pieces can become metadata fields, relationships, tags, or
          records. That makes generation history searchable.
        </p>

        <p>
          Eventually, Find It should be able to search prompt memory too. A user
          could search for a specific mood, instrument, lyric idea, or
          pronunciation repair and find the related generated material.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still to build">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Saved prompt history inside projects.</li>
          <li>• Prompt pieces for vocals, instruments, structure, and mix.</li>
          <li>• Links between prompts and generated audio versions.</li>
          <li>• User notes and ratings for generated outputs.</li>
          <li>• Metadata fields created from prompt meaning.</li>
          <li>• Find It search results for prompt history.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}