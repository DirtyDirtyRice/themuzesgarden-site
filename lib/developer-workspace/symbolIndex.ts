import "server-only";

import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export type ProjectSymbolKind =
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "function"
  | "constant"
  | "method";

export type ProjectSymbol = {
  id: string;
  name: string;
  kind: ProjectSymbolKind;
  path: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  exported: boolean;
  defaultExport: boolean;
  containerName: string | null;
  declarationHash: string;
  shapeHash: string;
};

export type SymbolIndex = {
  root: string;
  generatedAt: string;
  fileCount: number;
  symbolCount: number;
  symbolsByKind: Record<ProjectSymbolKind, number>;
  symbols: ProjectSymbol[];
};

export type SymbolIndexOptions = {
  root?: string;
  tsconfigPath?: string;
};

export type SymbolSearchOptions = {
  kind?: ProjectSymbolKind;
  path?: string;
  limit?: number;
};

export type SymbolSearchResult = {
  symbol: ProjectSymbol;
  score: number;
};

const SYMBOL_KINDS: ProjectSymbolKind[] = [
  "class",
  "interface",
  "type",
  "enum",
  "function",
  "constant",
  "method",
];

const BLOCKED_PATH_SEGMENTS = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "code-map-reports",
  "codex-session-notes",
  "duplicate-reports",
]);

function createKindCounts(): Record<ProjectSymbolKind, number> {
  return {
    class: 0,
    interface: 0,
    type: 0,
    enum: 0,
    function: 0,
    constant: 0,
    method: 0,
  };
}

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return Boolean(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((item) => item.kind === kind));
}

function isExported(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function isDefaultExport(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

function nameText(name: ts.DeclarationName | undefined, sourceFile: ts.SourceFile): string | null {
  if (!name) return null;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name)) return name.expression.getText(sourceFile);
  return name.getText(sourceFile);
}

function positionFor(sourceFile: ts.SourceFile, offset: number): { line: number; column: number } {
  const position = sourceFile.getLineAndCharacterOfPosition(offset);
  return {
    line: position.line + 1,
    column: position.character + 1,
  };
}

function isBlockedFile(root: string, fileName: string): boolean {
  const relative = path.relative(root, fileName);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return true;

  const segments = relative.split(path.sep);
  return segments.some((segment) => BLOCKED_PATH_SEGMENTS.has(segment));
}

function symbolKindForNode(node: ts.Node): ProjectSymbolKind | null {
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isTypeAliasDeclaration(node)) return "type";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isFunctionDeclaration(node)) return "function";
  if (
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    return "method";
  }
  return null;
}

function declarationName(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  if (
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    return nameText(node.name, sourceFile);
  }
  return null;
}

function containerForChildren(node: ts.Node, current: string | null, sourceFile: ts.SourceFile): string | null {
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
    return nameText(node.name, sourceFile) ?? current;
  }
  return current;
}

function hashDeclaration(node: ts.Node, sourceFile: ts.SourceFile, name: string): { declarationHash: string; shapeHash: string } {
  const normalized = node.getText(sourceFile).replace(/\s+/g, " ").trim();
  const shape = normalized.split(name).join("$symbol");
  return {
    declarationHash: createHash("sha256").update(normalized).digest("hex"),
    shapeHash: createHash("sha256").update(shape).digest("hex"),
  };
}

function createSymbol(
  sourceFile: ts.SourceFile,
  relativePath: string,
  node: ts.Node,
  name: string,
  kind: ProjectSymbolKind,
  containerName: string | null,
  exportedOverride?: boolean
): ProjectSymbol {
  const start = positionFor(sourceFile, node.getStart(sourceFile));
  const end = positionFor(sourceFile, node.getEnd());
  const exported = exportedOverride ?? isExported(node);
  const hashes = hashDeclaration(node, sourceFile, name);

  return {
    id: `${relativePath}:${start.line}:${start.column}:${kind}:${name}`,
    name,
    kind,
    path: relativePath,
    line: start.line,
    column: start.column,
    endLine: end.line,
    endColumn: end.column,
    exported,
    defaultExport: isDefaultExport(node),
    containerName,
    ...hashes,
  };
}

function collectFileSymbols(sourceFile: ts.SourceFile, relativePath: string): ProjectSymbol[] {
  const symbols: ProjectSymbol[] = [];

  function visit(node: ts.Node, containerName: string | null): void {
    const kind = symbolKindForNode(node);
    const name = declarationName(node, sourceFile);
    if (kind && name) {
      symbols.push(createSymbol(sourceFile, relativePath, node, name, kind, containerName));
    }

    if (ts.isVariableStatement(node) && isExported(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        symbols.push(
          createSymbol(
            sourceFile,
            relativePath,
            declaration,
            declaration.name.text,
            "constant",
            containerName,
            true
          )
        );
      }
    }

    const childContainer = containerForChildren(node, containerName, sourceFile);
    ts.forEachChild(node, (child) => visit(child, childContainer));
  }

  visit(sourceFile, null);
  return symbols;
}

function readTsconfig(root: string, configuredPath?: string): ts.ParsedCommandLine {
  const tsconfigPath = configuredPath
    ? path.resolve(root, configuredPath)
    : ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");

  if (!tsconfigPath) {
    throw new Error(`No tsconfig.json was found beneath ${root}.`);
  }

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath
  );
  if (parsed.errors.length) {
    throw new Error(
      parsed.errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
        .join("\n")
    );
  }

  return parsed;
}

export async function buildSymbolIndex(options: SymbolIndexOptions = {}): Promise<SymbolIndex> {
  const root = await realpath(path.resolve(options.root ?? process.cwd()));
  const config = readTsconfig(root, options.tsconfigPath);
  const fileNames = config.fileNames
    .filter((fileName) => !fileName.endsWith(".d.ts"))
    .filter((fileName) => !isBlockedFile(root, fileName))
    .sort((left, right) => left.localeCompare(right));
  const symbols: ProjectSymbol[] = [];
  const symbolsByKind = createKindCounts();

  for (const fileName of fileNames) {
    const sourceText = await readFile(fileName, "utf8");
    const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );
    const relativePath = normalizePath(path.relative(root, fileName));
    const fileSymbols = collectFileSymbols(sourceFile, relativePath);

    for (const symbol of fileSymbols) {
      symbols.push(symbol);
      symbolsByKind[symbol.kind] += 1;
    }
  }

  symbols.sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.path.localeCompare(right.path) ||
      left.line - right.line
  );

  return {
    root,
    generatedAt: new Date().toISOString(),
    fileCount: fileNames.length,
    symbolCount: symbols.length,
    symbolsByKind,
    symbols,
  };
}

function symbolScore(symbol: ProjectSymbol, query: string): number {
  const name = symbol.name.toLowerCase();
  const qualifiedName = symbol.containerName
    ? `${symbol.containerName}.${symbol.name}`.toLowerCase()
    : name;

  if (name === query || qualifiedName === query) return 1_000;
  if (name.startsWith(query) || qualifiedName.startsWith(query)) return 750;
  if (name.includes(query) || qualifiedName.includes(query)) return 500;
  if (symbol.path.toLowerCase().includes(query)) return 200;
  return 0;
}

export function searchSymbolIndex(
  index: SymbolIndex,
  query: string,
  options: SymbolSearchOptions = {}
): SymbolSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const limit = options.limit ?? 100;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Symbol search limit must be a positive integer; received ${limit}.`);
  }
  if (options.kind && !SYMBOL_KINDS.includes(options.kind)) {
    throw new Error(`Unsupported symbol kind: ${options.kind}.`);
  }

  const normalizedPath = options.path?.trim().toLowerCase();

  return index.symbols
    .filter((symbol) => !options.kind || symbol.kind === options.kind)
    .filter((symbol) => !normalizedPath || symbol.path.toLowerCase() === normalizedPath)
    .map((symbol) => ({ symbol, score: symbolScore(symbol, normalizedQuery) }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.symbol.name.localeCompare(right.symbol.name, undefined, { sensitivity: "base" }) ||
        left.symbol.path.localeCompare(right.symbol.path) ||
        left.symbol.line - right.symbol.line
    )
    .slice(0, limit);
}
