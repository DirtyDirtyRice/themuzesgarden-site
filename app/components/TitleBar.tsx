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

function getPrimaryLinkClass(active: boolean) {
  return [
    "rounded-md border px-3 py-2 text-sm font-medium transition duration-150",
    "hover:scale-[0.99] hover:opacity-85 active:scale-[0.98]",
    active
      ? "border-white bg-white text-black"
      : "border-white/10 bg-white/5 text-white",
  ].join(" ");
}

function getMetadataChildLinkClass(active: boolean) {
  return [
    "block rounded-lg border px-3 py-2 text-sm transition duration-150",
    "hover:opacity-85 active:scale-[0.99]",
    active
      ? "border-white bg-white text-black"
      : "border-transparent bg-transparent text-white",
  ].join(" ");
}

export default function TitleBar() {
  const pathname = usePathname();
  const metadataActive = isActivePath(pathname, "/metadata");
  const [metadataMenuOpen, setMetadataMenuOpen] = useState(false);
  const [findItOpen, setFindItOpen] = useState(false);
  const [findItSearchValue, setFindItSearchValue] = useState("");

  function closeMetadataMenu() {
    setMetadataMenuOpen(false);
  }

  function openMetadataMenu() {
    setMetadataMenuOpen(true);
  }

  function handleMetadataBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      closeMetadataMenu();
    }
  }

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="flex min-h-[64px] w-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold tracking-wide text-white transition duration-150 hover:scale-[0.99] hover:opacity-85 active:scale-[0.98]"
            aria-label="Go to The Muzes Garden home page"
          >
            The Muzes Garden
          </Link>

          <div className="hidden min-w-0 flex-col md:flex">
            <span className="truncate text-sm font-semibold text-white">
              Workspace Navigation
            </span>
            <span className="truncate text-xs text-white/60">
              Global title bar for pages, popups, and future child menus
            </span>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-end gap-2"
        >
          {PRIMARY_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={getPrimaryLinkClass(active)}
              >
                {link.label}
              </Link>
            );
          })}

          <div
            className="relative"
            onBlur={handleMetadataBlur}
            onFocus={openMetadataMenu}
            onMouseEnter={openMetadataMenu}
            onMouseLeave={closeMetadataMenu}
          >
            <Link
              href="/metadata"
              aria-current={metadataActive ? "page" : undefined}
              aria-expanded={metadataMenuOpen}
              aria-haspopup="menu"
              aria-label="Open Metadata library"
              className={getPrimaryLinkClass(metadataActive)}
            >
              <span className="inline-flex items-center gap-2">
                <span>Metadata</span>
                <span
                  aria-hidden="true"
                  className="text-[10px] leading-none opacity-80"
                >
                  ▼
                </span>
              </span>
            </Link>

            <div
              className={[
                "absolute right-0 top-full z-[1100] mt-2 min-w-[180px] transition duration-150",
                metadataMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-1 opacity-0",
              ].join(" ")}
            >
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/95 p-1 shadow-2xl backdrop-blur">
                {METADATA_CHILD_LINKS.map((link) => {
                  const active = isActivePath(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={getMetadataChildLinkClass(active)}
                      onClick={closeMetadataMenu}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFindItOpen((current) => !current)}
            aria-expanded={findItOpen}
            className={[
              "rounded-md border px-3 py-2 text-sm font-medium transition duration-150",
              "hover:scale-[0.99] hover:opacity-85 active:scale-[0.98]",
              findItOpen
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/5 text-white",
            ].join(" ")}
          >
            Find It
          </button>

          <button
            type="button"
            className="rounded-md border border-dashed border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white/70 transition duration-150 hover:scale-[0.99] hover:opacity-85 active:scale-[0.98]"
            aria-label="Project menu placeholder"
            title="Project menu placeholder"
          >
            Project
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