import Link from "next/link";

export default async function MetadataPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        {/* 🧠 DADDY PAGE INTRO */}
        <section className="rounded-2xl border border-white bg-black p-5 md:p-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Metadata Home
            </span>

            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              The Metadata World
            </h1>

            <p className="max-w-3xl text-base leading-7 text-white/80">
              Metadata is the knowledge layer of the app. This is where ideas,
              structures, relationships, and systems live.
            </p>

            <div className="rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white/80">
              If you are new, read this page first. If you already know where
              you want to go, use the buttons below.
            </div>

            <div className="grid gap-2 rounded-lg border border-white/20 bg-black px-4 py-3 text-sm text-white/80 md:grid-cols-3">
              <div><strong className="text-white">Library</strong> = browse records</div>
              <div><strong className="text-white">Create</strong> = build a record</div>
              <div><strong className="text-white">System</strong> = learn structure</div>
            </div>

            {/* NAV BUTTONS */}
            <div className="grid gap-3 pt-3 md:grid-cols-3">
              <Link href="/metadata/library" className="rounded-2xl border border-white bg-black p-4">
                <div className="text-lg font-semibold text-white">Library</div>
                <p className="mt-2 text-sm text-white/70">
                  Browse and explore all metadata records.
                </p>
              </Link>

              <Link href="/metadata/create" className="rounded-2xl border border-white bg-black p-4">
                <div className="text-lg font-semibold text-white">Create</div>
                <p className="mt-2 text-sm text-white/70">
                  Create new metadata records and relationships.
                </p>
              </Link>

              <Link href="/metadata/system" className="rounded-2xl border border-white bg-black p-4">
                <div className="text-lg font-semibold text-white">System</div>
                <p className="mt-2 text-sm text-white/70">
                  Explore the deeper structure.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* 🌳 NAVIGATION TREE */}
        <section className="rounded-2xl border border-white bg-black p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-white">
              System Structure (Navigation Tree)
            </h2>

            <div className="rounded-xl border border-white/20 bg-black px-4 py-4 text-base leading-7 text-white/85">
              <p>Metadata</p>
              <p className="ml-4">→ Library</p>
              <p className="ml-8">→ Shelf</p>
              <p className="ml-12">→ Section</p>
              <p className="ml-16">→ Record</p>

              <p className="mt-3 ml-4">→ Create</p>
              <p className="ml-4">→ System</p>
            </div>
          </div>
        </section>

        {/* 🧭 HOW TO GET THERE */}
        <section className="rounded-2xl border border-white bg-black p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-white">
              How to Get There
            </h2>

            <div className="grid gap-3">

              <div className="rounded-xl border border-white/20 bg-black px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Create a record
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Metadata → Create → Start Creating Record
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-black px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  View a record
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Metadata → Library → Select shelf → Select section → Open record
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-black px-4 py-3">
                <p className="text-sm font-semibold text-white">
                  Understand relationships
                </p>
                <p className="mt-1 text-sm text-white/75">
                  Open any record → Scroll to Relationships section
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 🔮 WHAT’S COMING */}
        <section className="rounded-2xl border border-white bg-black p-5 md:p-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold text-white">
              What’s Coming
            </h2>

            <div className="grid gap-2 text-sm text-white/80">
              <div className="rounded-lg border border-white/20 bg-black px-3 py-2">
                Relationship intelligence system
              </div>

              <div className="rounded-lg border border-white/20 bg-black px-3 py-2">
                Visual relationship maps
              </div>

              <div className="rounded-lg border border-white/20 bg-black px-3 py-2">
                Metadata search and query tools
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}