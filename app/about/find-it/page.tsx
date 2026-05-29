"use client";

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
    label: "Manual Home",
    href: "/about",
    note: "Go to the manual index.",
  },
  {
    label: "Metadata System",
    href: "/about/metadata",
    note: "See the knowledge system Find It is connecting to.",
  },
  {
    label: "Projects",
    href: "/about/projects",
    note: "See how project pages will become searchable destinations.",
  },
  {
    label: "Site Tree",
    href: "/about/site-tree",
    note: "See where Find It sits in the roadmap.",
  },
];

export default function Page() {
  return (
    <ManualShell
      eyebrow="More Info"
      title="Find It System"
      description="Find It is the ADD-friendly navigation and knowledge helper. It is designed to answer where you are, what you are trying to find, and how to get there without guessing."
    >
      <ManualStatusBanner status="Building now.">
        Navigation search works, target paths work, Enter stays safe, and
        metadata results are now beginning to appear beside navigation results.
      </ManualStatusBanner>

      <ManualInfoSection title="What Find It is now">
        <p>
          Find It opens from the title bar and gives the user a focused search
          panel. It can search known navigation destinations, show matching
          options, highlight the selected row, and show a target path before the
          user navigates.
        </p>

        <p>
          The current system is intentionally safe. Pressing Enter does not
          navigate. The user must click a result, click a path step, or use a Go
          button. That prevents accidental jumps while searching.
        </p>

        <p>
          Find It also has Clear / Reset, arrow navigation, PageUp / PageDown
          movement, selected row auto-scroll, source chips, and metadata result
          labels.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why it matters">
        <p>
          The Muzes Garden is becoming too deep for normal top-bar navigation
          alone. There will be projects, metadata records, help pages, player
          tools, generator tools, relationship pages, and future child pages.
        </p>

        <p>
          Find It is the system that should keep that depth usable. Instead of
          forcing the user to remember where everything lives, the user should be
          able to type a plain phrase and see possible destinations.
        </p>

        <p>
          This is especially important for ADD workflows because the app should
          reduce the need to remember routes, menus, and hidden page locations.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="What Find It will become">
        <p>
          The long-term version should understand more than page links. It
          should understand{" "}
          <ManualInlineLink href="/about/metadata">
            metadata records
          </ManualInlineLink>
          , manual pages, project pages, relationship cards, and eventually
          words inside explanations.
        </p>

        <p>
          A search for a music idea should be able to return a navigation page,
          a metadata record, a manual explanation, a project reference, or a
          future generator tool. Each result should clearly show what kind of
          thing it is.
        </p>

        <p>
          Eventually, Find It should also explain the route: where the user is
          now, where the target is, what steps connect them, and whether they
          are already on the target page.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Future route example">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Current Page → Find It Search → Metadata Result → Target Path →
            Record Page → Relationship → More Info
          </p>
        </div>

        <p>
          That route is the beginning of the app becoming a connected knowledge
          system instead of a pile of pages.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Still missing">
        <ul className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-white/65">
          <li>• Relationship-aware metadata results.</li>
          <li>• Manual page search results.</li>
          <li>• Deeper route explanations for nested pages.</li>
          <li>• Visual tree view integration.</li>
          <li>• Search result filters by Navigation, Metadata, Manual, and Project.</li>
          <li>• Better natural-language matching beyond simple text search.</li>
        </ul>
      </ManualInfoSection>

      <ManualRelatedLinks links={RELATED_LINKS} />
    </ManualShell>
  );
}