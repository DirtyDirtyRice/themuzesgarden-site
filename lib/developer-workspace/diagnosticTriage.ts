import type { BuildDiagnostic } from "./buildDiagnostics";

export type DiagnosticRepairCategory = "syntax" | "missing-symbol" | "contract" | "module" | "runtime" | "other";
export type DiagnosticRepairCluster = { id: string; category: DiagnosticRepairCategory; priority: number; title: string; primary: BuildDiagnostic; related: BuildDiagnostic[]; affectedFiles: string[] };
export type DiagnosticTriageReport = { generatedAt: string; totalDiagnostics: number; primaryDiagnostics: number; cascadeDiagnostics: number; clusters: DiagnosticRepairCluster[] };

function category(diagnostic: BuildDiagnostic): DiagnosticRepairCategory {
  const code = diagnostic.code ?? "";
  const message = diagnostic.message.toLowerCase();
  if (/^TS(1002|1003|1005|1109|1127|1128|1136|1160|1351|1434|1435)$/.test(code) || /syntax|parse|unterminated|expected/.test(message)) return "syntax";
  if (/^TS(2304|2305|2307|2552)$/.test(code) || /cannot find|has no exported member|not defined/.test(message)) return "missing-symbol";
  if (/^TS(2322|2339|2345|2352|2416|2420|2739|2741)$/.test(code) || /not assignable|missing the following|property .* does not exist/.test(message)) return "contract";
  if (/module|import|export/.test(message)) return "module";
  if (/typeerror|referenceerror|rangeerror/.test(code.toLowerCase()) || /runtime/.test(message)) return "runtime";
  return "other";
}

const rank: Record<DiagnosticRepairCategory, number> = { syntax: 1, "missing-symbol": 2, module: 3, contract: 4, runtime: 5, other: 6 };

export function triageBuildDiagnostics(diagnostics: BuildDiagnostic[]): DiagnosticTriageReport {
  const byId = new Map(diagnostics.map((item) => [item.id, item]));
  const primaries = diagnostics.filter((item) => item.primary);
  const clusters = primaries.map((primary) => {
    const related = diagnostics.filter((item) => item.cascadeOf === primary.id);
    const kind = category(primary);
    const files = [primary, ...related].flatMap((item) => item.file ? [item.file] : []);
    return { id: `repair:${primary.id}`, category: kind, priority: rank[kind], title: kind === "syntax" ? "Repair parsing before evaluating later errors" : kind === "missing-symbol" ? "Restore the missing definition or import" : kind === "module" ? "Repair the module boundary" : kind === "contract" ? "Reconcile the type contract" : kind === "runtime" ? "Repair the runtime failure" : "Investigate the primary diagnostic", primary, related, affectedFiles: [...new Set(files)] } satisfies DiagnosticRepairCluster;
  }).sort((left, right) => left.priority - right.priority || Number(right.related.length) - Number(left.related.length) || (left.primary.file ?? "").localeCompare(right.primary.file ?? "") || (left.primary.line ?? 0) - (right.primary.line ?? 0));

  for (const diagnostic of diagnostics.filter((item) => !item.primary && item.cascadeOf && !byId.has(item.cascadeOf))) {
    const kind = category(diagnostic);
    clusters.push({ id: `repair:${diagnostic.id}`, category: kind, priority: rank[kind], title: "Investigate an orphaned cascading diagnostic", primary: diagnostic, related: [], affectedFiles: diagnostic.file ? [diagnostic.file] : [] });
  }

  return { generatedAt: new Date().toISOString(), totalDiagnostics: diagnostics.length, primaryDiagnostics: primaries.length, cascadeDiagnostics: diagnostics.length - primaries.length, clusters };
}
