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

const pageClass = "min-h-screen bg-black text-white";
const panelClass = "rounded-2xl border border-white/25 bg-black p-5";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-white/25 bg-black px-4 py-2 text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

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

  if (loading) {
    return (
      <main className={pageClass}>
        <div className="mx-auto max-w-2xl p-6 text-white">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={pageClass}>
        <div className="mx-auto max-w-2xl space-y-4 p-6">
          <h1 className="text-2xl font-bold text-white">Workspace</h1>

          <div className={`${panelClass} space-y-3`}>
            <div className="text-sm text-white/70">
              You must be signed in to access your workspace.
            </div>

            <Link className={buttonClass} href="/members">
              Go to Members Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Your Workspace</h1>
          <p className="text-sm text-white/70">Welcome back, {user.email}.</p>
        </header>

        <section className={`${panelClass} space-y-2`}>
          <div className="font-medium text-white">Profile Status</div>

          {pstate.status === "IDLE" && (
            <div className="text-sm text-white/70">Waiting…</div>
          )}

          {pstate.status === "LOADING" && (
            <div className="text-sm text-white/70">
              Creating / loading your profile…
            </div>
          )}

          {pstate.status === "READY" && (
            <div className="text-sm text-white/70">
              Profile ready:{" "}
              <span className="font-medium text-white">
                {pstate.profile.email ?? "(no email)"}
              </span>
              <div className="break-all text-xs text-white/70">
                id: {pstate.profile.id}
              </div>
            </div>
          )}

          {pstate.status === "ERROR" && (
            <div className="text-sm text-white/70">
              Profile error: {pstate.message}
              <div className="mt-1 text-xs text-white/70">
                This usually means the <code>profiles</code> table or RLS policy
                is not set yet.
              </div>
            </div>
          )}
        </section>

        <section className={`${panelClass} space-y-3`}>
          <div className="font-medium text-white">Quick Actions</div>

          <div className="flex flex-wrap gap-2">
            <Link className={buttonClass} href="/upload">
              Upload Music
            </Link>

            <Link className={buttonClass} href="/workspace/library">
              My Library
            </Link>

            <Link className={buttonClass} href="/workspace/projects">
              Projects
            </Link>

            <Link className={buttonClass} href="/library">
              Browse Library
            </Link>

            <Link className={buttonClass} href="/listen">
              Listen
            </Link>

            <Link className={buttonClass} href="/live">
              Live Engine
            </Link>
          </div>
        </section>

        <section className={`${panelClass} space-y-3`}>
          <div className="font-medium text-white">Account</div>
          <div className="break-all text-sm text-white/70">
            User ID: {user.id}
          </div>

          <button onClick={handleSignOut} className={buttonClass}>
            Sign Out
          </button>
        </section>
      </div>
    </main>
  );
}