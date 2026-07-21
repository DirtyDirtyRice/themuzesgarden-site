import { createHash } from "node:crypto";

import {
  CODE_ROOT_ID_PATTERN,
  formatCodeRootMarker,
  parseCodeRootSignatures,
} from "./codeRootSignature";
import type { ProjectSymbol } from "./symbolIndex";

export type CodeRootRecommendation = {
  id: string;
  title: string;
  path: string;
  insertionLine: number;
  estimatedEndLine: number;
  estimatedLineCount: number;
  marker: string;
  anchorSymbol: {
    id: string;
    name: string;
    kind: ProjectSymbol["kind"] | "section";
    line: number;
    endLine: number;
  };
  symbolNames: string[];
  confidence: "high" | "medium";
  reasons: string[];
};

export type CodeRootRecommendationResult = {
  path: string;
  lineCount: number;
  existingRootCount: number;
  eligibleSymbolCount: number;
  safeBoundaryCount: number;
  recommendations: CodeRootRecommendation[];
  notices: string[];
};

export type CodeRootRecommendationOptions = {
  targetLines?: number;
  minimumLines?: number;
  maximumLines?: number;
  includeFilesWithRoots?: boolean;
};

type Boundary = {
  symbol: RecommendationAnchor;
  line: number;
};

type RecommendationAnchor = {
  id: string;
  name: string;
  kind: ProjectSymbol["kind"] | "section";
  line: number;
  endLine: number;
  source: "symbol" | "section";
};

function normalizedPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function sourceLineCount(source: string): number {
  return source.split(/\r?\n/).length;
}

function optionsWithDefaults(options: CodeRootRecommendationOptions): Required<CodeRootRecommendationOptions> {
  const values = {
    targetLines: options.targetLines ?? 300,
    minimumLines: options.minimumLines ?? 160,
    maximumLines: options.maximumLines ?? 500,
    includeFilesWithRoots: options.includeFilesWithRoots ?? false,
  };
  if (!Number.isInteger(values.minimumLines) || values.minimumLines < 50) throw new Error("Minimum root size must be an integer of at least 50 lines.");
  if (!Number.isInteger(values.targetLines) || values.targetLines < values.minimumLines) throw new Error("Target root size must be an integer at least as large as the minimum.");
  if (!Number.isInteger(values.maximumLines) || values.maximumLines < values.targetLines) throw new Error("Maximum root size must be an integer at least as large as the target.");
  return values;
}

function eligibleSymbols(symbols: ProjectSymbol[], path: string): ProjectSymbol[] {
  return symbols
    .filter((symbol) => symbol.path === path)
    .filter((symbol) => symbol.containerName === null)
    .sort((left, right) => left.line - right.line || left.column - right.column)
    .filter((symbol, index, values) => !index || symbol.line !== values[index - 1].line);
}

function sectionAnchors(source: string, path: string): RecommendationAnchor[] {
  const lines = source.split(/\r?\n/);
  const anchors: RecommendationAnchor[] = [];
  for (let index = 0; index < lines.length - 2; index += 1) {
    if (!/^\s*\/\/\s*=+\s*$/.test(lines[index])) continue;
    const title = lines[index + 1].match(/^\s*\/\/\s+(.+?)\s*$/)?.[1]?.trim();
    if (!title || !/^\s*\/\/\s*=+\s*$/.test(lines[index + 2])) continue;
    anchors.push({ id: `section:${path}:${index + 1}`, name: title, kind: "section", line: index + 1, endLine: index + 3, source: "section" });
  }
  return anchors;
}

function safeAnchors(source: string, path: string, symbols: ProjectSymbol[]): RecommendationAnchor[] {
  const values: RecommendationAnchor[] = [
    ...sectionAnchors(source, path),
    ...symbols.map((symbol) => ({ id: symbol.id, name: symbol.name, kind: symbol.kind, line: symbol.line, endLine: symbol.endLine, source: "symbol" as const })),
  ].sort((left, right) => left.line - right.line || Number(right.source === "section") - Number(left.source === "section"));
  return values.filter((anchor, index) => !index || anchor.line !== values[index - 1].line);
}
function closestBoundary(
  symbols: RecommendationAnchor[],
  sectionStart: number,
  target: number,
  minimum: number,
  maximum: number
): RecommendationAnchor | null {
  const candidates = symbols.filter((symbol) => {
    const distance = symbol.line - sectionStart;
    return distance >= minimum && distance <= maximum;
  });
  return candidates
    .map((symbol) => ({ symbol, distance: Math.abs((symbol.line - sectionStart) - target) }))
    .sort((left, right) => left.distance - right.distance || left.symbol.line - right.symbol.line)[0]?.symbol ?? null;
}

function selectBoundaries(
  symbols: RecommendationAnchor[],
  lineCount: number,
  minimum: number,
  target: number,
  maximum: number
): Boundary[] {
  if (!symbols.length) return [];
  const boundaries: Boundary[] = [{ symbol: symbols[0], line: symbols[0].line }];
  let sectionStart = symbols[0].line;
  while (lineCount - sectionStart > maximum) {
    const next = closestBoundary(symbols, sectionStart, target, minimum, maximum);
    if (!next || next.line <= sectionStart) break;
    boundaries.push({ symbol: next, line: next.line });
    sectionStart = next.line;
  }
  return boundaries;
}

function words(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fileSubject(filePath: string): string {
  const name = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Code";
  return words(name);
}

function sectionTitle(filePath: string, anchor: RecommendationAnchor, index: number): string {
  if (anchor.kind === "section") return words(anchor.name);
  const subject = fileSubject(filePath);
  const anchorName = words(anchor.name);
  if (anchor.kind === "interface" || anchor.kind === "type" || anchor.kind === "enum") return `${subject} Types: ${anchorName}`;
  if (anchor.kind === "class") return `${subject} Class: ${anchorName}`;
  if (anchor.kind === "function" || anchor.kind === "method") return `${subject} Runtime: ${anchorName}`;
  return `${subject} Section ${index + 1}: ${anchorName}`;
}

function idPart(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function rootNamespace(filePath: string): string {
  const withoutExtension = filePath.replace(/\.[^.]+$/, "");
  const parts = withoutExtension.split("/").filter(Boolean).filter((part) => !["src", "lib", "app", "components"].includes(part.toLowerCase()));
  return parts.map(idPart).filter(Boolean).join(".") || "code";
}

function recommendationId(filePath: string, anchor: RecommendationAnchor, occupied: Set<string>): string {
  const namespace = rootNamespace(filePath);
  const anchorPart = idPart(anchor.name);
  let candidate = `${namespace}.${anchorPart}`;
  if (!CODE_ROOT_ID_PATTERN.test(candidate)) candidate = `code.${anchorPart}`;
  if (!occupied.has(candidate)) {
    occupied.add(candidate);
    return candidate;
  }
  const suffix = createHash("sha256").update(`${filePath}:${anchor.line}:${anchor.name}`).digest("hex").slice(0, 8);
  candidate = `${candidate}.${suffix}`;
  occupied.add(candidate);
  return candidate;
}

function symbolsWithin(symbols: ProjectSymbol[], startLine: number, endLine: number): string[] {
  return [...new Set(symbols.filter((symbol) => symbol.line >= startLine && symbol.line <= endLine).map((symbol) => symbol.name))];
}

export function recommendCodeRoots(
  source: string,
  filePath: string,
  projectSymbols: ProjectSymbol[],
  options: CodeRootRecommendationOptions = {}
): CodeRootRecommendationResult {
  const path = normalizedPath(filePath);
  const settings = optionsWithDefaults(options);
  const lineCount = sourceLineCount(source);
  const parsed = parseCodeRootSignatures(source, path);
  const symbols = eligibleSymbols(projectSymbols, path);
  const anchors = safeAnchors(source, path, symbols);
  const notices: string[] = [];

  if (parsed.issues.some((issue) => issue.severity === "error")) {
    return {
      path,
      lineCount,
      existingRootCount: parsed.roots.length,
      eligibleSymbolCount: symbols.length,
      safeBoundaryCount: anchors.length,
      recommendations: [],
      notices: ["Existing root signature errors must be corrected before new roots can be recommended."],
    };
  }
  if (parsed.roots.length && !settings.includeFilesWithRoots) {
    return {
      path,
      lineCount,
      existingRootCount: parsed.roots.length,
      eligibleSymbolCount: symbols.length,
      safeBoundaryCount: anchors.length,
      recommendations: [],
      notices: ["This file already has roots. Gap-filling recommendations require explicit opt-in."],
    };
  }
  if (!anchors.length) {
    notices.push("No top-level declarations or human-authored section headings provide a safe chapter boundary.");
  }
  if (lineCount < settings.minimumLines) {
    notices.push(`This file is smaller than the ${settings.minimumLines}-line recommendation threshold.`);
  }
  if (!anchors.length || lineCount < settings.minimumLines) {
    return { path, lineCount, existingRootCount: parsed.roots.length, eligibleSymbolCount: symbols.length, safeBoundaryCount: anchors.length, recommendations: [], notices };
  }

  const occupied = new Set(parsed.roots.map((root) => root.id));
  const boundaries = selectBoundaries(anchors, lineCount, settings.minimumLines, settings.targetLines, settings.maximumLines);
  const recommendations = boundaries.map((boundary, index) => {
    const following = boundaries[index + 1];
    const endLine = following ? following.line - 1 : lineCount;
    const title = sectionTitle(path, boundary.symbol, index);
    const id = recommendationId(path, boundary.symbol, occupied);
    const estimatedLineCount = Math.max(1, endLine - boundary.line + 1);
    const reasons = [
      boundary.symbol.source === "section"
        ? `Starts at human-authored section heading "${boundary.symbol.name}".`
        : `Starts at top-level ${boundary.symbol.kind} ${boundary.symbol.name}.`,
      `Estimated chapter size is ${estimatedLineCount} lines.`,
      "Insertion occurs before a complete declaration, not inside executable code.",
    ];
    return {
      id,
      title,
      path,
      insertionLine: boundary.line,
      estimatedEndLine: endLine,
      estimatedLineCount,
      marker: formatCodeRootMarker(id, title),
      anchorSymbol: {
        id: boundary.symbol.id,
        name: boundary.symbol.name,
        kind: boundary.symbol.kind,
        line: boundary.symbol.line,
        endLine: boundary.symbol.endLine,
      },
      symbolNames: symbolsWithin(symbols, boundary.line, endLine),
      confidence: estimatedLineCount <= settings.maximumLines ? "high" as const : "medium" as const,
      reasons,
    };
  });

  return {
    path,
    lineCount,
    existingRootCount: parsed.roots.length,
    eligibleSymbolCount: symbols.length,
    safeBoundaryCount: anchors.length,
    recommendations,
    notices,
  };
}
