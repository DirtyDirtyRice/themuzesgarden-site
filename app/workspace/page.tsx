"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabaseClient";
import { ensureProfile, type Profile } from "../../lib/profiles";

type ProfileState =
  | { status: "IDLE" }
  | { status: "LOADING" }
  | { status: "READY"; profile: Profile }
  | { status: "ERROR"; message: string };

export default function WorkspacePage() {
  const { user, loading } = useAuth();
  const [pstate, setPstate] = useState<ProfileState>({ status: "IDLE" });

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

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
        <h1 className="text-2xl font-bold">Workspace</h1>
        <div className="rounded-xl border p-5 space-y-2">
          <div className="text-sm text-zinc-600">
            You must be signed in to access your workspace.
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
        <h1 className="text-2xl font-bold">Your Workspace</h1>
        <p className="text-sm text-zinc-600">Welcome back, {user.email}.</p>
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
        <div className="font-medium">Quick Actions</div>

        <div className="flex flex-wrap gap-2">
          <Link className="rounded border px-3 py-2 text-sm" href="/upload">
            Upload Music
          </Link>

          <Link className="rounded border px-3 py-2 text-sm" href="/workspace/library">
            My Library
          </Link>

          <Link className="rounded border px-3 py-2 text-sm" href="/library">
            Browse Library
          </Link>
          <Link className="rounded border px-3 py-2 text-sm" href="/listen">
            Listen
          </Link>
          <Link className="rounded border px-3 py-2 text-sm" href="/live">
            Live Engine
          </Link>
        </div>
      </section>

      <section className="rounded-xl border p-5 space-y-2">
        <div className="font-medium">Account</div>
        <div className="text-sm text-zinc-600 break-all">User ID: {user.id}</div>
        <button
          onClick={handleSignOut}
          className="mt-2 rounded bg-red-600 px-4 py-2 text-white"
        >
          Sign Out
        </button>
      </section>
    </main>
  );
}