"use client";

import Link from "next/link";

export default function ProjectDetailsBackLink() {
  return (
    <section className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
      <Link
        href="/workspace/projects"
        className="rounded border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/10"
      >
        Back to Projects
      </Link>
    </section>
  );
}