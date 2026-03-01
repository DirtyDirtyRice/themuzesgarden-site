"use client";

import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { ensureProfile, type Profile } from "../../../lib/profiles";
import { useEffect, useState } from "react";

type ProfileState =
  | { status: "IDLE" }
  | { status: "LOADING" }
  | { status: "READY"; profile: Profile }
  | { status: "ERROR"; message: string };

export default function WorkspaceLibraryPage() {
  const { user, loading } = useAuth();
  const [pstate, setPstate] = useState<ProfileState>({ status: "IDLE" });

  useEffect(() => {
    if (!user) {
      setPstate({ status: "IDLE" });
      return;
    }

    let cancelled = false;

    (async () => {
      setPstate({ status: "LOADING" });

      const res = await ensureProfile({
        userId: user.id,
        email: user.email ?? null,
      });

      if (cancelled) return;

      if (!res.ok) setPstate({ status: "ERROR", message: res.error });
      else setPstate({ status: "READY", profile: res.profile });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">My Library</h1>
        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm text-zinc-600">
            You must be signed in to access your workspace library.
          </div>
          <Link
            className="inline-block rounded bg-black px-4 py-2 text-white"
            href="/members"
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
        <h1 className="text-2xl font-bold">My Library</h1>
        <p className="text-sm text-zinc-600">
          Personal library view (coming soon) for {user.email}.
        </p>
      </header>

      <section className="rounded-xl border p-5 space-y-2">
        <div className="font-medium">Profile Status</div>

        {pstate.status === "IDLE" && (
          <div className="text-sm text-zinc-600">Waiting…</div>
        )}

        {pstate.status === "LOADING" && (
          <div className="text-sm text-zinc-600">
            Creating / loading your profile…
          </div>
        )}

        {pstate.status === "READY" && (
          <div className="text-sm text-zinc-600">
            Profile ready:{" "}
            <span className="font-medium">
              {pstate.profile.email ?? "(no email)"}
            </span>
            <div className="text-xs text-zinc-500 break-all">
              id: {pstate.profile.id}
            </div>
          </div>
        )}

        {pstate.status === "ERROR" && (
          <div className="text-sm text-red-600">
            Profile error: {pstate.message}
            <div className="text-xs text-zinc-500 mt-1">
              This usually means the <code>profiles</code> table (or RLS policy)
              isn’t set yet.
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border p-5 space-y-3">
        <div className="font-medium">Navigation</div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded border px-3 py-2 text-sm" href="/workspace">
            Back to Workspace
          </Link>
          <Link className="rounded border px-3 py-2 text-sm" href="/library">
            Open Main Library
          </Link>
        </div>
      </section>

      <section className="rounded-xl border p-5 space-y-2">
        <div className="font-medium">Account</div>
        <div className="text-sm text-zinc-600 break-all">User ID: {user.id}</div>
      </section>
    </main>
  );
}