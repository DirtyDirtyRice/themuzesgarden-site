"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          router.replace("/members");
          return;
        }
      } catch {
        // ignore; treat as logged out
      } finally {
        if (mounted) setChecking(false);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-semibold">The Muzes Garden</h1>
        <p className="mt-2 text-zinc-700">Checking session…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-semibold">The Muzes Garden</h1>

      <p className="mt-2 text-zinc-700">Welcome. This is the front door.</p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/members"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Enter
        </Link>

        <Link
          href="/members"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Upload
        </Link>

        <Link
          href="/members"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Library
        </Link>
      </div>
    </main>
  );
}