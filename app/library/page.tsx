import Link from "next/link";

export default function LibraryPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Library</h1>

      <p className="mt-3 text-zinc-700">
        Library coming soon.
      </p>

      <Link
        href="/"
        className="mt-6 inline-block rounded border px-3 py-2 text-sm hover:bg-zinc-50"
      >
        Back Home
      </Link>
    </main>
  );
}