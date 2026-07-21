import "server-only";

import { realpath } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export type CrossReferenceKind = "definition" | "import" | "export" | "usage";

export type CrossReferenceLocation = {
  kind: CrossReferenceKind;
  path: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  context: string;
};

export type CrossReferenceReport = {
  symbol: {
    name: string;
    path: string;
    line: number;
  };
  definitions: CrossReferenceLocation[];
  imports: CrossReferenceLocation[];
  exports: CrossReferenceLocation[];
  usages: CrossReferenceLocation[];
  dependentFiles: string[];
  referenceCount: number;
};

export type CrossReferenceQuery = {
  path: string;
  name: string;
  line: number;
};

export type CrossReferenceWorkspace = {
  root: string;
  fileCount: number;
  inspect(query: CrossReferenceQuery): CrossReferenceReport;
};

const BLOCKED_PATH_SEGMENTS = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "code-map-reports",
  "codex-session-notes",
  "duplicate-reports",
]);

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}

function isBlockedFile(root: string, fileName: string): boolean {
  const relative = path.relative(root, fileName);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return true;
  return relative.split(path.sep).some((segment) => BLOCKED_PATH_SEGMENTS.has(segment));
}

function readTsconfig(root: string): ts.ParsedCommandLine {
  const tsconfigPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!tsconfigPath) throw new Error(`No tsconfig.json was found beneath ${root}.`);

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

function declarationNameNode(node: ts.Node): ts.DeclarationName | undefined {
  if (
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isVariableDeclaration(node)
  ) {
    return node.name;
  }
  return undefined;
}

function declarationNameText(node: ts.DeclarationName, sourceFile: ts.SourceFile): string {
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return node.getText(sourceFile);
}

function resolveSymbol(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function isSameSymbol(checker: ts.TypeChecker, candidate: ts.Symbol | undefined, target: ts.Symbol): boolean {
  return Boolean(candidate && resolveSymbol(checker, candidate) === target);
}

function hasExportModifier(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) &&
      ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function hasAncestor(node: ts.Node, predicate: (ancestor: ts.Node) => boolean): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (predicate(current)) return true;
    current = current.parent;
  }
  return false;
}

function isDeclarationName(node: ts.Node, target: ts.Symbol): boolean {
  return Boolean(
    target.declarations?.some((declaration) => declarationNameNode(declaration) === node)
  );
}

function exportedDeclarationForName(node: ts.Node): ts.Node | null {
  let current: ts.Node | undefined = node;
  while (current && !ts.isSourceFile(current)) {
    if (hasExportModifier(current)) return current;
    current = current.parent;
  }
  return null;
}

function referenceKind(node: ts.Node, target: ts.Symbol): CrossReferenceKind | null {
  if (isDeclarationName(node, target)) return null;
  if (hasAncestor(node, (ancestor) => ts.isImportDeclaration(ancestor))) return "import";
  if (
    hasAncestor(
      node,
      (ancestor) => ts.isExportDeclaration(ancestor) || ts.isExportAssignment(ancestor)
    )
  ) {
    return "export";
  }
  return "usage";
}

function contextLine(sourceFile: ts.SourceFile, line: number): string {
  return sourceFile.text.split(/\r?\n/)[line - 1]?.trim() ?? "";
}

function locationForNode(
  root: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  kind: CrossReferenceKind
): CrossReferenceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  const line = start.line + 1;

  return {
    kind,
    path: normalizePath(path.relative(root, sourceFile.fileName)),
    line,
    column: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
    context: contextLine(sourceFile, line),
  };
}

function findTargetDeclaration(
  sourceFile: ts.SourceFile,
  query: CrossReferenceQuery
): ts.DeclarationName {
  const candidates: ts.DeclarationName[] = [];

  function visit(node: ts.Node): void {
    const nameNode = declarationNameNode(node);
    if (nameNode && declarationNameText(nameNode, sourceFile) === query.name) {
      const declarationStart = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const nameStart = sourceFile.getLineAndCharacterOfPosition(nameNode.getStart(sourceFile));
      if (declarationStart.line + 1 === query.line || nameStart.line + 1 === query.line) {
        candidates.push(nameNode);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!candidates.length) {
    throw new Error(`No declaration named ${query.name} was found at ${query.path}:${query.line}.`);
  }
  return candidates[0];
}

function uniqueLocations(locations: CrossReferenceLocation[]): CrossReferenceLocation[] {
  const seen = new Set<string>();
  return locations.filter((location) => {
    const key = `${location.kind}:${location.path}:${location.line}:${location.column}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildCrossReferenceWorkspace(rootOption = process.cwd()): Promise<CrossReferenceWorkspace> {
  const root = await realpath(path.resolve(rootOption));
  const config = readTsconfig(root);
  const rootNames = config.fileNames
    .filter((fileName) => !fileName.endsWith(".d.ts"))
    .filter((fileName) => !isBlockedFile(root, fileName));
  const program = ts.createProgram({
    rootNames,
    options: config.options,
    projectReferences: config.projectReferences,
  });
  const checker = program.getTypeChecker();
  const sourceFiles = program
    .getSourceFiles()
    .filter((sourceFile) => !sourceFile.isDeclarationFile)
    .filter((sourceFile) => !isBlockedFile(root, sourceFile.fileName));
  const resultCache = new Map<string, CrossReferenceReport>();

  return {
    root,
    fileCount: sourceFiles.length,
    inspect(query: CrossReferenceQuery): CrossReferenceReport {
      if (!Number.isInteger(query.line) || query.line < 1) {
        throw new Error("Symbol line must be a positive integer.");
      }

      const cacheKey = `${query.path}:${query.line}:${query.name}`;
      const cached = resultCache.get(cacheKey);
      if (cached) return cached;

      const absolutePath = path.resolve(root, query.path);
      const relative = path.relative(root, absolutePath);
      if (relative.startsWith("..") || path.isAbsolute(relative) || isBlockedFile(root, absolutePath)) {
        throw new Error("The symbol path must be inside the indexed project.");
      }

      const sourceFile = program.getSourceFile(absolutePath);
      if (!sourceFile) throw new Error(`The TypeScript program does not contain ${query.path}.`);

      const targetNode = findTargetDeclaration(sourceFile, query);
      const rawTarget = checker.getSymbolAtLocation(targetNode);
      if (!rawTarget) throw new Error(`TypeScript could not resolve ${query.name}.`);
      const target = resolveSymbol(checker, rawTarget);

      const definitions = uniqueLocations(
        (target.declarations ?? []).map((declaration) => {
          const declarationSource = declaration.getSourceFile();
          const nameNode = declarationNameNode(declaration) ?? declaration;
          return locationForNode(root, declarationSource, nameNode, "definition");
        })
      );
      const imports: CrossReferenceLocation[] = [];
      const exports: CrossReferenceLocation[] = (target.declarations ?? [])
        .filter((declaration) => Boolean(exportedDeclarationForName(declaration)))
        .map((declaration) => {
          const declarationSource = declaration.getSourceFile();
          const nameNode = declarationNameNode(declaration) ?? declaration;
          return locationForNode(root, declarationSource, nameNode, "export");
        });
      const usages: CrossReferenceLocation[] = [];

      for (const candidateFile of sourceFiles) {
        function visit(node: ts.Node): void {
          if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) {
            const candidate = checker.getSymbolAtLocation(node);
            if (isSameSymbol(checker, candidate, target)) {
              const kind = referenceKind(node, target);
              if (kind) {
                const location = locationForNode(root, candidateFile, node, kind);
                if (kind === "import") imports.push(location);
                else if (kind === "export") exports.push(location);
                else usages.push(location);
              }
            }
          }
          ts.forEachChild(node, visit);
        }
        visit(candidateFile);
      }

      const uniqueImports = uniqueLocations(imports);
      const uniqueExports = uniqueLocations(exports);
      const uniqueUsages = uniqueLocations(usages);
      const definitionPaths = new Set(definitions.map((location) => location.path));
      const dependentFiles = [...new Set(
        [...uniqueImports, ...uniqueUsages]
          .map((location) => location.path)
          .filter((filePath) => !definitionPaths.has(filePath))
      )].sort();
      const report: CrossReferenceReport = {
        symbol: {
          name: query.name,
          path: query.path,
          line: query.line,
        },
        definitions,
        imports: uniqueImports,
        exports: uniqueExports,
        usages: uniqueUsages,
        dependentFiles,
        referenceCount:
          definitions.length + uniqueImports.length + uniqueExports.length + uniqueUsages.length,
      };

      resultCache.set(cacheKey, report);
      return report;
    },
  };
}
