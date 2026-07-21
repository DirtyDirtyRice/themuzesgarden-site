import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { evaluateImportAcceptance } from "../../lib/developer-workspace/importAcceptanceGate";

const temporaryRoots: string[] = [];

async function project(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "import-acceptance-"));
  temporaryRoots.push(root);
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
      },
      include: ["**/*.ts", "**/*.tsx"],
    })
  );
  for (const [relativeFile, source] of Object.entries(files)) {
    await writeFile(path.join(root, relativeFile), source);
  }
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Import Acceptance Gate", () => {
  it("accepts a correctly resolved and typed named import", async () => {
    const root = await project({
      "supplier.ts": "export type Runtime = { ready: boolean };\nexport const createRuntime = (): Runtime => ({ ready: true });\n",
      "consumer.ts": "export {};\n",
    });
    const report = evaluateImportAcceptance({
      root,
      file: "consumer.ts",
      candidateSource: "import { createRuntime, type Runtime } from './supplier';\nexport const runtime: Runtime = createRuntime();\n",
    });

    expect(report.accepted).toBe(true);
    expect(report.importCount).toBe(1);
    expect(report.resolvedImportCount).toBe(1);
    expect(report.findings).toEqual([]);
  });

  it("holds code that requests a real module's nonexistent export", async () => {
    const root = await project({
      "supplier.ts": "export const TimelineEngine = 1;\n",
      "consumer.ts": "export {};\n",
    });
    const report = evaluateImportAcceptance({
      root,
      file: "consumer.ts",
      candidateSource: "import { TimelineEngin } from './supplier';\nexport const engine = TimelineEngin;\n",
    });

    expect(report.accepted).toBe(false);
    expect(report.findings.some((item) => item.code === "IMPORT_NAMED_NOT_EXPORTED")).toBe(true);
  });

  it("holds code whose module path cannot resolve", async () => {
    const root = await project({ "consumer.ts": "export {};\n" });
    const report = evaluateImportAcceptance({
      root,
      file: "consumer.ts",
      candidateSource: "import { Missing } from './does-not-exist';\nexport type Value = Missing;\n",
    });

    expect(report.accepted).toBe(false);
    expect(report.findings.some((item) => item.code === "IMPORT_MODULE_NOT_FOUND")).toBe(true);
  });

  it("prevents a client module from importing a Node-only dependency", async () => {
    const root = await project({ "client.ts": "export {};\n" });
    const report = evaluateImportAcceptance({
      root,
      file: "client.ts",
      candidateSource: "'use client';\nimport path from 'node:path';\nexport const separator = path.sep;\n",
    });

    expect(report.accepted).toBe(false);
    expect(report.findings.some((item) => item.code === "CLIENT_IMPORTS_SERVER_MODULE")).toBe(true);
  });

  it("holds a candidate that closes a circular dependency", async () => {
    const root = await project({
      "first.ts": "import { second } from './second';\nexport const first = second + 1;\n",
      "second.ts": "export const second = 1;\n",
    });
    const report = evaluateImportAcceptance({
      root,
      file: "second.ts",
      candidateSource: "import { first } from './first';\nexport const second = first + 1;\n",
    });

    expect(report.accepted).toBe(false);
    expect(report.dependencyCycles.length).toBeGreaterThan(0);
    expect(report.findings.some((item) => item.code === "IMPORT_DEPENDENCY_CYCLE")).toBe(true);
  });
});
