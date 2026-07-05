"use client";

import { useState } from "react";
import CodeMapSearchPanel from "./CodeMapSearchPanel";

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

type CodeMapTab = "search" | "save" | "risk";

type Props = {
  snapshot: CodeMapSnapshot;
};

const tabs: { id: CodeMapTab; label: string }[] = [
  { id: "search", label: "Search Map" },
  { id: "save", label: "Save / Push" },
  { id: "risk", label: "Proof / Risk" },
];

function CommandBox({ children }: { children: string }) {
  return (
    <pre className="mt-2 whitespace-pre-wrap break-all rounded border border-white/15 bg-black p-4 text-base text-white">
      {children}
    </pre>
  );
}

function PanelCard({
  title,
  children,
  warning,
}: {
  title: string;
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={[
        "rounded border p-3",
        warning ? "border-yellow-300/40 bg-yellow-300/10" : "border-white/15",
      ].join(" ")}
    >
      <h3 className={warning ? "font-black text-yellow-100" : "font-black"}>{title}</h3>
      <div className="mt-2 text-sm text-white/75">{children}</div>
    </div>
  );
}

export default function CodeMapDashboard({ snapshot }: Props) {
  const [activeTab, setActiveTab] = useState<CodeMapTab>("search");

  return (
    <>
      <section className="rounded-lg border border-white/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.35em]">Coding App</div>
            <h1 className="text-4xl font-black">Code Map</h1>
            <p className="mt-2 text-white/80">Finder first. Proof edit second. Real edit third.</p>
            <p className="mt-3 text-xs text-white/50">Snapshot: {snapshot.generatedAt}</p>
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
              <div className="text-2xl font-black">
                {
                  snapshot.files.filter(
                    (file) => file.exportedTypes.length || file.exportedInterfaces.length
                  ).length
                }
              </div>
              <div className="text-xs text-white/60">Type Files</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "rounded-md border px-4 py-3 text-base font-black",
                activeTab === tab.id
                  ? "border-white bg-white text-black"
                  : "border-white/25 bg-black text-white",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "search" ? <CodeMapSearchPanel files={snapshot.files} /> : null}

      {activeTab === "save" ? (
        <section className="mt-4 rounded-lg border border-white/25 p-4">
          <h2 className="text-2xl font-black">Save / Push</h2>
          <p className="mt-2 text-white/70">
            Save today&apos;s developer handoff first. Push only real app files.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <PanelCard title="1. Make Today's Save">
              Creates today&apos;s human-programmer handoff package.
              <CommandBox>node scripts/codex-daily-save.mjs 2026-07-05</CommandBox>
            </PanelCard>

            <PanelCard title="2. Open The Folder">
              This is where README and patch files are saved.
              <CommandBox>
                explorer C:\Users\muzes\themuzesgarden-site\codex-session-notes\2026-07-05-coding-app
              </CommandBox>
            </PanelCard>

            <PanelCard title="3. Safe Add">
              Do not use git add . while generated folders are present.
              <CommandBox>
                git add app/tools/code-map scripts/code-map-snapshot.mjs scripts/codex-daily-save.mjs scripts/code-risk-report.mjs app/components/TitleBar.tsx
              </CommandBox>
            </PanelCard>

            <PanelCard title="4. Commit And Push">
              Use this after build is green.
              <CommandBox>{`git commit -m "Add code map workbench"
git push
git status`}</CommandBox>
            </PanelCard>

            <PanelCard title="5. Generated Folders Stay Out" warning>
              Do not accidentally push: code-map-reports, codex-session-notes, duplicate-reports.
              <CommandBox>git status</CommandBox>
            </PanelCard>
          </div>
        </section>
      ) : null}

      {activeTab === "risk" ? (
        <section className="mt-4 rounded-lg border border-white/25 p-4">
          <h2 className="text-2xl font-black">Proof / Risk</h2>
          <p className="mt-2 text-white/70">
            This is the prevention engine: find the owner, prove the file, then edit.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <PanelCard title="1. Refresh Code Map">
              Rebuild the code snapshot before checking risk.
              <CommandBox>node scripts/code-map-snapshot.mjs</CommandBox>
            </PanelCard>

            <PanelCard title="2. Run Risk Report">
              Creates a JSON report of likely wiring problems.
              <CommandBox>node scripts/code-risk-report.mjs</CommandBox>
            </PanelCard>

            <PanelCard title="3. Finder First">
              Replace the path with the Proof Target file.
              <CommandBox>{`$file = "C:\\Users\\muzes\\themuzesgarden-site\\app\\workspace\\projects\\[id]\\ProjectLibraryWorkspace.tsx"
Select-String -LiteralPath $file -Pattern "Linked Tracks|Project Library|FRANKIE" -Context 1,2`}</CommandBox>
            </PanelCard>

            <PanelCard title="4. FRANKIE Proof">
              Put FRANKIE in the suspected owner file. If it does not show, stop.
              <CommandBox>{`$text = Get-Content -Raw -LiteralPath $file
$text = $text.Replace("Project Library", "Project Library - FRANKIE")
Set-Content -NoNewline -Encoding UTF8 -LiteralPath $file -Value $text`}</CommandBox>
            </PanelCard>

            <PanelCard title="5. Error Prevention Rule" warning>
              Risk report is a warning system, not a delete list. Finder first, proof edit second, real edit third.
              <CommandBox>npm run build</CommandBox>
            </PanelCard>
          </div>
        </section>
      ) : null}
    </>
  );
}
