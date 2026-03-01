"use client";

import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";

export default function WorkspaceProjectsPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Projects</h1>

        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm text-zinc-600">
            You must be signed in to access your projects.
          </div>

          <Link
            href="/members"
            className="inline-block rounded bg-black px-4 py-2 text-white"
          >
            Go to Members Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <p className="text-sm text-zinc-600">
          Project space for {user.email}
        </p>
      </header>

      <section className="rounded-xl border p-5 space-y-2">
        <div className="font-medium">Projects</div>
        <div className="text-sm text-zinc-600">
          Project system coming soon.
        </div>
      </section>

      <section className="rounded-xl border p-5">
        <Link
          href="/workspace"
          className="rounded border px-3 py-2 text-sm"
        >
          Back to Workspace
        </Link>
      </section>
    </main>
  );
}