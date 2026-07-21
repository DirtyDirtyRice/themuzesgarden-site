import "server-only";

import { builtinModules } from "node:module";
import path from "node:path";
import ts from "typescript";

export type ImportAcceptanceSeverity = "error" | "warning";
export type ImportAcceptanceCategory =
  | "module-resolution"
  | "export-contract"
  | "import-kind"
  | "client-server-boundary"
  | "dependency-cycle"
  | "project-typecheck";

export type ImportAcceptanceFinding = {
  category: ImportAcceptanceCategory;
  severity: ImportAcceptanceSeverity;
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  moduleSpecifier: string | null;
  importedName: string | null;
  resolvedFile: string | null;
};

export type ImportAcceptanceRequest = {
  file: string;
  candidateSource: string;
  root?: string;
  maxDiagnostics?: number;
};

export type ImportAcceptanceReport = {
  file: string;
  checkedAt: string;
  accepted: boolean;
  importCount: number;
  resolvedImportCount: number;
  findings: ImportAcceptanceFinding[];
  dependencyCycles: string[][];
};

type Project = {
  root: string;
  parsed: ts.ParsedCommandLine;
  program: ts.Program;
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  targetFile: string;
};

const blockedDirectories = new Set([".git", ".next", ".vercel", "node_modules", "code-map-reports"]);
const nodeBuiltins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));

function normalize(value: string): string {
  return value.split(path.sep).join("/");
}

function relative(root: string, file: string): string {
  return normalize(path.relative(root, file));
}

function isBlocked(root: string, file: string): boolean {
  const value = path.relative(root, file);
  return value.startsWith("..") || path.isAbsolute(value) || value.split(path.sep).some((part) => blockedDirectories.has(part));
}

function projectConfig(root: string): ts.ParsedCommandLine {
  const configFile = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
  if (!configFile) throw new Error("No tsconfig.json was found for import acceptance validation.");
  const read = ts.readConfigFile(configFile, ts.sys.readFile);
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(configFile), undefined, configFile);
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")).join("\n"));
  }
  return parsed;
}

function createVirtualProject(request: ImportAcceptanceRequest): Project {
  const root = path.resolve(request.root ?? process.cwd());
  const targetFile = path.resolve(root, request.file);
  if (isBlocked(root, targetFile)) throw new Error("The candidate file must be inside the project and outside excluded directories.");
  const parsed = projectConfig(root);
  const options: ts.CompilerOptions = { ...parsed.options, noEmit: true, incremental: false, composite: false };
  const targetKey = targetFile.toLowerCase();
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (fileName) => path.resolve(fileName).toLowerCase() === targetKey || ts.sys.fileExists(fileName);
  host.readFile = (fileName) => path.resolve(fileName).toLowerCase() === targetKey ? request.candidateSource : ts.sys.readFile(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (path.resolve(fileName).toLowerCase() === targetKey) {
      const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      return ts.createSourceFile(fileName, request.candidateSource, languageVersion, true, kind);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };
  const rootNames = parsed.fileNames.some((file) => path.resolve(file).toLowerCase() === targetKey)
    ? parsed.fileNames
    : [...parsed.fileNames, targetFile];
  const program = ts.createProgram({ rootNames, options, projectReferences: parsed.projectReferences, host });
  const sourceFile = program.getSourceFile(targetFile);
  if (!sourceFile) throw new Error(`TypeScript could not create the candidate source file for ${request.file}.`);
  return { root, parsed, program, checker: program.getTypeChecker(), sourceFile, targetFile };
}

function location(sourceFile: ts.SourceFile, node: ts.Node): { line: number; column: number } {
  const point = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: point.line + 1, column: point.character + 1 };
}

function finding(
  project: Project,
  node: ts.Node,
  values: Omit<ImportAcceptanceFinding, "file" | "line" | "column">
): ImportAcceptanceFinding {
  return { ...values, file: relative(project.root, project.targetFile), ...location(project.sourceFile, node) };
}

function resolveModule(project: Project, specifier: string): string | null {
  const resolved = ts.resolveModuleName(
    specifier,
    project.targetFile,
    project.parsed.options,
    ts.sys
  ).resolvedModule?.resolvedFileName;
  return resolved ? path.resolve(resolved.replace(/\.d\.ts$/, ".ts")) : null;
}

function moduleExports(project: Project, declaration: ts.ImportDeclaration): Map<string, ts.Symbol> {
  const symbol = project.checker.getSymbolAtLocation(declaration.moduleSpecifier);
  if (!symbol) return new Map();
  return new Map(project.checker.getExportsOfModule(symbol).map((item) => [item.getName(), item]));
}

function isTypeOnlySymbol(symbol: ts.Symbol): boolean {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? symbol : symbol;
  const flags = resolved.flags;
  const valueFlags = ts.SymbolFlags.Value | ts.SymbolFlags.ValueModule | ts.SymbolFlags.Method | ts.SymbolFlags.Function | ts.SymbolFlags.Class | ts.SymbolFlags.Enum;
  return (flags & valueFlags) === 0;
}

function importContractFindings(
  project: Project,
  declaration: ts.ImportDeclaration,
  resolvedFile: string | null
): ImportAcceptanceFinding[] {
  const specifier = ts.isStringLiteral(declaration.moduleSpecifier) ? declaration.moduleSpecifier.text : "";
  const resolvedPath = resolvedFile && !isBlocked(project.root, resolvedFile) ? relative(project.root, resolvedFile) : resolvedFile;
  if (!resolvedFile) {
    return [finding(project, declaration.moduleSpecifier, {
      category: "module-resolution",
      severity: "error",
      code: "IMPORT_MODULE_NOT_FOUND",
      message: `The module '${specifier}' does not resolve under this project's TypeScript configuration.`,
      moduleSpecifier: specifier,
      importedName: null,
      resolvedFile: null,
    })];
  }

  const clause = declaration.importClause;
  if (!clause) return [];
  const exports = moduleExports(project, declaration);
  const results: ImportAcceptanceFinding[] = [];
  if (clause.name && !exports.has("default")) {
    results.push(finding(project, clause.name, {
      category: "export-contract", severity: "error", code: "IMPORT_DEFAULT_NOT_EXPORTED",
      message: `'${specifier}' does not provide a default export named '${clause.name.text}'.`,
      moduleSpecifier: specifier, importedName: clause.name.text, resolvedFile: resolvedPath,
    }));
  }
  const bindings = clause.namedBindings;
  if (bindings && ts.isNamedImports(bindings)) {
    for (const element of bindings.elements) {
      const requestedName = element.propertyName?.text ?? element.name.text;
      const exported = exports.get(requestedName);
      if (!exported) {
        results.push(finding(project, element, {
          category: "export-contract", severity: "error", code: "IMPORT_NAMED_NOT_EXPORTED",
          message: `'${requestedName}' is not exported by '${specifier}'.`,
          moduleSpecifier: specifier, importedName: requestedName, resolvedFile: resolvedPath,
        }));
      } else if (!clause.isTypeOnly && !element.isTypeOnly && isTypeOnlySymbol(exported)) {
        results.push(finding(project, element, {
          category: "import-kind", severity: "error", code: "IMPORT_TYPE_AS_VALUE",
          message: `'${requestedName}' is type-only and must be imported with 'import type'.`,
          moduleSpecifier: specifier, importedName: requestedName, resolvedFile: resolvedPath,
        }));
      }
    }
  }
  return results;
}

function hasDirective(sourceFile: ts.SourceFile, directive: string): boolean {
  return sourceFile.statements.some(
    (statement) => ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === directive
  );
}

function boundaryFindings(
  project: Project,
  declaration: ts.ImportDeclaration,
  resolvedFile: string | null
): ImportAcceptanceFinding[] {
  if (!hasDirective(project.sourceFile, "use client")) return [];
  const specifier = ts.isStringLiteral(declaration.moduleSpecifier) ? declaration.moduleSpecifier.text : "";
  const resolvedPath = resolvedFile && !isBlocked(project.root, resolvedFile) ? relative(project.root, resolvedFile) : resolvedFile;
  if (specifier === "server-only" || nodeBuiltins.has(specifier)) {
    return [finding(project, declaration.moduleSpecifier, {
      category: "client-server-boundary", severity: "error", code: "CLIENT_IMPORTS_SERVER_MODULE",
      message: `A client module cannot import server-only dependency '${specifier}'.`,
      moduleSpecifier: specifier, importedName: null, resolvedFile: resolvedPath,
    })];
  }
  if (resolvedFile) {
    const importedSource = project.program.getSourceFile(resolvedFile);
    if (importedSource && hasDirective(importedSource, "use server")) {
      return [finding(project, declaration.moduleSpecifier, {
        category: "client-server-boundary", severity: "error", code: "CLIENT_IMPORTS_USE_SERVER_FILE",
        message: `A client module cannot import the server module '${specifier}'.`,
        moduleSpecifier: specifier, importedName: null, resolvedFile: resolvedPath,
      })];
    }
  }
  return [];
}

function localDependencies(project: Project, sourceFile: ts.SourceFile): string[] {
  const dependencies: string[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const resolved = resolveModule({ ...project, targetFile: sourceFile.fileName }, statement.moduleSpecifier.text);
    if (resolved && !isBlocked(project.root, resolved) && !resolved.endsWith(".d.ts")) dependencies.push(path.resolve(resolved));
  }
  return [...new Set(dependencies)];
}

function cyclesFromTarget(project: Project): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  const active = new Set<string>();
  function visit(file: string): void {
    const key = path.resolve(file).toLowerCase();
    if (active.has(key)) {
      const start = stack.findIndex((item) => item.toLowerCase() === key);
      if (start >= 0) cycles.push([...stack.slice(start), file].map((item) => relative(project.root, item)));
      return;
    }
    if (visited.has(key)) return;
    visited.add(key);
    active.add(key);
    stack.push(file);
    const source = path.resolve(file).toLowerCase() === project.targetFile.toLowerCase()
      ? project.sourceFile
      : project.program.getSourceFile(file);
    if (source) for (const dependency of localDependencies(project, source)) visit(dependency);
    stack.pop();
    active.delete(key);
  }
  visit(project.targetFile);
  const unique = new Map(cycles.map((cycle) => [cycle.join(" -> ").toLowerCase(), cycle]));
  return [...unique.values()];
}

function relevantProjectDiagnostics(project: Project, maxDiagnostics: number): ImportAcceptanceFinding[] {
  return ts.getPreEmitDiagnostics(project.program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error && diagnostic.file?.fileName === project.sourceFile.fileName)
    .slice(0, maxDiagnostics)
    .map((diagnostic) => {
      const point = diagnostic.start === undefined
        ? { line: 0, character: 0 }
        : project.sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
      return {
        category: "project-typecheck" as const,
        severity: "error" as const,
        code: `TS${diagnostic.code}`,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        file: relative(project.root, project.targetFile),
        line: point.line + 1,
        column: point.character + 1,
        moduleSpecifier: null,
        importedName: null,
        resolvedFile: null,
      };
    });
}

function deduplicate(findings: ImportAcceptanceFinding[]): ImportAcceptanceFinding[] {
  const unique = new Map<string, ImportAcceptanceFinding>();
  for (const item of findings) {
    const key = [item.code, item.file, item.line, item.column, item.moduleSpecifier, item.importedName].join(":");
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()].sort((left, right) => left.line - right.line || left.column - right.column || left.code.localeCompare(right.code));
}

export function evaluateImportAcceptance(request: ImportAcceptanceRequest): ImportAcceptanceReport {
  const project = createVirtualProject(request);
  const declarations = project.sourceFile.statements.filter(ts.isImportDeclaration);
  const findings: ImportAcceptanceFinding[] = [];
  let resolvedImportCount = 0;
  for (const declaration of declarations) {
    if (!ts.isStringLiteral(declaration.moduleSpecifier)) continue;
    const resolvedFile = resolveModule(project, declaration.moduleSpecifier.text);
    if (resolvedFile) resolvedImportCount += 1;
    findings.push(...importContractFindings(project, declaration, resolvedFile));
    findings.push(...boundaryFindings(project, declaration, resolvedFile));
  }
  const dependencyCycles = cyclesFromTarget(project);
  for (const cycle of dependencyCycles) {
    findings.push(finding(project, project.sourceFile, {
      category: "dependency-cycle", severity: "error", code: "IMPORT_DEPENDENCY_CYCLE",
      message: `This candidate creates or participates in a dependency cycle: ${cycle.join(" -> ")}.`,
      moduleSpecifier: null, importedName: null, resolvedFile: null,
    }));
  }
  findings.push(...relevantProjectDiagnostics(project, Math.min(500, Math.max(1, request.maxDiagnostics ?? 200))));
  const uniqueFindings = deduplicate(findings);
  return {
    file: relative(project.root, project.targetFile),
    checkedAt: new Date().toISOString(),
    accepted: !uniqueFindings.some((item) => item.severity === "error"),
    importCount: declarations.length,
    resolvedImportCount,
    findings: uniqueFindings,
    dependencyCycles,
  };
}
