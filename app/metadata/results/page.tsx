import Link from "next/link";
import { runMetadataQuery } from "@/lib/metadata/metadataQueryEngine";
import MetadataQueryResults from "@/lib/metadata/MetadataQueryResults";
import { getMetadataQueryDataset } from "@/lib/metadata/metadataQueryAdapter";
import type {
  MetadataKind,
  MetadataTargetType,
} from "@/lib/metadata/metadataTypes";
import type { MetadataQueryInput } from "@/lib/metadata/metadataQueryTypes";

type RawSearchParams =
  | Record<string, string | string[] | undefined>
  | undefined;

type MetadataResultsPageProps = {
  searchParams?: Promise<RawSearchParams> | RawSearchParams;
};

const TARGET_TYPE_OPTIONS: Array<MetadataTargetType | "all"> = [
  "all",
  "project",
  "track",
  "section",
  "moment",
  "lyric",
  "instrument",
  "note",
  "chord",
  "modulation",
  "tag",
];

const KIND_OPTIONS: Array<MetadataKind | "all"> = [
  "all",
  "tag",
  "description",
  "analysis",
  "instruction",
  "structure",
  "emotion",
  "technical",
  "timing",
  "reference",
];

const MODE_OPTIONS: Array<MetadataQueryInput["mode"]> = [
  "all",
  "text",
  "target",
  "tokens",
];

function pickString(
  value: string | string[] | undefined,
  fallback = ""
): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return fallback;
}

function pickBoolean(
  value: string | string[] | undefined,
  fallback: boolean
): boolean {
  const normalized = pickString(value, "").trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return fallback;
}

function pickNumber(
  value: string | string[] | undefined,
  fallback: number
): number {
  const parsed = Number(pickString(value, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMode(
  value: string | string[] | undefined
): MetadataQueryInput["mode"] {
  const candidate = pickString(value, "all");
  return MODE_OPTIONS.includes(candidate as MetadataQueryInput["mode"])
    ? (candidate as MetadataQueryInput["mode"])
    : "all";
}

function parseTargetType(
  value: string | string[] | undefined
): MetadataTargetType | "all" {
  const candidate = pickString(value, "all");
  return TARGET_TYPE_OPTIONS.includes(candidate as MetadataTargetType | "all")
    ? (candidate as MetadataTargetType | "all")
    : "all";
}

function parseKind(
  value: string | string[] | undefined
): MetadataKind | "all" {
  const candidate = pickString(value, "all");
  return KIND_OPTIONS.includes(candidate as MetadataKind | "all")
    ? (candidate as MetadataKind | "all")
    : "all";
}

export default async function MetadataResultsPage({
  searchParams,
}: MetadataResultsPageProps) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;

  const query = pickString(resolvedSearchParams?.query);
  const mode = parseMode(resolvedSearchParams?.mode);
  const targetType = parseTargetType(resolvedSearchParams?.targetType);
  const kind = parseKind(resolvedSearchParams?.kind);
  const targetId = pickString(resolvedSearchParams?.targetId);
  const tags = pickString(resolvedSearchParams?.tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const limit = pickNumber(resolvedSearchParams?.limit, 50);

  const includeDirect = pickBoolean(
    resolvedSearchParams?.includeDirect,
    true
  );
  const includeInherited = pickBoolean(
    resolvedSearchParams?.includeInherited,
    true
  );
  const includeRelated = pickBoolean(
    resolvedSearchParams?.includeRelated,
    true
  );
  const includeExpanded = pickBoolean(
    resolvedSearchParams?.includeExpanded,
    true
  );
  const includeFallback = pickBoolean(
    resolvedSearchParams?.includeFallback,
    true
  );

  const { entries, links } = getMetadataQueryDataset();

  const result = runMetadataQuery({
    entries,
    links,
    input: {
      query,
      mode,
      targetType,
      kind,
      targetId,
      tags,
      limit,
      includeDirect,
      includeInherited,
      includeRelated,
      includeExpanded,
      includeFallback,
    },
  });

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* HEADER */}
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white">
              Metadata Results
            </span>

            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Dedicated Results Page
            </h1>

            <p className="max-w-3xl text-base leading-7 text-white">
              This page receives the query and filters from the metadata query
              panel and renders the results here.
            </p>

            {/* CHIP ROW */}
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-white">
              <div className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2">
                Query:{" "}
                <span className="font-semibold text-white">
                  {query || "none"}
                </span>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2">
                Mode:{" "}
                <span className="font-semibold text-white">{mode}</span>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2">
                Limit:{" "}
                <span className="font-semibold text-white">{limit}</span>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2">
                Entries:{" "}
                <span className="font-semibold text-white">
                  {entries.length}
                </span>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2">
                Links:{" "}
                <span className="font-semibold text-white">{links.length}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/metadata"
                className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                ← Back to Metadata
              </Link>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6">
          <MetadataQueryResults result={result} />
        </section>
      </div>
    </main>
  );
}