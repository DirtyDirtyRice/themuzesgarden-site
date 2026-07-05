import fs from "node:fs/promises";
import path from "node:path";
import CodeMapSearchPanel from "./CodeMapSearchPanel";

type CodeMapFile = {
  path: string;
  route: string | null;
  imports: string[];
  exportedTypes: string[];
  exportedInterfaces: string[];
  exportedFunctions: string[];
  exportedConsts: string[];
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

  const routes = snapshot.files.filter((file) => file.route);
  const typeFiles = snapshot.files.filter(
    (file) => file.exportedTypes.length || file.exportedInterfaces.length
  );

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <section className="rounded-lg border border-white/25 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
              Coding App
            </p>
            <h1 className="text-4xl font-black">Code Map</h1>
            <p className="mt-2 text-white/70">
              Finder first. Proof edit second. Real edit third.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded border border-white/25 p-3">
              <div className="text-2xl font-black">{snapshot.fileCount}</div>
              <div className="text-xs text-white/60">Files</div>
            </div>
            <div className="rounded border border-white/25 p-3">
              <div className="text-2xl font-black">{snapshot.routeCount}</div>
              <div className="text-xs text-white/60">Routes</div>
            </div>
            <div className="rounded border border-white/25 p-3">
              <div className="text-2xl font-black">{typeFiles.length}</div>
              <div className="text-xs text-white/60">Type Files</div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/50">
          Snapshot: {snapshot.generatedAt}
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-white/25 p-4">
        <h2 className="text-xl font-black">Daily Save Workbench</h2>
        <p className="mt-2 text-sm text-white/70">
          Creates a developer handoff folder with README, changed files, status, and patch files.
        </p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">1. Do This First</h3>
            <p className="mt-1 text-sm text-white/65">Creates today&apos;s human-programmer handoff package.</p>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`node scripts/codex-daily-save.mjs 2026-07-05`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">2. Then Open The Folder</h3>
            <p className="mt-1 text-sm text-white/65">This is where the README and patch files are saved.</p>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`explorer C:\\Users\\muzes\\themuzesgarden-site\\codex-session-notes\\2026-07-05-coding-app`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">3. What Gets Saved</h3>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              <li>README.md: plain-English handoff</li>
              <li>changed-files-list.txt: touched files</li>
              <li>git-status.txt: current tree state</li>
              <li>git-diff.patch: actual code changes</li>
              <li>git-staged-diff.patch: staged code changes</li>
            </ul>
          </div>

          <div className="rounded border border-yellow-300/40 bg-yellow-300/10 p-3">
            <h3 className="font-black text-yellow-100">4. Push Safety</h3>
            <p className="mt-2 text-sm text-white/75">
              Do not use git add . when generated folders are present. Add only the app files we mean to push.
            </p>
            <div className="mt-2 text-sm text-white/75">
              Never push by accident: code-map-reports, codex-session-notes, duplicate-reports.
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`git status`}
            </pre>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-white/25 p-4">
        <h2 className="text-xl font-black">Push Safety Workbench</h2>
        <p className="mt-2 text-sm text-white/70">
          Use these when the Code Map work is ready to save to GitHub.
        </p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">1. Check First</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`git status`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">2. Add Only App Files</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`git add app/tools/code-map scripts/code-map-snapshot.mjs scripts/codex-daily-save.mjs`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">3. Commit</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`git commit -m "Add code map workbench"`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">4. Push</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`git push`}
            </pre>
          </div>

          <div className="rounded border border-yellow-300/40 bg-yellow-300/10 p-3 lg:col-span-2">
            <h3 className="font-black text-yellow-100">5. End Check</h3>
            <p className="mt-2 text-sm text-white/75">
              It is okay if generated folders remain untracked: code-map-reports, codex-session-notes, duplicate-reports.
            </p>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`git status`}
            </pre>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-white/25 p-4">
        <h2 className="text-xl font-black">Proof Edit Workbench</h2>
        <p className="mt-2 text-sm text-white/70">
          Use this before any real edit. Prove the file owns the screen first.
        </p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">1. Pick The File</h3>
            <p className="mt-1 text-sm text-white/65">Replace the path with the Proof Target file.</p>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`$file = "C:\\Users\\muzes\\themuzesgarden-site\\app\\workspace\\projects\\[id]\\ProjectLibraryWorkspace.tsx"`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">2. Finder First</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`Select-String -LiteralPath $file -Pattern "Linked Tracks|Project Library|FRANKIE" -Context 1,2`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">3. Add FRANKIE Proof</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`$text = Get-Content -Raw -LiteralPath $file
$text = $text.Replace("Project Library", "Project Library - FRANKIE")
Set-Content -NoNewline -Encoding UTF8 -LiteralPath $file -Value $text`}
            </pre>
          </div>

          <div className="rounded border border-white/15 p-3">
            <h3 className="font-black">4. Remove FRANKIE Proof</h3>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`$text = Get-Content -Raw -LiteralPath $file
$text = $text.Replace("Project Library - FRANKIE", "Project Library")
Set-Content -NoNewline -Encoding UTF8 -LiteralPath $file -Value $text`}
            </pre>
          </div>

          <div className="rounded border border-yellow-300/40 bg-yellow-300/10 p-3 lg:col-span-2">
            <h3 className="font-black text-yellow-100">5. Rule</h3>
            <p className="mt-2 text-sm text-white/75">
              Restart dev or refresh the browser. If FRANKIE does not appear on the screen, stop. Wrong file.
            </p>
            <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
{`npm run dev`}
            </pre>
          </div>
        </div>
      </section>

      <CodeMapSearchPanel files={snapshot.files} />

      <section className="mt-4 rounded-lg border border-white/25 p-4">
        <h2 className="text-xl font-black">Finder Proof</h2>
        <p className="mt-2 text-sm text-white/70">
          Before changing UI, prove the file that owns the screen.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded border border-white/15 p-3">
            <div className="text-sm font-bold">Visible Text Finder</div>
            <code className="mt-2 block whitespace-pre-wrap break-all text-xs text-white/70">
              {`Get-ChildItem -Path "C:\\Users\\muzes\\themuzesgarden-site" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "VISIBLE TEXT HERE" | Select-Object Path, LineNumber, Line`}
            </code>
          </div>

          <div className="rounded border border-white/15 p-3">
            <div className="text-sm font-bold">Proof Marker Rule</div>
            <p className="mt-2 text-xs text-white/70">
              Add FRANKIE to the suspected file first. If FRANKIE does not appear
              on the page, stop. Wrong file.
            </p>
          </div>

          <div className="rounded border border-white/15 p-3">
            <div className="text-sm font-bold">Type Safety Rule</div>
            <p className="mt-2 text-xs text-white/70">
              Draft new types as comments first. Activate only after imports,
              usage, and checks are proven.
            </p>
          </div>

          <div className="rounded border border-white/15 p-3">
            <div className="text-sm font-bold">Second Yes Rule</div>
            <p className="mt-2 text-xs text-white/70">
              Finder first. Proof edit second. Real edit third. Then run dev or build.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/25 p-4">
          <h2 className="text-xl font-black">Routes</h2>
          <div className="mt-3 max-h-[520px] space-y-1 overflow-y-auto pr-2">
            {routes.map((file) => (
              <div
                key={file.path}
                className="rounded border border-white/15 px-3 py-2 text-sm"
              >
                <div className="font-bold">{file.route}</div>
                <div className="break-all text-xs text-white/60">
                  {file.path}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/25 p-4">
          <h2 className="text-xl font-black">Type Files</h2>
          <div className="mt-3 max-h-[520px] space-y-1 overflow-y-auto pr-2">
            {typeFiles.slice(0, 120).map((file) => (
              <div
                key={file.path}
                className="rounded border border-white/15 px-3 py-2 text-sm"
              >
                <div className="break-all font-bold">{file.path}</div>
                <div className="mt-1 break-all text-xs text-white/60">
                  {[...file.exportedTypes, ...file.exportedInterfaces].join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
