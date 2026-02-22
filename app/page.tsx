import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-semibold">The Muzes Garden</h1>

      <p className="mt-2 text-zinc-700">
        Welcome. This is the front door.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/upload"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Upload
        </Link>

        <Link
          href="/library"
          className="rounded border px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Library
        </Link>
      </div>
    </main>
  );
}

