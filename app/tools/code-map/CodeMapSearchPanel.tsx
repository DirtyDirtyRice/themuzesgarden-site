"use client";

import { useEffect, useMemo, useState } from "react";

type SearchMode = "all" | "visible" | "types" | "routes" | "imports";

type CodeMapFile = {
  path: string;
  route: string | null;
  imports: string[];
  sideEffectImports?: string[];
  exportedTypes: string[];
  exportedInterfaces: string[];
  exportedFunctions: string[];
  exportedConsts: string[];
  localTypes?: string[];
  visibleTexts?: string[];
};

type Props = {
  files: CodeMapFile[];
};

function lowerList(values: string[] | undefined) {
  return (values ?? []).join(" ").toLowerCase();
}

function fileHaystack(file: CodeMapFile, mode: SearchMode) {
  if (mode === "visible") return lowerList(file.visibleTexts);
  if (mode === "types") return lowerList([...file.exportedTypes, ...file.exportedInterfaces, ...(file.localTypes ?? [])]);
  if (mode === "routes") return `${file.route ?? ""} ${file.path}`.toLowerCase();
  if (mode === "imports") return lowerList([...file.imports, ...(file.sideEffectImports ?? [])]);

  return [
    file.path,
    file.route ?? "",
    ...file.imports,
    ...(file.sideEffectImports ?? []),
    ...file.exportedTypes,
    ...file.exportedInterfaces,
    ...file.exportedFunctions,
    ...file.exportedConsts,
    ...(file.localTypes ?? []),
    ...(file.visibleTexts ?? []),
  ].join(" ").toLowerCase();
}

function ownerScore(file: CodeMapFile, clean: string, mode: SearchMode) {
  const visibleExact = (file.visibleTexts ?? []).some((text) => text.toLowerCase() === clean);
  const visibleHit = (file.visibleTexts ?? []).some((text) => text.toLowerCase().includes(clean));
  const routeScore = file.route ? 20 : 0;
  const workspaceScore = file.path.includes("workspace") ? 10 : 0;
  const exactScore = visibleExact ? 300 : 0;
  const visibleScore = visibleHit ? 100 : 0;
  const modeScore = mode === "visible" && visibleHit ? 80 : 0;
  return exactScore + visibleScore + modeScore + routeScore + workspaceScore;
}

function suspiciousTypes(files: CodeMapFile[]) {
  return files
    .flatMap((file) =>
      [...file.exportedTypes, ...file.exportedInterfaces, ...(file.localTypes ?? [])].map((name) => ({
        name,
        path: file.path,
      }))
    )
    .filter((item) => /mode|view|state|props|config|option/i.test(item.name))
    .slice(0, 80);
}

function commandFor(file: CodeMapFile, query: string) {
  const safeQuery = query.replaceAll('"', '`"');
  return `Select-String -LiteralPath "C:\\Users\\muzes\\themuzesgarden-site\\${file.path.replaceAll("/", "\\")}" -Pattern "${safeQuery}" -Context 0,2`;
}

function importKey(filePath: string) {
  const withoutExt = filePath.replace(/\.(tsx|ts|jsx|js)$/, "");
  const parts = withoutExt.split("/");
  return parts[parts.length - 1];
}

export default function CodeMapSearchPanel({ files }: Props) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");
  const [selectedPath, setSelectedPath] = useState("");

  const cleanQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!cleanQuery) return [];

    return files
      .filter((file) => fileHaystack(file, mode).includes(cleanQuery))
      .sort((a, b) => ownerScore(b, cleanQuery, mode) - ownerScore(a, cleanQuery, mode))
      .slice(0, 100);
  }, [files, cleanQuery, mode]);

  const selectedFile = files.find((file) => file.path === selectedPath) ?? results[0] ?? null;

  const visibleHits = selectedFile?.visibleTexts?.filter((text) =>
    text.toLowerCase().includes(cleanQuery)
  ) ?? [];

  const selectedImportKey = selectedFile ? importKey(selectedFile.path) : "";

  const importedBy = useMemo(() => {
    if (!selectedFile) return [];

    return files
      .filter((file) =>
        file.path !== selectedFile.path &&
        file.imports.some((item) => item.includes(selectedImportKey))
      )
      .slice(0, 40);
  }, [files, selectedFile, selectedImportKey]);

  const typeWatch = useMemo(() => suspiciousTypes(files), [files]);

  const modes: SearchMode[] = ["all", "visible", "types", "routes", "imports"];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="mt-4 rounded-lg border border-white/25 p-4">
        <h2 className="text-xl font-black">Search The Map</h2>
        <p className="mt-2 text-sm text-white/70">Loading code map workbench...</p>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-lg border border-white/25 p-4">
      <h2 className="text-xl font-black">Search The Map</h2>
      <p className="mt-2 text-sm text-white/70">
        Search file paths, routes, imports, exports, type names, and visible screen text.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {modes.map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            onClick={() => setMode(nextMode)}
            className={[
              "rounded border px-3 py-2 text-sm font-bold capitalize",
              mode === nextMode
                ? "border-white bg-white text-black"
                : "border-white/25 bg-black text-white",
            ].join(" ")}
          >
            {nextMode}
          </button>
        ))}
      </div>

      <input
        className="mt-3 w-full rounded border border-white/25 bg-black px-3 py-3 text-white outline-none"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try: Linked Tracks, Project Library, ProjectLibraryWorkspace..."
      />

      <div className="mt-3 text-sm text-white/60">
        {query.trim() ? `${results.length} result(s) in ${mode} mode` : "Type visible screen text to find the owner file."}
      </div>

      {selectedFile ? (
        <div className="mt-3 rounded border border-yellow-300/50 bg-yellow-300/10 p-3 text-sm">
          <div className="font-black text-yellow-100">Proof Target</div>
          <div className="mt-1 break-all">{selectedFile.path}</div>
          <div className="mt-2 text-white/70">
            Safe next step: put FRANKIE in this file first. If FRANKIE does not show, stop.
          </div>
          {visibleHits.length ? (
            <div className="mt-2 text-xs text-white/70">
              Visible text match: {visibleHits.slice(0, 3).join(" | ")}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className="rounded border border-white/15 p-3">
          <div className="font-black">Results</div>
          <div className="mt-2 max-h-[460px] space-y-1 overflow-y-auto pr-2">
            {results.map((file, index) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedPath(file.path)}
                className={[
                  "w-full rounded border px-3 py-2 text-left text-sm",
                  selectedFile?.path === file.path
                    ? "border-white bg-white text-black"
                    : "border-white/15 bg-black text-white",
                ].join(" ")}
              >
                <div className="break-all font-bold">
                  {index === 0 ? "BEST GUESS: " : ""}
                  {file.path}
                </div>
                {file.route ? <div className="text-xs opacity-70">Route: {file.route}</div> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded border border-white/15 p-3">
          <div className="font-black">Selected File Detail</div>
          {selectedFile ? (
            <div className="mt-2 space-y-3 text-sm">
              <div className="break-all rounded border border-white/10 p-2">{selectedFile.path}</div>
              <div className="text-white/70">Route: {selectedFile.route ?? "none"}</div>

              <div>
                <div className="font-bold">Exports</div>
                <div className="break-all text-xs text-white/70">
                  {[...selectedFile.exportedFunctions, ...selectedFile.exportedConsts].join(", ") || "none"}
                </div>
              </div>

              <div>
                <div className="font-bold">Types</div>
                <div className="break-all text-xs text-white/70">
                  {[...selectedFile.exportedTypes, ...selectedFile.exportedInterfaces, ...(selectedFile.localTypes ?? [])].join(", ") || "none"}
                </div>
              </div>

              <div>
                <div className="font-bold">PowerShell Finder</div>
                <textarea
                  readOnly
                  className="mt-1 h-24 w-full rounded border border-white/20 bg-black p-2 text-xs text-white"
                  value={commandFor(selectedFile, query || "VISIBLE TEXT HERE")}
                />
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-white/60">Choose a result first.</div>
          )}
        </div>

        <div className="rounded border border-white/15 p-3">
          <div className="font-black">Who Imports This File</div>
          <div className="mt-2 max-h-[180px] space-y-1 overflow-y-auto text-xs">
            {importedBy.length ? (
              importedBy.map((file) => (
                <div key={file.path} className="break-all rounded border border-white/10 px-2 py-1">
                  {file.path}
                </div>
              ))
            ) : (
              <div className="text-white/60">No import followers found.</div>
            )}
          </div>

          <div className="mt-4 font-black">Related Imports</div>
          <div className="mt-2 max-h-[160px] space-y-1 overflow-y-auto text-sm">
            {selectedFile?.imports.length ? (
              selectedFile.imports.map((item) => (
                <div key={item} className="rounded border border-white/10 px-2 py-1">
                  {item}
                </div>
              ))
            ) : (
              <div className="text-white/60">No imports found.</div>
            )}
          </div>

          <div className="mt-4 font-black">Type Watch</div>
          <div className="mt-2 max-h-[160px] space-y-1 overflow-y-auto text-xs">
            {typeWatch.map((item) => (
              <div key={`${item.path}-${item.name}`} className="rounded border border-white/10 px-2 py-1">
                <span className="font-bold">{item.name}</span>
                <div className="break-all text-white/60">{item.path}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
