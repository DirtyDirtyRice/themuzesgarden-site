import "server-only";

import { realpath } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export type CodeRelationshipKind = "import" | "export" | "reference";
export type CodeRelationship = {
  key: string;
  kind: CodeRelationshipKind;
  symbolName: string;
  sourcePath: string;
  sourceLine: number;
  sourceColumn: number;
  targetPath: string;
  targetLine: number;
};
export type RelationshipIndex = { root: string; generatedAt: string; fileCount: number; relationships: CodeRelationship[] };

const BLOCKED = new Set([".git", ".next", ".vercel", "node_modules", "code-map-reports"]);
function normalize(value: string): string { return value.split(path.sep).join("/"); }
function blocked(root: string, file: string): boolean { const relative = path.relative(root, file); return relative.startsWith("..") || path.isAbsolute(relative) || relative.split(path.sep).some((part) => BLOCKED.has(part)); }

function config(root: string): ts.ParsedCommandLine {
  const file = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!file) throw new Error("No tsconfig.json was found for relationship indexing.");
  const read = ts.readConfigFile(file, ts.sys.readFile);
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(file), undefined, file);
  if (parsed.errors.length) throw new Error(parsed.errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("\n"));
  return parsed;
}

function ancestor<T extends ts.Node>(node: ts.Node, predicate: (item: ts.Node) => item is T): T | null {
  let current: ts.Node | undefined = node;
  while (current) { if (predicate(current)) return current; current = current.parent; }
  return null;
}

function relationshipKind(node: ts.Identifier): CodeRelationshipKind | null {
  if (ancestor(node, ts.isImportDeclaration)) return "import";
  if (ancestor(node, ts.isExportDeclaration) || ancestor(node, ts.isExportAssignment)) return "export";
  if (node.parent && "name" in node.parent && (node.parent as { name?: ts.Node }).name === node) {
    let declaration: ts.Node | undefined = node.parent;
    while (declaration && !ts.isSourceFile(declaration)) {
      const exported = ts.canHaveModifiers(declaration) && ts.getModifiers(declaration)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (exported) return "export";
      declaration = declaration.parent;
    }
    return null;
  }
  return "reference";
}

function resolve(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  if (!(symbol.flags & ts.SymbolFlags.Alias)) return symbol;
  try { return checker.getAliasedSymbol(symbol); } catch { return symbol; }
}

export async function buildRelationshipIndex(rootOption = process.cwd()): Promise<RelationshipIndex> {
  const root = await realpath(path.resolve(rootOption));
  const parsed = config(root);
  const program = ts.createProgram({ rootNames: parsed.fileNames.filter((file) => !file.endsWith(".d.ts") && !blocked(root, file)), options: parsed.options, projectReferences: parsed.projectReferences });
  const checker = program.getTypeChecker();
  const sourceFiles = program.getSourceFiles().filter((file) => !file.isDeclarationFile && !blocked(root, file.fileName));
  const raw: Omit<CodeRelationship, "key">[] = [];

  for (const sourceFile of sourceFiles) {
    const sourcePath = normalize(path.relative(root, sourceFile.fileName));
    function visit(node: ts.Node): void {
      if (ts.isIdentifier(node)) {
        const kind = relationshipKind(node);
        const candidate = checker.getSymbolAtLocation(node);
        if (kind && candidate) {
          const symbol = resolve(checker, candidate);
          const declaration = symbol.declarations?.find((item) => !blocked(root, item.getSourceFile().fileName));
          if (declaration) {
            const targetFile = declaration.getSourceFile();
            const sourcePosition = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            const targetPosition = targetFile.getLineAndCharacterOfPosition(declaration.getStart(targetFile));
            raw.push({ kind, symbolName: symbol.getName(), sourcePath, sourceLine: sourcePosition.line + 1, sourceColumn: sourcePosition.character + 1, targetPath: normalize(path.relative(root, targetFile.fileName)), targetLine: targetPosition.line + 1 });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  raw.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath) || a.kind.localeCompare(b.kind) || a.symbolName.localeCompare(b.symbolName) || a.sourceLine - b.sourceLine || a.sourceColumn - b.sourceColumn);
  const counts = new Map<string, number>();
  const relationships = raw.map((item) => {
    const base = [item.sourcePath, item.kind, item.symbolName, item.targetPath].join(":").toLowerCase();
    const occurrence = counts.get(base) ?? 0; counts.set(base, occurrence + 1);
    return { ...item, key: `${base}:${occurrence}` };
  });
  return { root, generatedAt: new Date().toISOString(), fileCount: sourceFiles.length, relationships };
}
