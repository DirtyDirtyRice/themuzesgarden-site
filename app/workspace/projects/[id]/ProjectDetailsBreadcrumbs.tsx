"use client";

import Link from "next/link";

export default function ProjectDetailsBreadcrumbs() {
  return (
    <div className="text-sm text-white/50">
      <Link href="/workspace" className="underline">
        Workspace
      </Link>{" "}
      <span className="text-white/30">/</span>{" "}
      <Link href="/workspace/projects" className="underline">
        Projects
      </Link>{" "}
      <span className="text-white/30">/</span>{" "}
      <span className="text-white/70">Details</span>
    </div>
  );
}