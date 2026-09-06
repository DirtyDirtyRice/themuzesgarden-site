import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "developer-workspace-beta");
const standalone = path.join(root, ".next", "standalone");

const launcher = `const { accessSync } = require("node:fs");
const { createServer } = require("node:net");
const { spawn } = require("node:child_process");
const path = require("node:path");

const root = __dirname;
function freePort(start = 3210) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = createServer();
      server.once("error", (error) => error.code === "EADDRINUSE" ? tryPort(port + 1) : reject(error));
      server.listen({ host: "127.0.0.1", port }, () => server.close(() => resolve(port)));
    };
    tryPort(start);
  });
}
function chromePath() {
  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], "Google", "Chrome", "Application", "chrome.exe"),
  ].filter(Boolean);
  return candidates.find((candidate) => { try { accessSync(candidate); return true; } catch { return false; } });
}
async function ready(url) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return true; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}
(async () => {
  const port = await freePort();
  const url = \`http://127.0.0.1:\${port}/developer-workspace\`;
  const server = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: { ...process.env, HOSTNAME: "127.0.0.1", PORT: String(port), DEVELOPER_WORKSPACE_LOCAL_RUNTIME: "1" },
    stdio: "inherit",
    windowsHide: true,
  });
  console.log("Starting Developer Workspace locally…");
  if (!await ready(url)) throw new Error("The local workspace did not become ready within 60 seconds.");
  const chrome = chromePath();
  if (chrome) spawn(chrome, [\`--app=\${url}\`], { detached: true, stdio: "ignore" }).unref();
  else console.log(\`Chrome was not found automatically. Open this address in Chrome: \${url}\`);
  console.log("Keep this window open while using Developer Workspace. Press Ctrl+C to stop it.");
  const stop = () => { if (!server.killed) server.kill(); };
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  server.once("exit", (code) => { process.exitCode = code || 0; });
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
`;

const startCommand = `@echo off\r\ncd /d "%~dp0"\r\n"runtime\\node.exe" launcher.cjs\r\npause\r\n`;
const readme = `Developer Workspace — Windows Coder Beta\r\n\r\n1. Extract or copy this entire folder to the coder's computer.\r\n2. Double-click Start Developer Workspace.cmd.\r\n3. Keep the console window open. Chrome opens the app automatically.\r\n4. Begin with Documentation, then complete one beta scenario.\r\n5. Download Beta Feedback when finished.\r\n\r\nNo Node.js installation is required. Project files remain on this computer.\r\nDo not move individual files out of this folder.\r\n`;

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(standalone, "server.js"), path.join(output, "server.js"));
await cp(path.join(standalone, "package.json"), path.join(output, "package.json"));
await cp(path.join(standalone, "node_modules"), path.join(output, "node_modules"), { recursive: true, dereference: true });
await cp(path.join(standalone, ".next"), path.join(output, ".next"), { recursive: true, dereference: true });
await cp(path.join(root, ".next", "static"), path.join(output, ".next", "static"), { recursive: true });
await mkdir(path.join(output, "runtime"), { recursive: true });
await cp(process.execPath, path.join(output, "runtime", "node.exe"));
await writeFile(path.join(output, "launcher.cjs"), launcher, "utf8");
await writeFile(path.join(output, "Start Developer Workspace.cmd"), startCommand, "utf8");
await writeFile(path.join(output, "README-FIRST.txt"), readme, "utf8");
console.log(`Developer Workspace beta package created at ${output}`);
