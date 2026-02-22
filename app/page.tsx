import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">The Muzes Garden</h1>
        <p className="text-zinc-700">
          Welcome. This is the front door.
        </p>
      </header>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Pages</h2>

        <div className="flex flex-wrap gap-3">
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

        <p className="text-xs text-zinc-500">
          (We removed /music and the builder. This site is being simplified.)
        </p>
      </section>
    </main>
  );
}