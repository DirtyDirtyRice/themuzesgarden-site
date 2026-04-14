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

          <Link
            href="/metadata"
            aria-current={metadataActive ? "page" : undefined}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium transition",
              metadataActive
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
            ].join(" ")}
          >
            Metadata
          </Link>

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