import { NextRequest, NextResponse } from "next/server";

import { proposeErrorPatch } from "@/lib/developer-workspace/errorPatchProposal";
import type { BuildDiagnostic } from "@/lib/developer-workspace/buildDiagnostics";
import { buildProjectContext } from "@/lib/developer-workspace/projectContext";
import { readProjectFile } from "@/lib/developer-workspace/projectFile";
import { buildProjectIndex, type ProjectIndex } from "@/lib/developer-workspace/projectIndex";
import { buildSymbolIndex, type SymbolIndex } from "@/lib/developer-workspace/symbolIndex";
import { buildRelationshipIndex } from "@/lib/developer-workspace/relationshipIndex";
import { investigateTemporalErrorOrigin } from "@/lib/developer-workspace/temporalErrorOrigin";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectIndexPromises = new Map<string, Promise<ProjectIndex>>();
const symbolIndexPromises = new Map<string, Promise<SymbolIndex>>();

function isLocalRequest(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function indexes(projectId: string, root: string): Promise<[ProjectIndex, SymbolIndex]> {
  if (!projectIndexPromises.has(projectId)) projectIndexPromises.set(projectId, buildProjectIndex({ root }));
  if (!symbolIndexPromises.has(projectId)) symbolIndexPromises.set(projectId, buildSymbolIndex({ root }));
  return Promise.all([projectIndexPromises.get(projectId)!, symbolIndexPromises.get(projectId)!]);
}

function readDiagnostic(value: unknown): BuildDiagnostic {
  if (typeof value !== "object" || value === null) throw new Error("A build diagnostic is required.");
  const candidate = value as Partial<BuildDiagnostic>;
  if (typeof candidate.id !== "string" || typeof candidate.message !== "string") throw new Error("The build diagnostic is incomplete.");
  if (candidate.file !== null && candidate.file !== undefined && typeof candidate.file !== "string") throw new Error("The diagnostic file is invalid.");
  return {
    id: candidate.id,
    file: candidate.file ?? null,
    line: typeof candidate.line === "number" ? candidate.line : null,
    column: typeof candidate.column === "number" ? candidate.column : null,
    code: typeof candidate.code === "string" ? candidate.code : null,
    severity: candidate.severity === "warning" ? "warning" : "error",
    message: candidate.message.slice(0, 4_000),
    primary: candidate.primary !== false,
    cascadeOf: typeof candidate.cascadeOf === "string" ? candidate.cascadeOf : null,
  };
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "Error investigation is available only from the local workspace." }, { status: 403 });
  try {
    const payload = await request.json() as { diagnostic?: unknown };
    const diagnostic = readDiagnostic(payload.diagnostic);
    const workspaceContext = await resolveWorkspaceRequestContext(request);
    const location = diagnostic.file ? `${diagnostic.file}:${diagnostic.line ?? "?"}:${diagnostic.column ?? "?"}` : "build process";
    const evidenceQuery = `${diagnostic.code ?? "compiler error"} ${diagnostic.message} ${diagnostic.file ?? ""}`;
    const [projectIndex, symbolIndex] = await indexes(workspaceContext.projectId, workspaceContext.root);
    const context = await buildProjectContext(evidenceQuery, projectIndex, symbolIndex, { maxSymbols: 16, maxFiles: 12, maxExcerpts: 12, maxCharacters: 55_000 });
    const temporal = await investigateTemporalErrorOrigin(diagnostic, symbolIndex, await buildRelationshipIndex(workspaceContext.root), workspaceContext.root);
    const temporalEvidence = temporal.candidates.slice(0, 10).map((candidate, index) => `${index + 1}. ${candidate.event.occurredAt} ${candidate.event.kind} ${candidate.event.symbolName} at ${candidate.event.path}:${candidate.event.line}; confidence=${candidate.confidence}; score=${candidate.score}; reasons=${candidate.reasons.join(", ")}; commit=${candidate.event.gitCommit ?? "none"}; details=${candidate.event.details}`).join("\n") || "No matching historical candidates were found.";
    if (diagnostic.file && diagnostic.line) {
      const source = await readProjectFile(diagnostic.file, { root: workspaceContext.root, startLine: Math.max(1, diagnostic.line - 12), lineCount: 50 });
      context.excerpts = context.excerpts.filter((excerpt) => excerpt.path !== source.path);
      context.excerpts.unshift({ id: `diagnostic:${source.path}:${source.startLine}`, path: source.path, startLine: source.startLine, endLine: source.endLine, language: source.language, reason: "exact failing diagnostic source", score: 2_000, lines: source.lines });
      context.characterCount = context.excerpts.reduce((total, excerpt) => total + excerpt.lines.reduce((lineTotal, line) => lineTotal + line.text.length + 12, 0), 0);
    }
    const question = `Investigate this ${diagnostic.severity}:\nLocation: ${location}\nCode: ${diagnostic.code ?? "none"}\nMessage: ${diagnostic.message}\n\nReturn these sections: ROOT CAUSE, EVIDENCE, MINIMAL FIX, PROPOSED PATCH, RISKS, VERIFICATION. The proposed patch must be a reviewable unified diff only when the evidence is sufficient. Do not invent missing code.`;
    void question;
    const investigation = await proposeErrorPatch(diagnostic, context, temporalEvidence);
    const answer = `ROOT CAUSE\n${investigation.diagnosis}\n\nEVIDENCE\n${investigation.evidence}\n\nRISKS\n${investigation.risks}\n\nVERIFICATION\n${investigation.verification}`;
    return NextResponse.json({ project: workspaceContext.project, diagnostic, ...investigation, answer, contextCharacters: context.characterCount, citations: context.excerpts.map(({ path, startLine, endLine, reason }) => ({ path, startLine, endLine, reason })), context: { symbols: context.symbols.length, files: context.files.length, excerpts: context.excerpts.length, temporalCandidates: temporal.candidates.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error investigation failed.";
    return NextResponse.json({ error: message }, { status: message.includes("OPENAI_API_KEY") ? 503 : 400 });
  }
}
