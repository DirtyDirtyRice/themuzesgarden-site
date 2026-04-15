"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { label: "Library", href: "/metadata" },
  { label: "Create", href: "/metadata/create" }, // ✅ added
  { label: "System", href: "/metadata/system" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TitleBar() {
  const pathname = usePathname();
  const metadataActive = isActivePath(pathname, "/metadata");

  return (
    <header className="sticky top-0 z-[1000] border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="flex min-h-[64px] w-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold tracking-wide text-white transition hover:bg-white/10"
            aria-label="Go to The Muzes Garden home page"
          >
            The Muzes Garden
          </Link>

          <div className="hidden min-w-0 md:flex flex-col">
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
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="group relative">
            <Link
              href="/metadata"
              aria-current={metadataActive ? "page" : undefined}
              aria-label="Open Metadata library"
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                metadataActive
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
              ].join(" ")}
            >
              <span>Metadata</span>
              <span
                aria-hidden="true"
                className="text-[10px] leading-none opacity-80"
              >
                ▼
              </span>
            </Link>

            <div className="pointer-events-none absolute right-0 top-full z-[1100] mt-2 min-w-[180px] translate-y-1 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/95 p-1 shadow-2xl backdrop-blur">
                {METADATA_CHILD_LINKS.map((link) => {
                  const active = isActivePath(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block rounded-lg px-3 py-2 text-sm transition",
                        active
                          ? "bg-white text-black"
                          : "text-white hover:bg-white/10",
                      ].join(" ")}
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
            className="rounded-md border border-dashed border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Project menu placeholder"
            title="Project menu placeholder"
          >
            Project
          </button>
        </nav>
      </div>
    </header>
  );
}