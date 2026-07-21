import { createHash } from "node:crypto";

import ts from "typescript";

import type { CodeRootRecommendation } from "./codeRootRecommendation";
import { parseCodeRootSignatures } from "./codeRootSignature";

export type CodeRootInsertionValidation = {
  passed: boolean;
  errors: string[];
  checks: Array<{
    name: "request" | "syntax" | "token-equivalence" | "root-signatures";
    passed: boolean;
    details: string;
  }>;
};

export type CodeRootInsertionPreview = {
  path: string;
  originalSource: string;
  candidateSource: string;
  insertedRootIds: string[];
  insertedLineCount: number;
  originalTokenHash: string;
  candidateTokenHash: string;
  validation: CodeRootInsertionValidation;
};

function normalizedPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function languageVariant(filePath: string): ts.LanguageVariant {
  return /\.[jt]sx$/i.test(filePath) ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
}

function scriptKind(filePath: string): ts.ScriptKind {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filePath.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function tokenHash(source: string, filePath: string): string {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    languageVariant(filePath),
    source
  );
  const hash = createHash("sha256");
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    hash.update(String(token));
    hash.update("\0");
    hash.update(scanner.getTokenText());
    hash.update("\0");
    token = scanner.scan();
  }
  return hash.digest("hex");
}

function syntaxDiagnostics(source: string, filePath: string): ts.DiagnosticWithLocation[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(filePath)
  );
  const parsed = sourceFile as ts.SourceFile & {
    parseDiagnostics: readonly ts.DiagnosticWithLocation[];
  };
  return [...parsed.parseDiagnostics];
}

function diagnosticKey(diagnostic: ts.Diagnostic): string {
  return `${diagnostic.code}:${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`;
}

function addedSyntaxDiagnostics(original: string, candidate: string, filePath: string): string[] {
  const previous = new Map<string, number>();
  for (const diagnostic of syntaxDiagnostics(original, filePath)) {
    const key = diagnosticKey(diagnostic);
    previous.set(key, (previous.get(key) ?? 0) + 1);
  }
  const additions: string[] = [];
  for (const diagnostic of syntaxDiagnostics(candidate, filePath)) {
    const key = diagnosticKey(diagnostic);
    const remaining = previous.get(key) ?? 0;
    if (remaining > 0) previous.set(key, remaining - 1);
    else additions.push(key);
  }
  return additions;
}

function requestErrors(
  source: string,
  filePath: string,
  recommendations: CodeRootRecommendation[]
): string[] {
  const lineCount = source.split(/\r?\n/).length;
  const errors: string[] = [];
  const ids = new Set<string>();
  const lines = new Set<number>();
  if (!recommendations.length) errors.push("At least one root recommendation is required.");
  for (const recommendation of recommendations) {
    if (normalizedPath(recommendation.path) !== filePath) errors.push(`Root ${recommendation.id} belongs to ${recommendation.path}, not ${filePath}.`);
    if (recommendation.insertionLine < 1 || recommendation.insertionLine > lineCount) errors.push(`Root ${recommendation.id} insertion line is outside the source file.`);
    if (recommendation.anchorSymbol.line !== recommendation.insertionLine) errors.push(`Root ${recommendation.id} is not aligned with its approved anchor symbol.`);
    if (recommendation.marker !== `// @code-root ${recommendation.id} | ${recommendation.title}`) errors.push(`Root ${recommendation.id} marker text does not match its identity and title.`);
    if (ids.has(recommendation.id)) errors.push(`Root id ${recommendation.id} is requested more than once.`);
    if (lines.has(recommendation.insertionLine)) errors.push(`More than one root is requested at line ${recommendation.insertionLine}.`);
    ids.add(recommendation.id);
    lines.add(recommendation.insertionLine);
  }
  return errors;
}

function insertMarkers(source: string, recommendations: CodeRootRecommendation[]): string {
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  for (const recommendation of [...recommendations].sort((left, right) => right.insertionLine - left.insertionLine)) {
    lines.splice(recommendation.insertionLine - 1, 0, recommendation.marker);
  }
  return lines.join(newline);
}

export function previewCodeRootInsertions(
  source: string,
  filePath: string,
  recommendations: CodeRootRecommendation[]
): CodeRootInsertionPreview {
  const path = normalizedPath(filePath);
  const errors = requestErrors(source, path, recommendations);
  const candidateSource = errors.length ? source : insertMarkers(source, recommendations);
  const originalTokenHash = tokenHash(source, path);
  const candidateTokenHash = tokenHash(candidateSource, path);
  const newSyntaxDiagnostics = errors.length ? [] : addedSyntaxDiagnostics(source, candidateSource, path);
  const parsed = parseCodeRootSignatures(candidateSource, path);
  const parsedIds = new Set(parsed.roots.map((root) => root.id));
  const missingIds = recommendations.map((item) => item.id).filter((id) => !parsedIds.has(id));
  const rootErrors = parsed.issues.filter((issue) => issue.severity === "error");

  if (newSyntaxDiagnostics.length) errors.push(`Insertion introduced ${newSyntaxDiagnostics.length} TypeScript syntax diagnostic(s): ${newSyntaxDiagnostics.join("; ")}`);
  if (originalTokenHash !== candidateTokenHash) errors.push("Insertion changed executable TypeScript tokens; only comments and whitespace may change.");
  if (missingIds.length) errors.push(`Inserted roots were not parsed successfully: ${missingIds.join(", ")}.`);
  if (rootErrors.length) errors.push(`Candidate contains ${rootErrors.length} blocking root signature error(s).`);

  return {
    path,
    originalSource: source,
    candidateSource,
    insertedRootIds: recommendations.map((item) => item.id),
    insertedLineCount: recommendations.length,
    originalTokenHash,
    candidateTokenHash,
    validation: {
      passed: errors.length === 0,
      errors,
      checks: [
        { name: "request", passed: !requestErrors(source, path, recommendations).length, details: errors.length ? "Insertion request validation was evaluated." : "Every marker matches one approved root recommendation." },
        { name: "syntax", passed: newSyntaxDiagnostics.length === 0, details: newSyntaxDiagnostics.length ? `${newSyntaxDiagnostics.length} new syntax diagnostic(s).` : "No new TypeScript syntax diagnostics." },
        { name: "token-equivalence", passed: originalTokenHash === candidateTokenHash, details: originalTokenHash === candidateTokenHash ? "Executable token stream is unchanged." : "Executable token stream changed." },
        { name: "root-signatures", passed: !missingIds.length && !rootErrors.length, details: !missingIds.length && !rootErrors.length ? "Every requested root parses with no blocking signature errors." : "One or more requested roots failed signature validation." },
      ],
    },
  };
}
