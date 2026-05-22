"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import ProjectSetlistPanel from "./ProjectSetlistPanel";
import { useProjectSetlistController } from "./projectSetlistController";

export default function ProjectDetailsPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const id = useMemo(() => String((params as any)?.id ?? ""), [params]);

  const controller = useProjectSetlistController({
    id,
    loading,
    user,
  });

  if (loading) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6 text-white">
        <h1 className="text-2xl font-bold">Project</h1>
        <div className="space-y-2 rounded-xl border border-white/10 bg-[#0a0a0a] p-5">
          <div className="text-sm text-white/70">
            You must be signed in to view this project.
          </div>
          <Link
            href="/members"
            className="inline-block rounded bg-white px-4 py-2 text-black"
          >
            Go to Members Sign In
          </Link>
        </div>
      </main>
    );
  }

  return <ProjectSetlistPanel controller={controller} />;
}
