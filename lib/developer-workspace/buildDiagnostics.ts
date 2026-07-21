import "server-only";

import { spawn } from "node:child_process";
import { realpath } from "node:fs/promises";
import path from "node:path";

export type BuildCheckKind = "typecheck" | "build";
export type BuildCheckStatus = "passed" | "failed" | "timed-out";

export type BuildDiagnostic = {
  id: string;
  file: string | null;
  line: number | null;
  column: number | null;
  code: string | null;
  severity: "error" | "warning";
  message: string;
  primary: boolean;
  cascadeOf: string | null;
};

export type BuildCheckResult = {
  kind: BuildCheckKind;
  status: BuildCheckStatus;
  command: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  exitCode: number | null;
  signal: string | null;
  diagnostics: BuildDiagnostic[];
  diagnosticCount: number;
  primaryDiagnosticCount: number;
  output: string;
  outputTruncated: boolean;
};

type CommandRun = {
  exitCode: number | null;
  signal: string | null;
  output: string;
  outputTruncated: boolean;
  timedOut: boolean;
};

const MAX_OUTPUT_CHARACTERS = 2_000_000;
const TYPECHECK_TIMEOUT_MS = 2 * 60 * 1_000;
const BUILD_TIMEOUT_MS = 8 * 60 * 1_000;

const SYNTAX_ERROR_CODES = new Set([
  "TS1002",
  "TS1003",
  "TS1005",
  "TS1109",
  "TS1127",
  "TS1128",
  "TS1136",
  "TS1160",
  "TS1351",
  "TS1434",
  "TS1435",
]);

function executable(name: "npm" | "npx"): string {
  return process.platform === "win32" ? `${name}.cmd` : name;
}
function npmBuildInvocation(): { command: string; args: string[] } {
  const npmCli = process.env.npm_execpath;
  if (npmCli) {
    return {
      command: process.execPath,
      args: [npmCli, "run", "build"],
    };
  }

  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd run build"],
    };
  }

  return { command: executable("npm"), args: ["run", "build"] };
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
}

function normalizeDiagnosticPath(root: string, value: string): string | null {
  const clean = value.trim().replace(/^\.\//, "");
  const absolute = path.isAbsolute(clean) ? path.resolve(clean) : path.resolve(root, clean);
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative.split(path.sep).join("/");
}

function runCommand(
  command: string,
  args: string[],
  root: string,
  timeoutMs: number,
  environmentOverrides: Partial<NodeJS.ProcessEnv> = {}
): Promise<CommandRun> {
  const childEnvironment = { ...process.env };
  for (const key of Object.keys(childEnvironment)) {
    if (
      key === "NODE_OPTIONS" ||
      key === "NODE_CHANNEL_FD" ||
      key === "NEXT_RUNTIME" ||
      key === "TURBOPACK" ||
      key.startsWith("__NEXT_PRIVATE")
    ) {
      delete childEnvironment[key];
    }
  }
  childEnvironment.FORCE_COLOR = "0";
  childEnvironment.NO_COLOR = "1";
  Object.assign(childEnvironment, environmentOverrides);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: childEnvironment,
      shell: false,
      windowsHide: true,
    });

    let output = "";
    let outputTruncated = false;
    let timedOut = false;

    function append(chunk: Buffer | string): void {
      if (output.length >= MAX_OUTPUT_CHARACTERS) {
        outputTruncated = true;
        return;
      }

      const remaining = MAX_OUTPUT_CHARACTERS - output.length;
      const text = chunk.toString();
      output += text.slice(0, remaining);
      if (text.length > remaining) outputTruncated = true;
    }

    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", reject);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode,
        signal,
        output: stripAnsi(output),
        outputTruncated,
        timedOut,
      });
    });
  });
}

function createDiagnostic(
  index: number,
  file: string | null,
  line: number | null,
  column: number | null,
  code: string | null,
  severity: "error" | "warning",
  message: string
): BuildDiagnostic {
  return {
    id: `${index + 1}:${file ?? "build"}:${line ?? 0}:${column ?? 0}:${code ?? severity}`,
    file,
    line,
    column,
    code,
    severity,
    message: message.trim(),
    primary: true,
    cascadeOf: null,
  };
}

function parseDiagnostics(root: string, rawOutput: string): BuildDiagnostic[] {
  const lines = rawOutput.split(/\r?\n/);
  const diagnostics: BuildDiagnostic[] = [];
  let pendingLocation: { file: string | null; line: number; column: number } | null = null;
  let pendingPrerenderRoute: string | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const lineText = lines[index];
    const tscMatch = lineText.match(
      /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s*(.+)$/
    );
    if (tscMatch) {
      diagnostics.push(
        createDiagnostic(
          diagnostics.length,
          normalizeDiagnosticPath(root, tscMatch[1]),
          Number(tscMatch[2]),
          Number(tscMatch[3]),
          tscMatch[5],
          tscMatch[4] as "error" | "warning",
          tscMatch[6]
        )
      );
      pendingLocation = null;
      continue;
    }

    const nextLocationMatch = lineText.match(/^\.?\/?(.+?):(\d+):(\d+)$/);
    if (nextLocationMatch) {
      pendingLocation = {
        file: normalizeDiagnosticPath(root, nextLocationMatch[1]),
        line: Number(nextLocationMatch[2]),
        column: Number(nextLocationMatch[3]),
      };
      continue;
    }

    const nextTypeError = lineText.match(/^\s*(Type error|Syntax error):\s*(.+)$/i);
    if (nextTypeError) {
      diagnostics.push(
        createDiagnostic(
          diagnostics.length,
          pendingLocation?.file ?? null,
          pendingLocation?.line ?? null,
          pendingLocation?.column ?? null,
          null,
          "error",
          nextTypeError[2]
        )
      );
      pendingLocation = null;
      continue;
    }

    const genericError = lineText.match(/^\s*(Error|Warning):\s*(.+)$/i);
    if (genericError && !/^(ELIFECYCLE|Command failed)/i.test(genericError[2])) {
      diagnostics.push(
        createDiagnostic(
          diagnostics.length,
          pendingLocation?.file ?? null,
          pendingLocation?.line ?? null,
          pendingLocation?.column ?? null,
          null,
          genericError[1].toLowerCase() === "warning" ? "warning" : "error",
          genericError[2]
        )
      );
      pendingLocation = null;
    }

    const prerenderMatch = lineText.match(/^Error occurred prerendering page "([^"]+)"/);
    if (prerenderMatch) {
      pendingPrerenderRoute = prerenderMatch[1];
      continue;
    }

    const runtimeError = lineText.match(
      /^\s*(TypeError|ReferenceError|RangeError|SyntaxError):\s*(.+)$/
    );
    if (runtimeError) {
      diagnostics.push(
        createDiagnostic(
          diagnostics.length,
          null,
          null,
          null,
          runtimeError[1],
          "error",
          `${pendingPrerenderRoute ? `${pendingPrerenderRoute}: ` : ""}${runtimeError[2]}`
        )
      );
      pendingPrerenderRoute = null;
    }
  }

  return markCascadingDiagnostics(diagnostics);
}

function markCascadingDiagnostics(diagnostics: BuildDiagnostic[]): BuildDiagnostic[] {
  const firstSyntaxErrorByFile = new Map<string, BuildDiagnostic>();

  for (const diagnostic of diagnostics) {
    if (!diagnostic.file || diagnostic.severity !== "error") continue;

    const firstSyntaxError = firstSyntaxErrorByFile.get(diagnostic.file);
    if (firstSyntaxError) {
      diagnostic.primary = false;
      diagnostic.cascadeOf = firstSyntaxError.id;
      continue;
    }

    if (diagnostic.code && SYNTAX_ERROR_CODES.has(diagnostic.code)) {
      firstSyntaxErrorByFile.set(diagnostic.file, diagnostic);
    }
  }

  return diagnostics;
}

async function executeCheck(
  kind: BuildCheckKind,
  command: string,
  args: string[],
  timeoutMs: number,
  environmentOverrides: Partial<NodeJS.ProcessEnv> = {},
  rootOption = process.cwd()
): Promise<BuildCheckResult> {
  const root = await realpath(path.resolve(rootOption));
  const startedAtDate = new Date();
  const run = await runCommand(command, args, root, timeoutMs, environmentOverrides);
  const completedAtDate = new Date();
  const diagnostics = parseDiagnostics(root, run.output);

  return {
    kind,
    status: run.timedOut ? "timed-out" : run.exitCode === 0 ? "passed" : "failed",
    command: [command, ...args].join(" "),
    startedAt: startedAtDate.toISOString(),
    completedAt: completedAtDate.toISOString(),
    durationMs: completedAtDate.getTime() - startedAtDate.getTime(),
    exitCode: run.exitCode,
    signal: run.signal,
    diagnostics,
    diagnosticCount: diagnostics.length,
    primaryDiagnosticCount: diagnostics.filter((diagnostic) => diagnostic.primary).length,
    output: run.output,
    outputTruncated: run.outputTruncated,
  };
}

export function runTypeCheck(rootOption = process.cwd()): Promise<BuildCheckResult> {
  return executeCheck(
    "typecheck",
    process.execPath,
    [
      path.join(rootOption, "node_modules", "typescript", "bin", "tsc"),
      "--noEmit",
      "--pretty",
      "false",
      "--incremental",
      "false",
    ],
    TYPECHECK_TIMEOUT_MS,
    {},
    rootOption
  );
}

export function runProductionBuild(rootOption = process.cwd()): Promise<BuildCheckResult> {
  const invocation = npmBuildInvocation();
  return executeCheck(
    "build",
    invocation.command,
    invocation.args,
    BUILD_TIMEOUT_MS,
    { NODE_ENV: "production" },
    rootOption
  );
}
