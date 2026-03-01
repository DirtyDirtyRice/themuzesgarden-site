"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabaseClient";

export default function MembersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignUp() {
    setMessage("Creating account...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Account created. Check your email if confirmation is enabled.");
  }

  async function handleSignIn() {
    setMessage("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Signed in!");
  }

  async function handleSignOut() {
    setMessage("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace("/");
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-zinc-600">
          Sign in to access your personal workspace.
        </p>
      </header>

      {!user ? (
        <section className="rounded-xl border p-5 space-y-4">
          <div className="space-y-3">
            <input
              className="w-full rounded border p-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <input
              type="password"
              className="w-full rounded border p-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSignIn}
              className="rounded bg-black px-4 py-2 text-white"
            >
              Sign In
            </button>

            <button onClick={handleSignUp} className="rounded border px-4 py-2">
              Sign Up
            </button>
          </div>

          {message && <p className="text-sm text-zinc-600">{message}</p>}
        </section>
      ) : (
        <section className="rounded-xl border p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-zinc-600">Signed in as</div>
            <div className="font-semibold">{user.email}</div>
            <div className="text-xs text-zinc-500 break-all">User ID: {user.id}</div>
          </div>

          <div className="rounded-lg border bg-zinc-50 p-4 space-y-3">
            <div className="font-medium">Workspace</div>
            <div className="text-sm text-zinc-600">
              Next: personal projects + personal music views tied to your account.
            </div>

            <div className="flex flex-wrap gap-2">
              <Link className="rounded bg-black px-4 py-2 text-white" href="/workspace">
                Go to Workspace
              </Link>

              <Link className="rounded border px-3 py-2 text-sm" href="/library">
                Library
              </Link>
              <Link className="rounded border px-3 py-2 text-sm" href="/listen">
                Listen
              </Link>
              <Link className="rounded border px-3 py-2 text-sm" href="/upload">
                Upload
              </Link>
              <Link className="rounded border px-3 py-2 text-sm" href="/live">
                Live Engine
              </Link>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="rounded bg-red-600 px-4 py-2 text-white"
          >
            Sign Out
          </button>

          {message && <p className="text-sm text-zinc-600">{message}</p>}
        </section>
      )}
    </main>
  );
}