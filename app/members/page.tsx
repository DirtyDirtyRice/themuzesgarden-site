"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabaseClient";
import {
  memberSignInDestination,
  memberSignInErrorMessage,
} from "../../lib/auth/memberSignInPolicy";

function credentialsError(email: string, password: string): string | null {
  if (!email.trim() || !email.includes("@")) return "Enter a valid email address.";
  if (password.length < 6) return "Password must contain at least 6 characters.";
  return null;
}

export default function MembersPage() {
  const router = useRouter();
  const { user, loading, error: sessionError, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = credentialsError(email, password);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("Signing you in...");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      const signedInUser = await refreshSession();
      if (!signedInUser) throw new Error("Sign-in succeeded, but the member session could not be loaded.");
      setMessage("Signed in. Opening your workspace...");
      router.replace(memberSignInDestination(window.location.search));
      router.refresh();
    } catch (cause) {
      setMessage("");
      setError(
        memberSignInErrorMessage(
          cause instanceof Error ? cause.message : "Member authentication failed.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    setBusy(false);
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    await refreshSession();
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-black via-zinc-950 to-black px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">The Muzes Garden</div>
          <h1 className="mt-2 text-3xl font-black">Member access</h1>
          <p className="mt-2 text-sm text-white/60">Sign in to open your projects, personal music, uploads, and workspace.</p>
        </header>

        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-2xl">
          {loading ? <div className="py-10 text-center text-white/60">Checking your member session...</div> : null}

          {!loading && sessionError ? <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-4"><div className="font-bold text-red-100">Session check failed</div><div className="mt-1 text-sm text-red-100/70">{sessionError}</div><button type="button" onClick={() => void refreshSession()} className="mt-3 rounded-lg border border-red-200/40 px-3 py-2 text-sm font-bold">Try again</button></div> : null}

          {!loading && !user ? <>
            <p className="mb-5 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-sm text-cyan-100">Use the password for your existing owner account. No email code or new-account verification is required.</p>
            <Link href="/library" className="mb-5 block rounded-lg border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-center font-black text-emerald-100">Open Public Library — no sign-in required</Link>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label htmlFor="member-email" className="text-sm font-bold text-white/80">Email</label><input id="member-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-3 text-white outline-none focus:border-cyan-300 disabled:opacity-50" placeholder="you@example.com" /></div>
              <div><label htmlFor="member-password" className="text-sm font-bold text-white/80">Password</label><input id="member-password" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-3 text-white outline-none focus:border-cyan-300 disabled:opacity-50" placeholder="Your existing password" /></div>
              <button type="submit" disabled={busy} className="w-full rounded-lg bg-cyan-300 px-4 py-3 font-black text-black hover:bg-cyan-200 disabled:opacity-50">{busy ? "Please wait..." : "Sign in and open workspace"}</button>
            </form>
          </> : null}

          {!loading && user ? <div className="space-y-5"><div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4"><div className="text-xs font-black uppercase tracking-wider text-emerald-200">Signed in</div><div className="mt-1 font-bold">{user.email}</div></div><div className="grid gap-2 sm:grid-cols-2"><Link href="/workspace" className="rounded-lg bg-cyan-300 px-4 py-3 text-center font-black text-black">Open Workspace</Link><Link href="/library" className="rounded-lg border border-white/20 px-4 py-3 text-center font-bold">Open Music Library</Link></div><button type="button" onClick={() => void handleSignOut()} disabled={busy} className="w-full rounded-lg border border-red-400/40 px-4 py-3 font-bold text-red-100 disabled:opacity-50">{busy ? "Signing out..." : "Sign out"}</button></div> : null}

          {error ? <div role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100"><p>{error}</p><Link href="/library" className="mt-3 inline-block rounded-lg border border-red-100/40 px-3 py-2 font-black">Open Public Library</Link></div> : null}
          {message ? <div role="status" className="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</div> : null}
        </section>
      </div>
    </main>
  );
}
