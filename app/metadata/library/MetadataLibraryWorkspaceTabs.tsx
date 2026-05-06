import Link from "next/link";
import type { MetadataLibraryPanel } from "./MetadataLibraryPageTypes";

type MetadataLibraryWorkspaceTabsProps = {
  activePanel: MetadataLibraryPanel;
  activeQuery: string;
  activeShelf: string;
  activeVisibility: string;
};

function buildLibraryHref(params: {
  panel: MetadataLibraryPanel;
  q?: string;
  shelf?: string;
  visibility?: string;
}) {
  const query = new URLSearchParams();

  query.set("panel", params.panel);

  if (params.q) query.set("q", params.q);
  if (params.shelf) query.set("shelf", params.shelf);
  if (params.visibility) query.set("visibility", params.visibility);

  return `/metadata/library?${query.toString()}`;
}

export default function MetadataLibraryWorkspaceTabs({
  activePanel,
  activeQuery,
  activeShelf,
  activeVisibility,
}: MetadataLibraryWorkspaceTabsProps) {
  return (
    <section className="rounded-2xl border border-white bg-black p-5 md:p-6">
      <div className="flex flex-col gap-3">
        <span
          className="text-xs font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--text-normal)" }}
        >
          Library Workspace
        </span>

        <h2
          className="text-2xl font-semibold tracking-tight md:text-3xl"
          style={{ color: "var(--text-strong)" }}
        >
          Choose What To Browse
        </h2>

        <p
          className="max-w-3xl text-sm leading-6 md:text-base"
          style={{ color: "var(--text-normal)" }}
        >
          Use these panels instead of scrolling through shelves and records at
          the same time.
        </p>

        <div
          className="rounded-lg border border-white bg-black px-3 py-2 text-sm"
          style={{ color: "var(--text-normal)" }}
        >
          Current Panel:{" "}
          <span style={{ color: "var(--text-strong)" }}>
            {activePanel === "records" ? "Records" : "Shelves"}
          </span>
        </div>

        <div className="grid gap-3 pt-2 md:grid-cols-2">
          <Link
            href={buildLibraryHref({ panel: "shelves" })}
            className={[
              "rounded-2xl border p-4 transition",
              activePanel === "shelves"
                ? "border-white bg-white text-black"
                : "border-white bg-black hover:border-white",
            ].join(" ")}
          >
            <div
              className="text-lg font-semibold"
              style={{
                color:
                  activePanel === "shelves" ? "black" : "var(--text-strong)",
              }}
            >
              Shelves
            </div>

            <p
              className="mt-2 text-sm"
              style={{
                color:
                  activePanel === "shelves"
                    ? "rgba(0,0,0,0.75)"
                    : "var(--text-normal)",
              }}
            >
              Browse metadata by shelf and section.
            </p>
          </Link>

          <Link
            href={buildLibraryHref({
              panel: "records",
              q: activeQuery,
              shelf: activeShelf,
              visibility: activeVisibility,
            })}
            className={[
              "rounded-2xl border p-4 transition",
              activePanel === "records"
                ? "border-white bg-white text-black"
                : "border-white bg-black hover:border-white",
            ].join(" ")}
          >
            <div
              className="text-lg font-semibold"
              style={{
                color:
                  activePanel === "records" ? "black" : "var(--text-strong)",
              }}
            >
              Records
            </div>

            <p
              className="mt-2 text-sm"
              style={{
                color:
                  activePanel === "records"
                    ? "rgba(0,0,0,0.75)"
                    : "var(--text-normal)",
              }}
            >
              Browse, filter, and open individual metadata record shells.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}