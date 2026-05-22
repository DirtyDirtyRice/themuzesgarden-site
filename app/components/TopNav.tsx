"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

const NAV: NavItem[] = [
  { label: "Player", href: "/" },
  { label: "Library", href: "/library" },
  { label: "Projects", href: "/workspace/projects" },
  { label: "Metadata", href: "/metadata" },
  { label: "Track Matcher", href: "/tools/track-matcher" },
  { label: "Listen", href: "/listen" },
  { label: "Upload", href: "/upload" },
  { label: "Help", href: "/help" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function TopNav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/25 bg-black">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="text-xl font-bold tracking-tight text-white">
          The Muzes Garden
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex min-h-10 items-center justify-center rounded-xl",
                  "border border-white/25 bg-black px-3 py-2 text-sm font-bold",
                  "text-white transition-transform duration-150",
                  "hover:scale-[1.03] active:scale-[0.98]",
                  active ? "ring-1 ring-white/40" : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}