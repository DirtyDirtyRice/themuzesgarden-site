import fs from "node:fs/promises";
import path from "node:path";
import CodeMapDashboard from "./CodeMapDashboard";

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

type CodeMapSnapshot = {
  generatedAt: string;
  fileCount: number;
  routeCount: number;
  files: CodeMapFile[];
};

async function loadSnapshot(): Promise<CodeMapSnapshot | null> {
  try {
    const snapshotPath = path.join(
      process.cwd(),
      "code-map-reports",
      "code-map-snapshot.json"
    );

    const raw = await fs.readFile(snapshotPath, "utf8");
    return JSON.parse(raw) as CodeMapSnapshot;
  } catch {
    return null;
  }
}

export default async function CodeMapPage() {
  const snapshot = await loadSnapshot();

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        <section className="rounded-lg border border-white/25 p-4">
          <h1 className="text-3xl font-black">Code Map</h1>
          <p className="mt-3 text-white/80">
            No snapshot found yet. Run scripts/code-map-snapshot.mjs first.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white">
      <CodeMapDashboard snapshot={snapshot} />
    </main>
  );
}
