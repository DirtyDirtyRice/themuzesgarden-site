import Link from "next/link";
import {
  getMetadataLibrary,
  getMetadataRecordSummaries,
} from "@/lib/metadata/metadataLibrarySeed";

type Props = {
  params: Promise<{
    shelfKey: string;
    sectionKey: string;
  }>;
};

export default async function MetadataSectionPage({ params }: Props) {
  const { shelfKey, sectionKey } = await params;

  const library = getMetadataLibrary();
  const shelf = library.shelves.find((s) => s.key === shelfKey);
  const section = shelf?.sections.find((sec) => sec.key === sectionKey);

  if (!shelf || !section) {
    return <div className="p-6 text-white">Section not found</div>;
  }

  const records = getMetadataRecordSummaries().filter(
    (r) => r.shelf === shelf.key && r.section === section.key
  );

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">
          {shelf.label} → {section.label}
        </h1>

        <p className="text-white/70">{section.description}</p>

        <div className="grid gap-4">
          {records.length ? (
            records.map((r) => (
              <Link
                key={r.id}
                href={`/metadata/${r.slug}`}
                className="border border-white/10 rounded-xl p-4 hover:bg-white/5"
              >
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-white/60">{r.excerpt}</div>
              </Link>
            ))
          ) : (
            <div className="text-white/60">No records yet</div>
          )}
        </div>
      </div>
    </main>
  );
}