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
  { label: "Listen", href: "/listen" },
  { label: "Upload", href: "/upload" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function TopNav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-50 border-b border-black bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        
        <div className="text-xl font-bold tracking-tight text-black">
          The Muzes Garden
        </div>

        <nav className="flex items-center gap-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-lg px-3 py-2 text-sm transition border",
                  "border-black bg-black text-white/90 hover:bg-white hover:text-black",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
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