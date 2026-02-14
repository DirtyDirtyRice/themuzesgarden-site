// app/music/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MusicPage() {
  const router = useRouter();

  useEffect(() => {
    // Send anyone who visits /music back to the front door.
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="rounded-xl border bg-white p-4 text-sm text-zinc-700 shadow-sm">
        Redirecting…
      </div>
    </div>
  );
}