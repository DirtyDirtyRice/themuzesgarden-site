import Link from "next/link";
import type { ReactNode } from "react";

type ManualShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function ManualShell({
  eyebrow = "Manual",
  title,
  description,
  children,
}: ManualShellProps) {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <nav className="flex flex-wrap gap-3" aria-label="Manual navigation">
          <Link
            href="/"
            className="text-sm font-semibold text-white/60 transition hover:text-white"
          >
            ← Home
          </Link>

          <Link
            href="/about"
            className="text-sm font-semibold text-white/60 transition hover:text-white"
          >
            Manual
          </Link>

          <Link
            href="/about/site-tree"
            className="text-sm font-semibold text-white/60 transition hover:text-white"
          >
            Site Tree
          </Link>
        </nav>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>

          <p className="mt-4 max-w-4xl text-lg leading-8 text-white/70">
            {description}
          </p>
        </header>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}