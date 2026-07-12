"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type FocusEvent } from "react";

import FindItPanel from "./find-it/FindItPanel";
import { isActivePath } from "./find-it/findItPathUtils";

type TitleBarLink = {
  label: string;
  href: string;
  detail?: string;
};

type DetailsRoute = {
  match: string;
  href: string;
  label: string;
};

type HelpMenuItem =
  | {
      kind: "button";
      label: string;
      detail: string;
      onSelect: () => void;
    }
  | {
      kind: "link";
      label: string;
      href: string;
      detail: string;
    };

const PRIMARY_LINKS: TitleBarLink[] = [
  {
    label: "Home",
    href: "/",
    detail: "Main app landing page",
  },
  {
    label: "Projects",
    href: "/workspace/projects",
    detail: "Open the project workspace",
  },
  {
    label: "Upload",
    href: "/upload",
    detail: "Upload music into The Muzes Garden",
  },
  {
    label: "Listen",
    href: "/listen",
    detail: "Open the listening player",
  },
  {
    label: "Live",
    href: "/live",
    detail: "Open live tools",
  },
  {
    label: "Members",
    href: "/members",
    detail: "Open member tools",
  },
];
  


const LIBRARY_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "Library Home",
    href: "/library",
    detail: "Open the main music library",
  },
  {
    label: "Project Liaison",
    href: "/library/project-liaison",
    detail: "Send library tracks into project folders",
  },
  {
    label: "Lyrics",
    href: "/library/lyrics",
    detail: "Write, search, and download lyric text files",
  },
  {
    label: "Multi-Stems",
    href: "/library/multi-stems",
    detail: "Future home for stem groups and stem sets",
  },
  {
    label: "Stories",
    href: "/library/stories",
    detail: "Future home for song stories and notes",
  },
  {
    label: "Miscellaneous",
    href: "/library/miscellaneous",
    detail: "Future home for extra creative files",
  },
];

const AI_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "AI Workspace",
    href: "/ai",
    detail: "Open the AI workspace dashboard",
  },
  {
    label: "Prompt Library",
    href: "/ai/prompts",
    detail: "Create and organize reusable prompts",
  },
  {
    label: "Agents",
    href: "/ai/agents",
    detail: "Future AI agent management",
  },
  {
    label: "Memory",
    href: "/ai/memory",
    detail: "Future long-term AI memory",
  },
  {
    label: "Automation",
    href: "/ai/automation",
    detail: "Future AI automation center",
  },
  {
    label: "History",
    href: "/ai/history",
    detail: "Review previous AI activity",
  },
  {
    label: "Settings",
    href: "/ai/settings",
    detail: "Configure AI workspace",
  },
];

const METADATA_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "Library",
    href: "/metadata/library",
    detail: "Browse metadata shelves and records",
  },
  {
    label: "Create",
    href: "/metadata/create",
    detail: "Create metadata records",
  },
  {
    label: "System",
    href: "/metadata/system",
    detail: "View metadata system structure",
  },
];


const TOOLS_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "Code Map",
    href: "/tools/code-map",
    detail: "Open the coding app code map",
  },
];

const TRACK_MATCHER_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "Finder",
    href: "/tools/track-matcher/finder",
    detail: "Search Library tracks and load them into Track Matcher",
  },
  {
    label: "Multi Track",
    href: "/tools/track-matcher/multi-track",
    detail: "Open the multi-track engine workspace",
  },
  {
    label: "Advanced",
    href: "/tools/track-matcher/advanced",
    detail: "Open the advanced Track Matcher workbench",
  },
  {
    label: "Analyze",
    href: "/tools/track-matcher/advanced/analyze",
    detail: "Open the fake timeline analysis map",
  },
];

const HELP_LINKS: TitleBarLink[] = [
  {
    label: "How Do I?",
    href: "/help",
    detail: "Step-by-step workflows for common member tasks",
  },
  {
    label: "What Is This?",
    href: "/help",
    detail: "Plain-language explanations of app areas and concepts",
  },
  {
    label: "Routes",
    href: "/help",
    detail: "How to get from one app area to another",
  },
  {
    label: "Tips",
    href: "/help",
    detail: "Small reminders that prevent workflow confusion",
  },
  {
    label: "What's New?",
    href: "/help",
    detail: "Recent additions and verified workflows",
  },
];

const DETAILS_ROUTES: DetailsRoute[] = [
  {
    match: "/tools/track-matcher",
    href: "/about/track-matcher",
    label: "Track Matcher details",
  },
  {
    match: "/metadata",
    href: "/about/metadata",
    label: "Metadata details",
  },
  {
    match: "/workspace/projects",
    href: "/about/projects",
    label: "Project details",
  },
  {
    match: "/listen",
    href: "/about/global-player",
    label: "Player details",
  },
  {
    match: "/library",
    href: "/about/global-player",
    label: "Library details",
  },
];

function getPrimaryLinkClass(active: boolean) {
  return [
    "rounded-md border px-3 py-2 text-sm font-medium transition-transform duration-150",
    "hover:scale-[0.99] active:scale-[0.98]",
    active
      ? "border-white bg-black text-white"
      : "border-white/30 bg-black text-white/80",
  ].join(" ");
}

function getDropdownLinkClass(active: boolean) {
  return [
    "block w-full rounded-lg border px-3 py-2 text-left text-sm transition-transform duration-150",
    "hover:scale-[0.99] active:scale-[0.98]",
    active
      ? "border-white bg-black text-white"
      : "border-white/30 bg-black text-white/80",
  ].join(" ");
}

function getPrimaryLinkActive(pathname: string, link: TitleBarLink) {
  if (link.href === "/") return pathname === "/";
  return isActivePath(pathname, link.href);
}

function getDetailsRoute(pathname: string): DetailsRoute {
  return (
    DETAILS_ROUTES.find((route) => isActivePath(pathname, route.match)) ?? {
      match: "/about",
      href: "/about",
      label: "App details",
    }
  );
}

function TitleBarDropdown({
  active,
  label,
  links,
  menuOpen,
  onClose,
  onOpen,
}: {
  active: boolean;
  label: string;
  links: TitleBarLink[];
  menuOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const pathname = usePathname();

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onClose();
    }
  }

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      onFocus={onOpen}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <Link
        href={links[0]?.href ?? "/"}
        aria-current={active ? "page" : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className={getPrimaryLinkClass(active)}
        title={`${label} menu`}
      >
        {label} v
      </Link>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-[1100] mt-2 min-w-[240px]">
          <div className="rounded-xl border border-white/10 bg-black p-1 shadow-2xl">
            {links.map((link) => {
              const childActive = isActivePath(pathname, link.href);

              return (
     
        <Link
                  key={link.href}
                  href={link.href}
                  aria-current={childActive ? "page" : undefined}
                  className={getDropdownLinkClass(childActive)}
                  onClick={onClose}
                  title={link.detail}
                >
                  <span className="block font-semibold">{link.label}</span>
                  {link.detail ? (
                    <span className="mt-1 block text-xs leading-4 text-white/55">
                      {link.detail}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HelpDropdown({
  active,
  items,
  menuOpen,
  onClose,
  onOpen,
}: {
  active: boolean;
  items: HelpMenuItem[];
  menuOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onClose();
    }
  }

  return (
    <div
      className="relative"
      onBlur={handleBlur}
      onFocus={onOpen}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        onClick={() => (menuOpen ? onClose() : onOpen())}
        aria-current={active ? "page" : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className={getPrimaryLinkClass(active)}
        title="Open Help menu"
      >
        Help v
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-[1100] mt-2 min-w-[260px]">
          <div className="rounded-xl border border-white/10 bg-black p-1 shadow-2xl">
            {items.map((item) => {
              if (item.kind === "button") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={getDropdownLinkClass(false)}
                    onClick={() => {
                      item.onSelect();
                      onClose();
                    }}
                    title={item.detail}
                  >
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs leading-4 text-white/55">
                      {item.detail}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={getDropdownLinkClass(false)}
                  onClick={onClose}
                  title={item.detail}
                >
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-4 text-white/55">
                    {item.detail}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TitleBar() {
  const pathname = usePathname();

  const detailsRoute = useMemo(() => getDetailsRoute(pathname), [pathname]);
  const aiActive = isActivePath(pathname, "/ai");
  const libraryActive = isActivePath(pathname, "/library");
  const metadataActive = isActivePath(pathname, "/metadata");
  const toolsActive = isActivePath(pathname, "/tools/code-map");
  const trackMatcherActive = isActivePath(pathname, "/tools/track-matcher");

  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [libraryMenuOpen, setLibraryMenuOpen] = useState(false);
  const [metadataMenuOpen, setMetadataMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [trackMatcherMenuOpen, setTrackMatcherMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  const [findItOpen, setFindItOpen] = useState(false);
  const [findItSearchValue, setFindItSearchValue] = useState("");

  const helpActive = isActivePath(pathname, "/help") || findItOpen;

  const helpItems = useMemo<HelpMenuItem[]>(
    () => [
      {
        kind: "button",
        label: "Find It",
        detail: "Open the current-page navigation helper",
        onSelect: () => setFindItOpen((current) => !current),
      },
      ...HELP_LINKS.map((link) => ({
        kind: "link" as const,
        label: link.label,
        href: link.href,
        detail: link.detail ?? "Open Help",
      })),
    ],
    []
  );

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-black">
      <div className="flex min-h-[64px] w-full items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="rounded-md border border-white/30 bg-black px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[0.99] active:scale-[0.98]"
          title="Return to The Muzes Garden home page"
        >
          The Muzes Garden
        </Link>

        <nav
          aria-label="Primary navigation"
          className="flex flex-wrap items-center justify-end gap-2"
        >
          {PRIMARY_LINKS.map((link) => {
            const active = getPrimaryLinkActive(pathname, link);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={getPrimaryLinkClass(active)}
                title={link.detail}
              >
                {link.label}
              </Link>
            );
          })}

               <TitleBarDropdown
  active={aiActive}
  label="AI"
  links={AI_CHILD_LINKS}
  menuOpen={aiMenuOpen}
  onClose={() => setAiMenuOpen(false)}
  onOpen={() => setAiMenuOpen(true)}
/>

<TitleBarDropdown
  active={libraryActive}
  label="Library"
  links={LIBRARY_CHILD_LINKS}
  menuOpen={libraryMenuOpen}
  onClose={() => setLibraryMenuOpen(false)}
  onOpen={() => setLibraryMenuOpen(true)}
/>

          <TitleBarDropdown
            active={toolsActive}
            label="Tools"
            links={TOOLS_CHILD_LINKS}
            menuOpen={toolsMenuOpen}
            onClose={() => setToolsMenuOpen(false)}
            onOpen={() => setToolsMenuOpen(true)}
          />

          <TitleBarDropdown
            active={trackMatcherActive}
            label="Track Matcher"
            links={TRACK_MATCHER_CHILD_LINKS}
            menuOpen={trackMatcherMenuOpen}
            onClose={() => setTrackMatcherMenuOpen(false)}
            onOpen={() => setTrackMatcherMenuOpen(true)}
          />

          <TitleBarDropdown
            active={metadataActive}
            label="Metadata"
            links={METADATA_CHILD_LINKS}
            menuOpen={metadataMenuOpen}
            onClose={() => setMetadataMenuOpen(false)}
            onOpen={() => setMetadataMenuOpen(true)}
          />

          <Link
            href={detailsRoute.href}
            className={getPrimaryLinkClass(isActivePath(pathname, "/about"))}
            title={detailsRoute.label}
          >
            Details
          </Link>

          <HelpDropdown
            active={helpActive}
            items={helpItems}
            menuOpen={helpMenuOpen}
            onClose={() => setHelpMenuOpen(false)}
            onOpen={() => setHelpMenuOpen(true)}
          />
        </nav>
      </div>

      {findItOpen ? (
        <FindItPanel
          pathname={pathname}
          searchValue={findItSearchValue}
          onSearchChange={setFindItSearchValue}
        />
      ) : null}
    </header>
  );
}