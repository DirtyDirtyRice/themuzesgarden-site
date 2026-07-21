import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BuildCheckResult } from "./buildDiagnostics";
import { enqueueVerification } from "./verificationCoordinator";

export type SafePatchProposal = {
  file: string;
  startLine: number;
  endLine: number;
  expectedLines: string[];
  replacementLines: string[];
  explanation: string;
};

export type SafePatchPreview = {
  proposal: SafePatchProposal;
  beforeHash: string;
  before: string[];
  after: string[];
  changedLineCount: number;
};

export type SafePatchResult = SafePatchPreview & {
  applied: boolean;
  rolledBack: boolean;
  verification: BuildCheckResult;
};

const BLOCKED_SEGMENTS = new Set([".git", ".next", ".vercel", "node_modules", "code-map-reports"]);
const BLOCKED_NAMES = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const ALLOWED_EXTENSIONS = new Set([".css", ".js", ".jsx", ".mjs", ".mts", ".scss", ".ts", ".tsx"]);
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_CHANGED_LINES = 500;
const patchLockKey = "__developerWorkspaceSafePatchLock";
const patchLockStore = globalThis as typeof globalThis & { [patchLockKey]?: Promise<void> };
patchLockStore[patchLockKey] ??= Promise.resolve();

async function withPatchLock<T>(work: () => Promise<T>): Promise<T> {
  const previous = patchLockStore[patchLockKey]!;
  let release!: () => void;
  patchLockStore[patchLockKey] = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    return await work();
  } finally {
    release();
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeLines(value: string): string[] {
  return value.split(/\r?\n/);
}

function validateProposal(proposal: SafePatchProposal): void {
  if (!proposal.file?.trim() || path.isAbsolute(proposal.file)) throw new Error("Patch file must be a project-relative path.");
  const segments = proposal.file.split(/[\\/]+/).filter(Boolean);
  if (segments.includes("..") || segments.some((segment) => BLOCKED_SEGMENTS.has(segment))) throw new Error("Patch file is outside the editable project source.");
  if (segments.some((segment) => BLOCKED_NAMES.has(segment.toLowerCase()))) throw new Error("Environment and credential files cannot be patched by the workspace.");
  if (!ALLOWED_EXTENSIONS.has(path.extname(proposal.file).toLowerCase())) throw new Error("This file type is not enabled for safe patches.");
  if (!Number.isInteger(proposal.startLine) || !Number.isInteger(proposal.endLine) || proposal.startLine < 1 || proposal.endLine < proposal.startLine) throw new Error("Patch line range is invalid.");
  if (!Array.isArray(proposal.expectedLines) || !Array.isArray(proposal.replacementLines)) throw new Error("Patch lines are required.");
  if (proposal.expectedLines.length !== proposal.endLine - proposal.startLine + 1) throw new Error("Expected lines do not match the proposed line range.");
  if (proposal.expectedLines.length + proposal.replacementLines.length > MAX_CHANGED_LINES) throw new Error(`Safe patches are limited to ${MAX_CHANGED_LINES} combined lines.`);
}

async function resolvePatch(proposal: SafePatchProposal, rootOption = process.cwd()): Promise<{ root: string; file: string; source: string; lines: string[]; lineEnding: string }> {
  validateProposal(proposal);
  const root = await realpath(path.resolve(rootOption));
  const requested = path.resolve(root, proposal.file);
  const relative = path.relative(root, requested);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Patch file resolved outside the project root.");
  const file = await realpath(requested);
  const resolvedRelative = path.relative(root, file);
  if (!resolvedRelative || resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) throw new Error("Patch file resolved outside the project root.");
  const buffer = await readFile(file);
  if (buffer.byteLength > MAX_FILE_BYTES) throw new Error("Patch file exceeds the 2 MB safety limit.");
  if (buffer.includes(0)) throw new Error("Binary files cannot be patched.");
  const source = buffer.toString("utf8");
  return { root, file, source, lines: normalizeLines(source), lineEnding: source.includes("\r\n") ? "\r\n" : "\n" };
}

export async function previewSafePatch(proposal: SafePatchProposal, rootOption = process.cwd()): Promise<SafePatchPreview> {
  const resolved = await resolvePatch(proposal, rootOption);
  if (proposal.endLine > resolved.lines.length) throw new Error("Patch range extends beyond the end of the file.");
  const before = resolved.lines.slice(proposal.startLine - 1, proposal.endLine);
  if (before.length !== proposal.expectedLines.length || before.some((line, index) => line !== proposal.expectedLines[index])) throw new Error("The source changed after this patch was proposed. Refresh the diagnosis before applying it.");
  return { proposal, beforeHash: hash(resolved.source), before, after: proposal.replacementLines, changedLineCount: Math.max(before.length, proposal.replacementLines.length) };
}

async function applySafePatchUnlocked(proposal: SafePatchProposal, expectedHash: string, project: { root?: string; projectId?: string }): Promise<SafePatchResult> {
  const preview = await previewSafePatch(proposal, project.root);
  if (preview.beforeHash !== expectedHash) throw new Error("The file changed after preview. The patch was not applied.");
  const resolved = await resolvePatch(proposal, project.root);
  const nextLines = [...resolved.lines.slice(0, proposal.startLine - 1), ...proposal.replacementLines, ...resolved.lines.slice(proposal.endLine)];
  const nextSource = nextLines.join(resolved.lineEnding);
  const temporaryFile = path.join(path.dirname(resolved.file), `.${path.basename(resolved.file)}.${randomUUID()}.safe-patch.tmp`);
  let applied = false;
  try {
    await writeFile(temporaryFile, nextSource, "utf8");
    await rename(temporaryFile, resolved.file);
    applied = true;
    const verificationJob = await enqueueVerification("typecheck", "safe-patch", project);
    if (!verificationJob.result) throw new Error("Safe patch verification completed without a result.");
    const verification = verificationJob.result;
    if (verification.status !== "passed") {
      await writeFile(resolved.file, resolved.source, "utf8");
      return { ...preview, applied: false, rolledBack: true, verification };
    }
    return { ...preview, applied: true, rolledBack: false, verification };
  } catch (error) {
    if (applied) await writeFile(resolved.file, resolved.source, "utf8");
    throw error;
  } finally {
    await rm(temporaryFile, { force: true });
  }
}

export function applySafePatch(
  proposal: SafePatchProposal,
  expectedHash: string,
  project: { root?: string; projectId?: string } = {}
): Promise<SafePatchResult> {
  return withPatchLock(() => applySafePatchUnlocked(proposal, expectedHash, project));
}
