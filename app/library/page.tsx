"use client";

import Link from "next/link";

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Library</h1>

      <p className="mt-3 text-zinc-700">
        The Library is being simplified right now.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Back to Home
        </Link>

        <Link
          href="/upload"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Upload
        </Link>
      </div>
    </main>
  );
}
