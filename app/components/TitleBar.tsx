"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import FindItPanel from "./find-it/FindItPanel";
import { isActivePath } from "./find-it/findItPathUtils";

type TitleBarLink = {
  label: string;
  href: string;
};

const PRIMARY_LINKS: TitleBarLink[] = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/workspace/projects" },
  { label: "Library", href: "/library" },
  { label: "Listen", href: "/listen" },
  { label: "Live", href: "/live" },
  { label: "Members", href: "/members" },
];

const METADATA_CHILD_LINKS: TitleBarLink[] = [
  { label: "Library", href: "/metadata/library" },
  { label: "Create", href: "/metadata/create" },
  { label: "System", href: "/metadata/system" },
];

const TRACK_MATCHER_CHILD_LINKS: TitleBarLink[] = [
  { label: "Track Matcher", href: "/tools/track-matcher" },
  { label: "Advanced", href: "/tools/track-matcher/advanced" },
  { label: "Analyze", href: "/tools/track-matcher/advanced/analyze" },
];

function getPrimaryLinkClass(active: boolean) {
  return [
    "rounded-md border px-3 py-2 text-sm font-medium",
    "hover:scale-[0.99] active:scale-[0.98]",
    active
      ? "border-white bg-black text-white"
      : "border-white/30 bg-black text-white/80",
  ].join(" ");
}

function getDropdownLinkClass(active: boolean) {
  return [
    "block rounded-lg border px-3 py-2 text-sm",
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

export default function TitleBar() {
  const pathname = usePathname();

  const metadataActive = isActivePath(pathname, "/metadata");
  const trackMatcherActive = isActivePath(pathname, "/tools/track-matcher");

  const [metadataMenuOpen, setMetadataMenuOpen] = useState(false);
  const [trackMatcherMenuOpen, setTrackMatcherMenuOpen] = useState(false);

  const [findItOpen, setFindItOpen] = useState(false);
  const [findItSearchValue, setFindItSearchValue] = useState("");

  function handleBlur(
    event: React.FocusEvent<HTMLDivElement>,
    close: () => void
  ) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      close();
    }
  }

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-black">
      <div className="flex min-h-[64px] w-full items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="rounded-md border border-white/30 bg-black px-3 py-2 text-sm font-semibold text-white"
        >
          The Muzes Garden
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {PRIMARY_LINKS.map((link) => {
            const active = getPrimaryLinkActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={getPrimaryLinkClass(active)}
              >
                {link.label}
              </Link>
            );
          })}

          {/* TRACK MATCHER */}
          <div
            className="relative"
            onBlur={(e) => handleBlur(e, () => setTrackMatcherMenuOpen(false))}
            onMouseEnter={() => setTrackMatcherMenuOpen(true)}
            onMouseLeave={() => setTrackMatcherMenuOpen(false)}
          >
            <Link
              href="/tools/track-matcher"
              className={getPrimaryLinkClass(trackMatcherActive)}
            >
              Track Matcher ▼
            </Link>

            {trackMatcherMenuOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[200px]">
                <div className="rounded-xl border border-white/10 bg-black p-1">
                  {TRACK_MATCHER_CHILD_LINKS.map((link) => {
                    const active = isActivePath(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={getDropdownLinkClass(active)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* METADATA */}
          <div
            className="relative"
            onBlur={(e) => handleBlur(e, () => setMetadataMenuOpen(false))}
            onMouseEnter={() => setMetadataMenuOpen(true)}
            onMouseLeave={() => setMetadataMenuOpen(false)}
          >
            <Link
              href="/metadata"
              className={getPrimaryLinkClass(metadataActive)}
            >
              Metadata ▼
            </Link>

            {metadataMenuOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[180px]">
                <div className="rounded-xl border border-white/10 bg-black p-1">
                  {METADATA_CHILD_LINKS.map((link) => {
                    const active = isActivePath(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={getDropdownLinkClass(active)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setFindItOpen(!findItOpen)}
            className={getPrimaryLinkClass(findItOpen)}
          >
            Find It
          </button>
        </nav>
      </div>

      {findItOpen && (
        <FindItPanel
          pathname={pathname}
          searchValue={findItSearchValue}
          onSearchChange={setFindItSearchValue}
        />
      )}
    </header>
  );
}