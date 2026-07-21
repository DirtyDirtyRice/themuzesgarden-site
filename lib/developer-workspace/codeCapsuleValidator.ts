import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

import {
  assembledCodeCapsuleText,
  codeCapsuleCandidateHash,
  transitionCodeCapsule,
  type CodeCapsule,
  type CodeCapsuleRequirement,
  type CodeCapsuleValidation,
} from "./codeCapsule";
import { updateStoredCodeCapsule } from "./codeCapsuleStore";
import { evaluateCompletenessContract } from "./completenessContract";
import { evaluateImportAcceptance } from "./importAcceptanceGate";
import { recordPreventedAttempt, recordPreventionOutcome } from "./preventedErrorLedger";
import { previewSafePatch, type SafePatchProposal } from "./safePatchExecutor";

export type CodeCapsuleValidationResult = {
  capsule: CodeCapsule;
  confirmationToken: string | null;
  targetFileHash: string;
  diagnostics: string[];
};

const confirmationLifetimeMs = 10 * 60 * 1_000;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function proposalFor(capsule: CodeCapsule): SafePatchProposal {
  return {
    file: capsule.target.file,
    startLine: capsule.target.startLine,
    endLine: capsule.target.endLine,
    expectedLines: capsule.target.expectedLines,
    replacementLines: assembledCodeCapsuleText(capsule).split(/\r?\n/),
    explanation: `Activate validated code capsule ${capsule.id}: ${capsule.title}`,
  };
}

function candidateSource(source: string, capsule: CodeCapsule): string {
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  return [
    ...lines.slice(0, capsule.target.startLine - 1),
    ...assembledCodeCapsuleText(capsule).split(/\r?\n/),
    ...lines.slice(capsule.target.endLine),
  ].join(lineEnding);
}

function diagnosticText(diagnostic: ts.Diagnostic, root: string): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (!diagnostic.file || diagnostic.start === undefined) return `TS${diagnostic.code}: ${message}`;
  const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const relative = path.relative(root, diagnostic.file.fileName).split(path.sep).join("/");
  return `${relative}:${position.line + 1}:${position.character + 1} TS${diagnostic.code}: ${message}`;
}

function sourceFacts(sourceFile: ts.SourceFile): { symbols: Set<string>; imports: Set<string>; exports: Set<string> } {
  const symbols = new Set<string>();
  const imports = new Set<string>();
  const exports = new Set<string>();
  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.add(node.moduleSpecifier.text);
      const clause = node.importClause;
      if (clause?.name) imports.add(clause.name.text);
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) imports.add(element.name.text);
      } else if (bindings && ts.isNamespaceImport(bindings)) imports.add(bindings.name.text);
    }
    if ("name" in node) {
      const name = (node as { name?: ts.Node }).name;
      if (name && ts.isIdentifier(name)) symbols.add(name.text);
    }
    if (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      const name = "name" in node ? (node as { name?: ts.Node }).name : undefined;
      if (name && ts.isIdentifier(name)) exports.add(name.text);
    }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) exports.add(element.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return { symbols, imports, exports };
}

function requirementFailure(
  requirement: CodeCapsuleRequirement,
  source: string,
  facts: ReturnType<typeof sourceFacts>
): string | null {
  const passed =
    requirement.kind === "text"
      ? source.includes(requirement.value)
      : requirement.kind === "symbol"
        ? facts.symbols.has(requirement.value)
        : requirement.kind === "import"
          ? facts.imports.has(requirement.value)
          : facts.exports.has(requirement.value);
  return passed ? null : `Requirement failed (${requirement.kind}): ${requirement.description || requirement.value}`;
}

function readTsconfig(root: string): ts.ParsedCommandLine {
  const file = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!file) throw new Error("No tsconfig.json was found for capsule validation.");
  const read = ts.readConfigFile(file, ts.sys.readFile);
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(file), undefined, file);
  if (parsed.errors.length) throw new Error(parsed.errors.map((item) => diagnosticText(item, root)).join("\n"));
  return parsed;
}

function virtualProjectDiagnostics(root: string, targetFile: string, source: string): string[] {
  const parsed = readTsconfig(root);
  const targetKey = path.resolve(targetFile).toLowerCase();
  const options: ts.CompilerOptions = { ...parsed.options, noEmit: true, incremental: false, composite: false };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.readFile = (fileName) => path.resolve(fileName).toLowerCase() === targetKey ? source : ts.sys.readFile(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (path.resolve(fileName).toLowerCase() === targetKey) {
      const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      return ts.createSourceFile(fileName, source, languageVersion, true, kind);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options,
    projectReferences: parsed.projectReferences,
    host,
  });
  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .slice(0, 200)
    .map((diagnostic) => diagnosticText(diagnostic, root));
}

export async function validateStoredCodeCapsule(
  id: string,
  expectedVersion: number,
  root = process.cwd()
): Promise<CodeCapsuleValidationResult> {
  let confirmationToken: string | null = null;
  let targetFileHash = "";
  let finalDiagnostics: string[] = [];
  const capsule = await updateStoredCodeCapsule(id, expectedVersion, async (stored) => {
    if (!stored.fragments.length) throw new Error("Add at least one inactive fragment before validation.");
    if (!["incomplete", "waiting-validation", "validated"].includes(stored.state)) {
      throw new Error(`A ${stored.state} capsule cannot be validated.`);
    }

    let working = stored;
    if (working.state === "validated") {
      working = transitionCodeCapsule(working, "incomplete", "Validated capsule was explicitly rechecked.", "validator");
    }
    if (working.state === "incomplete") {
      working = transitionCodeCapsule(working, "waiting-validation", "All stored fragments were submitted for virtual validation.", "validator");
    }

    const rootPath = path.resolve(root);
    const preview = await previewSafePatch(proposalFor(working), rootPath);
    targetFileHash = preview.beforeHash;
    const absoluteTarget = path.resolve(rootPath, working.target.file);
    const source = await readFile(absoluteTarget, "utf8");
    const candidate = candidateSource(source, working);
    const scriptKind = absoluteTarget.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(absoluteTarget, candidate, ts.ScriptTarget.Latest, true, scriptKind);
    const parseDiagnostics = (sourceFile as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
    const facts = sourceFacts(sourceFile);
    const requirementDiagnostics = working.requirements
      .map((requirement) => requirementFailure(requirement, candidate, facts))
      .filter((failure): failure is string => failure !== null);
    const syntaxDiagnostics = parseDiagnostics.map((diagnostic) => diagnosticText(diagnostic, rootPath));
    const importAcceptance = evaluateImportAcceptance({
      root: rootPath,
      file: working.target.file,
      candidateSource: candidate,
    });
    const completeness = working.completenessContract
      ? evaluateCompletenessContract(working.completenessContract, candidate, working.target.file)
      : null;
    const importDiagnostics = importAcceptance.findings
      .filter((finding) => finding.severity === "error")
      .map((finding) => `${finding.file}:${finding.line}:${finding.column} ${finding.code}: ${finding.message}`);
    const completenessDiagnostics = completeness?.findings.map(
      (finding) => `${working.target.file}:${finding.line ?? "?"}:${finding.column ?? "?"} ${finding.code}: ${finding.message}`
    ) ?? [];
    const gateDiagnostics = [
      ...syntaxDiagnostics,
      ...requirementDiagnostics,
      ...importDiagnostics,
      ...completenessDiagnostics,
    ];
    const projectDiagnostics = gateDiagnostics.length
      ? []
      : virtualProjectDiagnostics(rootPath, absoluteTarget, candidate);
    finalDiagnostics = [...new Set([...gateDiagnostics, ...projectDiagnostics])];
    const passed = finalDiagnostics.length === 0;
    const validatedAt = new Date().toISOString();
    let preventionAttemptId = working.preventionAttemptId ?? null;
    if (!passed) {
      const prevention = await recordPreventedAttempt({
        attemptId: preventionAttemptId ?? undefined,
        capsuleId: working.id,
        file: working.target.file,
        candidateSource: candidate,
        importAcceptance,
        completeness,
        contractFailures: requirementDiagnostics.map((message) => ({
          code: "CAPSULE_REQUIREMENT_FAILED",
          message,
        })),
        compilerDiagnostics: [...syntaxDiagnostics, ...projectDiagnostics].map((message) => ({ message })),
        note: "Candidate remained inactive because one or more acceptance gates failed.",
        occurredAt: validatedAt,
      }, rootPath);
      preventionAttemptId = prevention.attemptId;
    } else if (preventionAttemptId) {
      await recordPreventionOutcome({
        attemptId: preventionAttemptId,
        capsuleId: working.id,
        file: working.target.file,
        candidateSource: candidate,
        outcome: "corrected",
        note: "A previously held capsule candidate passed all virtual acceptance gates.",
        occurredAt: validatedAt,
      }, rootPath);
    }
    confirmationToken = passed ? randomBytes(32).toString("base64url") : null;
    const validation: CodeCapsuleValidation = {
      candidateHash: codeCapsuleCandidateHash(working),
      targetFileHash,
      validatedAt,
      syntaxPassed: syntaxDiagnostics.length === 0,
      requirementsPassed: requirementDiagnostics.length === 0,
      importAcceptancePassed: importAcceptance.accepted,
      completenessPassed: completeness?.complete ?? true,
      projectTypecheckPassed: passed,
      diagnostics: finalDiagnostics,
      confirmationTokenHash: confirmationToken ? hash(confirmationToken) : null,
      confirmationExpiresAt: confirmationToken
        ? new Date(Date.now() + confirmationLifetimeMs).toISOString()
        : null,
    };
    working = { ...working, version: working.version + 1, validation, preventionAttemptId, updatedAt: validatedAt };
    if (passed) {
      return transitionCodeCapsule(working, "validated", "Virtual project typecheck and all capsule requirements passed.", "validator", validatedAt);
    }
    const incomplete = transitionCodeCapsule(working, "incomplete", "Validation failed; inactive fragments remain isolated from the live source.", "validator", validatedAt);
    return { ...incomplete, version: incomplete.version + 1, validation, updatedAt: validatedAt };
  }, root);

  return { capsule, confirmationToken, targetFileHash, diagnostics: finalDiagnostics };
}

export function confirmationTokenMatches(capsule: CodeCapsule, token: string): boolean {
  const validation = capsule.validation;
  if (!validation?.confirmationTokenHash || !validation.confirmationExpiresAt) return false;
  if (new Date(validation.confirmationExpiresAt).getTime() <= Date.now()) return false;
  if (validation.candidateHash !== codeCapsuleCandidateHash(capsule)) return false;
  return hash(token) === validation.confirmationTokenHash;
}
