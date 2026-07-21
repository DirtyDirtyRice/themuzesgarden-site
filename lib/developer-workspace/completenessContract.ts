import "server-only";

import ts from "typescript";

export type CompletenessClauseKind =
  | "declaration"
  | "export"
  | "import"
  | "member"
  | "reference"
  | "invocation"
  | "extends"
  | "implements"
  | "companion";

export type CompletenessDeclarationKind =
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "function"
  | "constant"
  | "method"
  | "property";

export type CompletenessClause = {
  id: string;
  kind: CompletenessClauseKind;
  description: string;
  subject: string;
  value?: string;
  moduleSpecifier?: string;
  declarationKinds?: CompletenessDeclarationKind[];
  minimum?: number;
};

export type CompletenessContract = {
  id: string;
  title: string;
  description: string;
  clauses: CompletenessClause[];
  requireDeclaration: boolean;
  requireExportedEntryPoint: boolean;
  rejectUnusedImports: boolean;
};

export type CompletenessEvidence = {
  clauseId: string;
  satisfied: boolean;
  summary: string;
  observed: string[];
  line: number | null;
  column: number | null;
};

export type CompletenessFinding = {
  code: string;
  message: string;
  clauseId: string | null;
  line: number | null;
  column: number | null;
};

export type CompletenessReport = {
  contractId: string;
  evaluatedAt: string;
  complete: boolean;
  score: number;
  satisfiedClauses: number;
  totalClauses: number;
  evidence: CompletenessEvidence[];
  findings: CompletenessFinding[];
};

type SourceLocation = { line: number; column: number };
type NamedFact = SourceLocation & { name: string };
type DeclarationFact = NamedFact & {
  kind: CompletenessDeclarationKind;
  container: string | null;
  exported: boolean;
};
type ImportFact = NamedFact & { importedName: string; moduleSpecifier: string; typeOnly: boolean };
type HeritageFact = NamedFact & { relation: "extends" | "implements"; target: string };
type SourceFacts = {
  declarations: DeclarationFact[];
  exports: NamedFact[];
  imports: ImportFact[];
  references: NamedFact[];
  invocations: NamedFact[];
  heritage: HeritageFact[];
  unusedImports: ImportFact[];
};

function clean(value: string): string {
  return value.trim();
}

function validateContract(contract: CompletenessContract): void {
  if (!clean(contract.id)) throw new Error("Completeness contract id is required.");
  if (!clean(contract.title)) throw new Error("Completeness contract title is required.");
  const ids = new Set<string>();
  for (const clause of contract.clauses) {
    if (!clean(clause.id)) throw new Error("Every completeness clause needs an id.");
    if (ids.has(clause.id)) throw new Error(`Completeness clause id '${clause.id}' is duplicated.`);
    ids.add(clause.id);
    if (!clean(clause.subject)) throw new Error(`Completeness clause '${clause.id}' needs a subject.`);
    if ((clause.minimum ?? 1) < 1 || !Number.isInteger(clause.minimum ?? 1)) {
      throw new Error(`Completeness clause '${clause.id}' minimum must be a positive integer.`);
    }
    if (clause.kind === "import" && !clean(clause.moduleSpecifier ?? "")) {
      throw new Error(`Import clause '${clause.id}' needs a moduleSpecifier.`);
    }
    if (["member", "extends", "implements", "companion"].includes(clause.kind) && !clean(clause.value ?? "")) {
      throw new Error(`Completeness clause '${clause.id}' needs a value.`);
    }
  }
}

function location(sourceFile: ts.SourceFile, node: ts.Node): SourceLocation {
  const point = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: point.line + 1, column: point.character + 1 };
}

function named(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  if (ts.isComputedPropertyName(node)) return node.expression.getText(sourceFile);
  return null;
}

function hasExportModifier(node: ts.Node): boolean {
  return Boolean(
    ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function declarationKind(node: ts.Node): CompletenessDeclarationKind | null {
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isTypeAliasDeclaration(node)) return "type";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isFunctionDeclaration(node)) return "function";
  if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) return "method";
  if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) return "property";
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) return "constant";
  return null;
}

function declarationName(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  if (
    ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)
  ) {
    return node.name ? named(node.name, sourceFile) : null;
  }
  if (ts.isVariableDeclaration(node)) return named(node.name, sourceFile);
  return null;
}

function declarationContainer(node: ts.Node, sourceFile: ts.SourceFile): string | null {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isClassDeclaration(current) || ts.isInterfaceDeclaration(current) || ts.isEnumDeclaration(current)) {
      return current.name?.text ?? null;
    }
    current = current.parent;
  }
  return null;
}

function declarationExported(node: ts.Node): boolean {
  if (hasExportModifier(node)) return true;
  if (ts.isVariableDeclaration(node)) {
    const statement = node.parent?.parent;
    return Boolean(statement && ts.isVariableStatement(statement) && hasExportModifier(statement));
  }
  return false;
}

function isDeclarationIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent;
  return Boolean(parent && "name" in parent && (parent as { name?: ts.Node }).name === node);
}

function isImportIdentifier(node: ts.Identifier): boolean {
  let current: ts.Node | undefined = node;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isImportDeclaration(current)) return true;
    current = current.parent;
  }
  return false;
}

function sourceFacts(source: string, fileName: string): SourceFacts {
  const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const declarations: DeclarationFact[] = [];
  const exports: NamedFact[] = [];
  const imports: ImportFact[] = [];
  const references: NamedFact[] = [];
  const invocations: NamedFact[] = [];
  const heritage: HeritageFact[] = [];

  function visit(node: ts.Node): void {
    const kind = declarationKind(node);
    const name = kind ? declarationName(node, sourceFile) : null;
    if (kind && name) {
      const fact = {
        name,
        kind,
        container: declarationContainer(node, sourceFile),
        exported: declarationExported(node),
        ...location(sourceFile, node),
      };
      declarations.push(fact);
      if (fact.exported) exports.push({ name, line: fact.line, column: fact.column });
    }

    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        exports.push({ name: element.name.text, ...location(sourceFile, element) });
      }
    }

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const clause = node.importClause;
      if (clause?.name) {
        imports.push({ name: clause.name.text, importedName: "default", moduleSpecifier, typeOnly: clause.isTypeOnly, ...location(sourceFile, clause.name) });
      }
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) {
        imports.push({ name: bindings.name.text, importedName: "*", moduleSpecifier, typeOnly: clause?.isTypeOnly ?? false, ...location(sourceFile, bindings.name) });
      } else if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          imports.push({
            name: element.name.text,
            importedName: element.propertyName?.text ?? element.name.text,
            moduleSpecifier,
            typeOnly: Boolean(clause?.isTypeOnly || element.isTypeOnly),
            ...location(sourceFile, element),
          });
        }
      }
    }

    if (ts.isIdentifier(node) && !isDeclarationIdentifier(node) && !isImportIdentifier(node)) {
      references.push({ name: node.text, ...location(sourceFile, node) });
    }

    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const expression = node.expression;
      const invocationName = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression)
          ? expression.name.text
          : expression.getText(sourceFile);
      invocations.push({ name: invocationName, ...location(sourceFile, expression) });
    }

    if ((ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.name) {
      for (const clause of node.heritageClauses ?? []) {
        const relation = clause.token === ts.SyntaxKind.ExtendsKeyword ? "extends" : "implements";
        for (const type of clause.types) {
          heritage.push({ name: node.name.text, relation, target: type.expression.getText(sourceFile), ...location(sourceFile, type) });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  const referenceCounts = new Map<string, number>();
  for (const reference of references) referenceCounts.set(reference.name, (referenceCounts.get(reference.name) ?? 0) + 1);
  const unusedImports = imports.filter((item) => !referenceCounts.has(item.name));
  return { declarations, exports, imports, references, invocations, heritage, unusedImports };
}

function evidence(
  clause: CompletenessClause,
  matches: NamedFact[],
  observed: string[],
  minimum = clause.minimum ?? 1
): CompletenessEvidence {
  const first = matches[0];
  return {
    clauseId: clause.id,
    satisfied: matches.length >= minimum,
    summary: matches.length >= minimum
      ? `${clause.description || clause.id} (${matches.length} observed).`
      : `${clause.description || clause.id} is missing; ${minimum} required and ${matches.length} observed.`,
    observed,
    line: first?.line ?? null,
    column: first?.column ?? null,
  };
}

function evaluateClause(clause: CompletenessClause, facts: SourceFacts): CompletenessEvidence {
  const minimum = clause.minimum ?? 1;
  if (clause.kind === "declaration") {
    const matches = facts.declarations.filter((item) =>
      item.name === clause.subject && (!clause.declarationKinds?.length || clause.declarationKinds.includes(item.kind))
    );
    return evidence(clause, matches, matches.map((item) => `${item.kind} ${item.name}`), minimum);
  }
  if (clause.kind === "export") {
    const matches = facts.exports.filter((item) => item.name === clause.subject);
    return evidence(clause, matches, matches.map((item) => `export ${item.name}`), minimum);
  }
  if (clause.kind === "import") {
    const matches = facts.imports.filter((item) =>
      item.moduleSpecifier === clause.moduleSpecifier &&
      (item.importedName === clause.subject || item.name === clause.subject)
    );
    return evidence(clause, matches, matches.map((item) => `${item.importedName} from ${item.moduleSpecifier}`), minimum);
  }
  if (clause.kind === "member") {
    const matches = facts.declarations.filter((item) => item.container === clause.subject && item.name === clause.value);
    return evidence(clause, matches, matches.map((item) => `${item.container}.${item.name}`), minimum);
  }
  if (clause.kind === "reference") {
    const matches = facts.references.filter((item) => item.name === clause.subject);
    return evidence(clause, matches, matches.map((item) => `reference ${item.name}`), minimum);
  }
  if (clause.kind === "invocation") {
    const matches = facts.invocations.filter((item) => item.name === clause.subject);
    return evidence(clause, matches, matches.map((item) => `call ${item.name}`), minimum);
  }
  if (clause.kind === "extends" || clause.kind === "implements") {
    const matches = facts.heritage.filter((item) =>
      item.name === clause.subject && item.relation === clause.kind && item.target === clause.value
    );
    return evidence(clause, matches, matches.map((item) => `${item.name} ${item.relation} ${item.target}`), minimum);
  }
  const subjectMatches = facts.declarations.filter((item) => item.name === clause.subject);
  const companionMatches = facts.declarations.filter((item) => item.name === clause.value);
  const both = subjectMatches.length && companionMatches.length ? [subjectMatches[0], companionMatches[0]] : [];
  return evidence(
    clause,
    both,
    [...subjectMatches.map((item) => item.name), ...companionMatches.map((item) => item.name)],
    2
  );
}

export function evaluateCompletenessContract(
  contract: CompletenessContract,
  candidateSource: string,
  fileName = "candidate.ts"
): CompletenessReport {
  validateContract(contract);
  const facts = sourceFacts(candidateSource, fileName);
  const evidenceItems = contract.clauses.map((clause) => evaluateClause(clause, facts));
  const findings: CompletenessFinding[] = evidenceItems
    .filter((item) => !item.satisfied)
    .map((item) => ({
      code: "COMPLETENESS_CLAUSE_UNSATISFIED",
      message: item.summary,
      clauseId: item.clauseId,
      line: item.line,
      column: item.column,
    }));

  if (contract.requireDeclaration && facts.declarations.length === 0) {
    findings.push({ code: "COMPLETENESS_NO_DECLARATION", message: "Candidate code does not declare a symbol.", clauseId: null, line: null, column: null });
  }
  if (contract.requireExportedEntryPoint && facts.exports.length === 0) {
    findings.push({ code: "COMPLETENESS_NO_EXPORTED_ENTRY", message: "Candidate code has no exported entry point.", clauseId: null, line: null, column: null });
  }
  if (contract.rejectUnusedImports) {
    for (const item of facts.unusedImports) {
      findings.push({
        code: "COMPLETENESS_UNUSED_IMPORT",
        message: `Imported '${item.name}' from '${item.moduleSpecifier}' is not used by the candidate.`,
        clauseId: null,
        line: item.line,
        column: item.column,
      });
    }
  }

  const satisfiedClauses = evidenceItems.filter((item) => item.satisfied).length;
  const policyChecks = Number(contract.requireDeclaration) + Number(contract.requireExportedEntryPoint) + Number(contract.rejectUnusedImports);
  const passedPolicies =
    (contract.requireDeclaration ? Number(facts.declarations.length > 0) : 0) +
    (contract.requireExportedEntryPoint ? Number(facts.exports.length > 0) : 0) +
    (contract.rejectUnusedImports ? Number(facts.unusedImports.length === 0) : 0);
  const denominator = contract.clauses.length + policyChecks;
  const numerator = satisfiedClauses + passedPolicies;
  return {
    contractId: contract.id,
    evaluatedAt: new Date().toISOString(),
    complete: findings.length === 0,
    score: denominator === 0 ? 100 : Math.round((numerator / denominator) * 100),
    satisfiedClauses,
    totalClauses: contract.clauses.length,
    evidence: evidenceItems,
    findings,
  };
}
