import Link from "next/link";
import {
  getMetadataLibrary,
  getMetadataRecordSummaries,
} from "@/lib/metadata/metadataLibrarySeed";

type Props = {
  params: Promise<{
    shelfKey: string;
  }>;
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default async function MetadataShelfPage({ params }: Props) {
  const { shelfKey } = await params;

  const library = getMetadataLibrary();
  const shelf = library.shelves.find((s) => s.key === shelfKey);

  if (!shelf) {
    return <div className="p-6 text-white">Shelf not found</div>;
  }

  const records = getMetadataRecordSummaries().filter(
    (r) => r.shelf === shelf.key
  );

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">{shelf.label}</h1>
        <p className="text-white/70">{shelf.description}</p>

        {/* Sections */}
        <div className="space-y-4">
          {shelf.sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <Link
                href={`/metadata/shelf/${shelf.key}/section/${section.key}`}
                className="text-lg font-medium text-blue-300 hover:underline"
              >
                {section.label}
              </Link>
              <p className="text-sm text-white/60">
                {section.description}
              </p>
            </div>
          ))}
        </div>

        {/* Records */}
        <div className="grid gap-4 pt-4">
          {records.map((r) => (
            <Link
              key={r.id}
              href={`/metadata/${r.slug}`}
              className="border border-white/10 rounded-xl p-4 hover:bg-white/5"
            >
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-white/60">{r.excerpt}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}