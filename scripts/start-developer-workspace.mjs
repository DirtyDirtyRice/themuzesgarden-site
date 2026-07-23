import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

function argumentValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function printHelp() {
  console.log(`AI Developer Workspace launcher

Usage:
  npm run workspace:start
  npm run workspace:start -- --port 3001

The launcher validates the local engine, refuses unrelated port conflicts,
and opens the standalone workspace at /developer-workspace.`);
}

function parsePort() {
  const raw = argumentValue("--port") ?? process.env.DEVELOPER_WORKSPACE_PORT ?? "3000";
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(`Invalid port "${raw}". Choose a whole number from 1024 through 65535.`);
  }
  return port;
}

async function assertInstallation() {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isInteger(major) || major < 20) {
    throw new Error(`Node.js 20 or newer is required. Current version: ${process.version}.`);
  }
  await access(path.join(root, "package.json"));
  try {
    await access(path.join(root, "node_modules", "next", "dist", "bin", "next"));
  } catch {
    throw new Error("Dependencies are not installed. Run npm install, then start the workspace again.");
  }
}

function portIsFree(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE") resolve(false);
      else reject(error);
    });
    server.listen({ port }, () => server.close(() => resolve(true)));
  });
}

async function existingWorkspaceIsReady(port) {
  try {
    const response = await fetch(`http://localhost:${port}/api/developer-workspace/projects`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function start() {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const port = parsePort();
  await assertInstallation();
  const url = `http://127.0.0.1:${port}/developer-workspace`;

  if (!(await portIsFree(port))) {
    if (await existingWorkspaceIsReady(port)) {
      console.log(`AI Developer Workspace is already ready at ${url}`);
      return;
    }
    throw new Error(`Port ${port} is already used by another application. Choose another with --port.`);
  }

  console.log("Starting the local AI Developer Workspace engine…");
  console.log(`Open ${url}`);
  console.log("Press Ctrl+C once to stop the local engine.");

  const windows = process.platform === "win32";
  const command = windows ? (process.env.ComSpec ?? "cmd.exe") : "npm";
  const commandArgs = windows
    ? ["/d", "/s", "/c", `npm.cmd run dev -- --hostname 127.0.0.1 --port ${port}`]
    : ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)];
  const child = spawn(command, commandArgs, {
    cwd: root,
    env: { ...process.env, DEVELOPER_WORKSPACE_LAUNCHER: "1" },
    stdio: "inherit",
    windowsHide: true,
  });

  const forward = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.once("SIGINT", () => forward("SIGINT"));
  process.once("SIGTERM", () => forward("SIGTERM"));

  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  process.exitCode = exitCode;
}

start().catch((error) => {
  console.error(`Developer Workspace could not start: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
