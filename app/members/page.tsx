"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabaseClient";

type AuthMode = "sign-in" | "sign-up";

function credentialsError(email: string, password: string): string | null {
  if (!email.trim() || !email.includes("@")) return "Enter a valid email address.";
  if (password.length < 6) return "Password must contain at least 6 characters.";
  return null;
}

export default function MembersPage() {
  const router = useRouter();
  const { user, loading, error: sessionError, refreshSession } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
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
    setMessage(mode === "sign-in" ? "Signing you in..." : "Creating your account...");
    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        const signedInUser = await refreshSession();
        if (!signedInUser) throw new Error("Sign-in succeeded, but the member session could not be loaded.");
        setMessage("Signed in. Opening your workspace...");
        router.replace("/workspace");
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          await refreshSession();
          setMessage("Account created. Opening your workspace...");
          router.replace("/workspace");
          router.refresh();
        } else {
          setMessage("Account created. Check your email for the confirmation link, then return here to sign in.");
          setMode("sign-in");
          setPassword("");
        }
      }
    } catch (cause) {
      setMessage("");
      setError(cause instanceof Error ? cause.message : "Member authentication failed.");
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
            <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
              {(["sign-in", "sign-up"] as const).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(""); setMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-black ${mode === item ? "bg-cyan-300 text-black" : "text-white/60"}`}>{item === "sign-in" ? "Sign in" : "Create account"}</button>)}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label htmlFor="member-email" className="text-sm font-bold text-white/80">Email</label><input id="member-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-3 text-white outline-none focus:border-cyan-300 disabled:opacity-50" placeholder="you@example.com" /></div>
              <div><label htmlFor="member-password" className="text-sm font-bold text-white/80">Password</label><input id="member-password" type="password" required minLength={6} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-3 text-white outline-none focus:border-cyan-300 disabled:opacity-50" placeholder="At least 6 characters" /></div>
              <button type="submit" disabled={busy} className="w-full rounded-lg bg-cyan-300 px-4 py-3 font-black text-black hover:bg-cyan-200 disabled:opacity-50">{busy ? "Please wait..." : mode === "sign-in" ? "Sign in and open workspace" : "Create member account"}</button>
            </form>
          </> : null}

          {!loading && user ? <div className="space-y-5"><div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4"><div className="text-xs font-black uppercase tracking-wider text-emerald-200">Signed in</div><div className="mt-1 font-bold">{user.email}</div></div><div className="grid gap-2 sm:grid-cols-2"><Link href="/workspace" className="rounded-lg bg-cyan-300 px-4 py-3 text-center font-black text-black">Open Workspace</Link><Link href="/library" className="rounded-lg border border-white/20 px-4 py-3 text-center font-bold">Open Music Library</Link></div><button type="button" onClick={() => void handleSignOut()} disabled={busy} className="w-full rounded-lg border border-red-400/40 px-4 py-3 font-bold text-red-100 disabled:opacity-50">{busy ? "Signing out..." : "Sign out"}</button></div> : null}

          {error ? <div role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
          {message ? <div role="status" className="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</div> : null}
        </section>
      </div>
    </main>
  );
}