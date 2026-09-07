import ts from "typescript";

import type {
  GeneratedDeclarationKind,
  IntentionalDeclarationReservation,
} from "./codeCapsule";

export type GeneratedDeclarationUsage = {
  name: string;
  kind: GeneratedDeclarationKind;
  line: number;
  references: Array<{ file: string; line: number; column: number }>;
  reserved: boolean;
  reservation: IntentionalDeclarationReservation | null;
};

export type GeneratedDeclarationUsageReport = {
  evaluatedAt: string;
  passed: boolean;
  declarations: GeneratedDeclarationUsage[];
  diagnostics: string[];
};

type Declaration = {
  name: ts.Identifier;
  node: ts.Node;
  kind: GeneratedDeclarationKind;
};

export function generatedDeclarationKeys(source: string, fileName = "candidate.ts"): string[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const keys = new Set<string>();
  function visit(node: ts.Node): void {
    const found = declaration(node);
    if (found) keys.add(`${found.kind}:${found.name.text}`);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return [...keys].sort();
}

export function newlyIntroducedDeclarationKeys(before: string, after: string, fileName = "candidate.ts"): string[] {
  const beforeKeys = new Set(generatedDeclarationKeys(before, fileName));
  return generatedDeclarationKeys(after, fileName).filter((key) => !beforeKeys.has(key));
}

function declaration(node: ts.Node): Declaration | null {
  if (ts.isClassDeclaration(node) && node.name) return { name: node.name, node, kind: "class" };
  if (ts.isInterfaceDeclaration(node)) return { name: node.name, node, kind: "interface" };
  if (ts.isTypeAliasDeclaration(node)) return { name: node.name, node, kind: "type" };
  if (ts.isEnumDeclaration(node)) return { name: node.name, node, kind: "enum" };
  if (ts.isFunctionDeclaration(node) && node.name) return { name: node.name, node, kind: "function" };
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    const declarationList = node.parent;
    if (ts.isVariableDeclarationList(declarationList) && (declarationList.flags & ts.NodeFlags.Const) !== 0) {
      return { name: node.name, node, kind: "constant" };
    }
  }
  return null;
}

function normalizedSymbol(checker: ts.TypeChecker, node: ts.Identifier): ts.Symbol | undefined {
  const symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return undefined;
  return (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

function isImportOrExportIdentifier(node: ts.Identifier): boolean {
  let current: ts.Node | undefined = node;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) return true;
    current = current.parent;
  }
  return false;
}

function isInside(node: ts.Node, ancestor: ts.Node): boolean {
  return node.pos >= ancestor.pos && node.end <= ancestor.end;
}

export function evaluateGeneratedDeclarationUsage(
  program: ts.Program,
  targetFileName: string,
  insertedStartLine: number,
  insertedEndLine: number,
  reservations: IntentionalDeclarationReservation[] = [],
  evaluatedAt = new Date().toISOString()
): GeneratedDeclarationUsageReport {
  const checker = program.getTypeChecker();
  const targetKey = targetFileName.toLowerCase();
  const target = program.getSourceFile(targetFileName) ?? program.getSourceFiles().find(
    (sourceFile) => sourceFile.fileName.toLowerCase() === targetKey
  );
  if (!target) throw new Error("The virtual target file was not available for declaration-usage validation.");
  const targetSource = target;

  const declarations: Declaration[] = [];
  function collect(node: ts.Node): void {
    const position = targetSource.getLineAndCharacterOfPosition(node.getStart(targetSource));
    const found = declaration(node);
    if (found && position.line + 1 >= insertedStartLine && position.line + 1 <= insertedEndLine) declarations.push(found);
    ts.forEachChild(node, collect);
  }
  collect(targetSource);

  const evidence = declarations.map((item): GeneratedDeclarationUsage => {
    const symbol = normalizedSymbol(checker, item.name);
    const references: GeneratedDeclarationUsage["references"] = [];
    if (symbol) {
      for (const sourceFile of program.getSourceFiles()) {
        if (sourceFile.isDeclarationFile) continue;
        function visit(node: ts.Node): void {
          if (ts.isIdentifier(node) && !isInside(node, item.node) && !isImportOrExportIdentifier(node)) {
            if (normalizedSymbol(checker, node) === symbol) {
              const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
              references.push({ file: sourceFile.fileName, line: position.line + 1, column: position.character + 1 });
            }
          }
          ts.forEachChild(node, visit);
        }
        visit(sourceFile);
      }
    }
    const reservation = reservations.find(
      (candidate) => candidate.declarationName === item.name.text && candidate.declarationKind === item.kind
    ) ?? null;
    const reserved = Boolean(
      reservation && reservation.approvedBy === "developer" && reservation.reason.trim() &&
      Number.isFinite(new Date(reservation.approvedAt).getTime())
    );
    return {
      name: item.name.text,
      kind: item.kind,
      line: targetSource.getLineAndCharacterOfPosition(item.node.getStart(targetSource)).line + 1,
      references,
      reserved,
      reservation: reserved ? reservation : null,
    };
  });

  const diagnostics = evidence
    .filter((item) => item.references.length === 0 && !item.reserved)
    .map((item) =>
      `${targetFileName}:${item.line}:1 UNREALIZED_DECLARATION: Generated ${item.kind} '${item.name}' has no verified usage relationship. It must remain inactive or receive a timestamped, human-approved intentionally reserved designation.`
    );
  return { evaluatedAt, passed: diagnostics.length === 0, declarations: evidence, diagnostics };
}
