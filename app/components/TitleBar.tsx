"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

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
    label: "Library",
    href: "/library",
    detail: "Open the music library",
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

const TRACK_MATCHER_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "Track Matcher",
    href: "/tools/track-matcher",
    detail: "Open the main Track Matcher workspace",
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
    "block rounded-lg border px-3 py-2 text-sm transition-transform duration-150",
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

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
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
        {label} ▼
      </Link>

      {menuOpen ? (
        <div className="absolute right-0 top-full z-[1100] mt-2 min-w-[220px]">
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

export default function TitleBar() {
  const pathname = usePathname();

  const detailsRoute = useMemo(() => getDetailsRoute(pathname), [pathname]);
  const metadataActive = isActivePath(pathname, "/metadata");
  const trackMatcherActive = isActivePath(pathname, "/tools/track-matcher");

  const [metadataMenuOpen, setMetadataMenuOpen] = useState(false);
  const [trackMatcherMenuOpen, setTrackMatcherMenuOpen] = useState(false);

  const [findItOpen, setFindItOpen] = useState(false);
  const [findItSearchValue, setFindItSearchValue] = useState("");

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

          <button
            type="button"
            onClick={() => setFindItOpen((current) => !current)}
            aria-expanded={findItOpen}
            className={getPrimaryLinkClass(findItOpen)}
            title="Open Find It navigation helper"
          >
            Find It
          </button>
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