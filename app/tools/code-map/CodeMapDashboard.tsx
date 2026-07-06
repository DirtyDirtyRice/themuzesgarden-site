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
  riskReport: Record<string, unknown> | null;
  symbolWatch: Record<string, unknown> | null;
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

function readRiskList(report: Record<string, unknown> | null, key: string): unknown[] {
  const value = report?.[key];
  return Array.isArray(value) ? value : [];
}

function RiskCountCard({
  label,
  count,
  severity,
}: {
  label: string;
  count: number;
  severity: "High" | "Medium" | "Low";
}) {
  const color =
    severity === "High"
      ? "border-red-400/60 bg-red-400/10"
      : severity === "Medium"
        ? "border-yellow-300/50 bg-yellow-300/10"
        : "border-white/15";

  return (
    <div className={["rounded border p-3", color].join(" ")}>
      <div className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
        {severity}
      </div>
      <div className="mt-1 text-3xl font-black">{count}</div>
      <div className="text-sm text-white/70">{label}</div>
    </div>
  );
}

function RiskList({
  title,
  items,
  severity,
}: {
  title: string;
  items: unknown[];
  severity: "High" | "Medium" | "Low";
}) {
  return (
    <div
      className={[
        "rounded border p-3",
        severity === "High"
          ? "border-red-400/60"
          : severity === "Medium"
            ? "border-yellow-300/50"
            : "border-white/15",
      ].join(" ")}
    >
      <h3 className="font-black">{title}</h3>
      <div className="mt-2 text-sm text-white/65">{items.length} item(s)</div>
      <div className="mt-2 max-h-[220px] space-y-2 overflow-y-auto pr-2 text-xs">
        {items.slice(0, 40).map((item, index) => (
          <pre
            key={index}
            className="whitespace-pre-wrap break-all rounded border border-white/10 bg-black p-2 text-white/75"
          >
            {JSON.stringify(item, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}

export default function CodeMapDashboard({ snapshot, riskReport, symbolWatch }: Props) {
  const [activeTab, setActiveTab] = useState<CodeMapTab>("search");
  const missingRenderWatch = readRiskList(riskReport, "missingRenderWatch");
  const unusedTypeWatch = readRiskList(riskReport, "unusedTypeWatch");
  const routeOrphans = readRiskList(riskReport, "routeOrphans");
  const exportedButNoFollowers = readRiskList(riskReport, "exportedButNoFollowers");
  const symbolFindings = Array.isArray(symbolWatch?.findings)
    ? symbolWatch.findings
    : [];
  const knownBadCaught = symbolFindings.some(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "path" in item &&
      "symbol" in item &&
      String(item.path).includes("missing-tools-dropdown-example.tsx") &&
      String(item.symbol) === "TOOLS_CHILD_LINKS"
  );

  const missingSaveHandlerCaught = symbolFindings.some(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "path" in item &&
      "symbol" in item &&
      "kind" in item &&
      String(item.path).includes("missing-save-handler-example.tsx") &&
      String(item.symbol) === "onSaveProjectDescription" &&
      String(item.kind) === "missing-required-prop"
  );

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
            <div className="grid gap-3 lg:col-span-2 lg:grid-cols-3">
              <RiskCountCard
                label="Missing render warnings"
                count={missingRenderWatch.length}
                severity="High"
              />
              <RiskCountCard
                label="Unused type warnings"
                count={unusedTypeWatch.length}
                severity="Medium"
              />
              <RiskCountCard
                label="Route/no-follower warnings"
                count={routeOrphans.length + exportedButNoFollowers.length}
                severity="Low"
              />
            </div>

            <RiskList title="Missing Render Watch" items={missingRenderWatch} severity="High" />
            <RiskList title="Unused Type Watch" items={unusedTypeWatch} severity="Medium" />
            <RiskList title="Route Orphans" items={routeOrphans} severity="Low" />
            <RiskList title="Exported But No Followers" items={exportedButNoFollowers} severity="Low" />

            <PanelCard title="1. Refresh Code Map">
              Rebuild the code snapshot before checking risk.
              <CommandBox>node scripts/code-map-snapshot.mjs</CommandBox>
            </PanelCard>

            <PanelCard title="2. Run Risk Report">
              Creates a JSON report of likely wiring problems.
              <CommandBox>node scripts/code-risk-report.mjs</CommandBox>
            </PanelCard>

            <PanelCard title="3. Known Bad Tests">
              <div className="space-y-2 text-lg font-black">
                <div>Tools dropdown: {knownBadCaught ? "CAUGHT" : "MISSED"}</div>
                <div>Save handler: {missingSaveHandlerCaught ? "CAUGHT" : "MISSED"}</div>
              </div>
              <p className="mt-2 text-sm text-white/70">
                Known broken examples must be caught before we trust the scanner.
              </p>
              <CommandBox>node scripts/code-symbol-watch.mjs</CommandBox>
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
