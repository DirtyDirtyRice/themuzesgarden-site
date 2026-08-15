"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../../lib/supabaseClient";
import { memberNewPasswordError } from "../../../lib/auth/memberSignInPolicy";

export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = memberNewPasswordError(password, confirmation);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirmation("");
      setComplete(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The new password could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-black px-4 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/15 bg-white/[0.04] p-6">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Owner account recovery</p>
        <h1 className="mt-2 text-3xl font-black">Choose a new password</h1>
        {loading ? <p className="mt-5 text-white/60">Checking the secure recovery link...</p> : null}
        {!loading && !user ? <div className="mt-5 rounded-xl border border-amber-300/35 bg-amber-300/10 p-4 text-amber-100"><p>This recovery link is missing, invalid, or expired.</p><Link className="mt-3 inline-block rounded-lg border border-amber-100/40 px-3 py-2 font-black" href="/members">Request Another Reset Email</Link></div> : null}
        {!loading && user && !complete ? <form className="mt-5 space-y-4" onSubmit={updatePassword}><div><label className="text-sm font-bold" htmlFor="new-password">New password</label><input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-3" /></div><div><label className="text-sm font-bold" htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-3" /></div><button type="submit" disabled={busy} className="w-full rounded-lg bg-cyan-300 px-4 py-3 font-black text-black disabled:opacity-50">{busy ? "Saving New Password..." : "Save New Password"}</button></form> : null}
        {complete ? <div role="status" className="mt-5 rounded-xl border border-emerald-300/35 bg-emerald-300/10 p-4 text-emerald-100"><p className="font-black">Password updated.</p><Link className="mt-3 inline-block rounded-lg bg-emerald-200 px-4 py-2 font-black text-black" href="/workspace/projects">Open Your Private Projects</Link></div> : null}
        {error ? <p role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-red-100">{error}</p> : null}
      </section>
    </main>
  );
}
