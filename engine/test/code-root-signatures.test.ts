import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildCodeRootIndex,
  codeRootAtLocation,
  type CodeRootIndex,
  type IndexedCodeRoot,
} from "../../lib/developer-workspace/codeRootIndex";
import {
  readCodeRootEvents,
  readCodeRootRegistry,
  updateCodeRootLedger,
} from "../../lib/developer-workspace/codeRootLedger";
import {
  formatCodeRootMarker,
  parseCodeRootSignatures,
  rootContainingLine,
} from "../../lib/developer-workspace/codeRootSignature";

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "code-root-signatures-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2022", module: "ESNext", strict: true },
    include: ["src/**/*.ts"],
  }));
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "root-fixture", private: true }));
  return root;
}

function indexedRoot(overrides: Partial<IndexedCodeRoot> = {}): IndexedCodeRoot {
  return {
    id: "runtime.playback",
    title: "Playback Runtime",
    path: "src/runtime.ts",
    markerLine: 10,
    startLine: 11,
    endLine: 30,
    lineCount: 20,
    contentHash: "content-a",
    marker: "// @code-root runtime.playback | Playback Runtime",
    symbols: [{
      id: "src/runtime.ts:12:1:function:startPlayback",
      name: "startPlayback",
      kind: "function",
      line: 12,
      endLine: 16,
      exported: true,
      containerName: null,
    }],
    exportedSymbolCount: 1,
    ...overrides,
  };
}

function ledgerIndex(root: string, roots: IndexedCodeRoot[]): CodeRootIndex {
  return {
    root,
    generatedAt: new Date().toISOString(),
    markerFormat: "// @code-root stable.id | Human title",
    scannedFileCount: 1,
    rootedFileCount: roots.length ? 1 : 0,
    rootCount: roots.length,
    symbolCount: roots.reduce((total, item) => total + item.symbols.length, 0),
    coveragePercent: roots.length ? 100 : 0,
    files: [],
    roots,
    issues: [],
  };
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Code Root Signatures", () => {
  it("formats strict human-readable markers and rejects unstable ids", () => {
    expect(formatCodeRootMarker("timeline.seed.runtime", "Timeline Runtime Seed"))
      .toBe("// @code-root timeline.seed.runtime | Timeline Runtime Seed");
    expect(() => formatCodeRootMarker("Timeline Runtime", "Runtime"))
      .toThrow("must start with a lowercase letter");
    expect(() => formatCodeRootMarker("timeline.runtime", ""))
      .toThrow("title is required");
    const literalExample = parseCodeRootSignatures(
      'const documentation = "// @code-root example.only | Not a real marker";',
      "src/documentation.ts"
    );
    expect(literalExample.roots).toHaveLength(0);
    expect(literalExample.issues).toHaveLength(0);
  });

  it("creates exact chapter boundaries and resolves any line to its containing root", () => {
    const source = [
      "const preface = true;",
      "// @code-root timeline.types | Timeline Types",
      "export interface TimelineState { playing: boolean }",
      "",
      "// @code-root timeline.runtime | Timeline Runtime",
      "export function play(): void {}",
      "export function stop(): void {}",
    ].join("\n");
    const parsed = parseCodeRootSignatures(source, "lib/timeline/TimelineEngine.ts");

    expect(parsed.issues).toHaveLength(0);
    expect(parsed.roots).toHaveLength(2);
    expect(parsed.roots[0]).toMatchObject({ id: "timeline.types", markerLine: 2, startLine: 3, endLine: 4 });
    expect(parsed.roots[1]).toMatchObject({ id: "timeline.runtime", markerLine: 5, startLine: 6, endLine: 7 });
    expect(rootContainingLine(parsed.roots, 4)?.id).toBe("timeline.types");
    expect(rootContainingLine(parsed.roots, 7)?.id).toBe("timeline.runtime");
    expect(rootContainingLine(parsed.roots, 1)).toBeNull();
  });

  it("detects project-wide id collisions and large files without chapters", async () => {
    const root = await temporaryProject();
    await writeFile(path.join(root, "src", "first.ts"), [
      "// @code-root shared.runtime | First Runtime",
      "export function first(): string { return 'first'; }",
    ].join("\n"));
    await writeFile(path.join(root, "src", "second.ts"), [
      "// @code-root shared.runtime | Second Runtime",
      "export function second(): string { return 'second'; }",
    ].join("\n"));
    await writeFile(path.join(root, "src", "legacy.ts"), Array.from({ length: 55 }, (_, index) => `export const legacy${index} = ${index};`).join("\n"));

    const index = await buildCodeRootIndex({ root, largeFileLineThreshold: 50 });

    expect(index.rootCount).toBe(2);
    expect(index.issues.filter((issue) => issue.code === "duplicate-project-id")).toHaveLength(2);
    expect(index.issues.some((issue) => issue.code === "unrooted-large-file" && issue.path === "src/legacy.ts")).toBe(true);
    expect(codeRootAtLocation(index, "src/first.ts", 2)?.id).toBe("shared.runtime");
  });

  it("records stable root history through changes, removal, and restoration", async () => {
    const root = await temporaryProject();
    const initial = indexedRoot();
    const first = await updateCodeRootLedger(ledgerIndex(root, [initial]), root);
    expect(first.events.map((event) => event.kind)).toEqual(["root-observed"]);

    const changed = indexedRoot({
      title: "Playback Engine Runtime",
      path: "src/engine/runtime.ts",
      markerLine: 40,
      startLine: 41,
      endLine: 68,
      lineCount: 28,
      contentHash: "content-b",
    });
    const second = await updateCodeRootLedger(ledgerIndex(root, [changed]), root);
    expect(second.events.map((event) => event.kind)).toEqual(expect.arrayContaining([
      "root-moved",
      "root-renamed",
      "root-content-changed",
    ]));

    const removed = await updateCodeRootLedger(ledgerIndex(root, []), root);
    expect(removed.events.map((event) => event.kind)).toEqual(["root-removed"]);
    const restored = await updateCodeRootLedger(ledgerIndex(root, [changed]), root);
    expect(restored.events.map((event) => event.kind)).toContain("root-restored");

    const registry = await readCodeRootRegistry(root);
    expect(registry.records[initial.id]).toMatchObject({
      present: true,
      revisionCount: 1,
      titleHistory: ["Playback Runtime", "Playback Engine Runtime"],
      pathHistory: ["src/runtime.ts", "src/engine/runtime.ts"],
    });
    const history = await readCodeRootEvents(100, root);
    expect(history.some((event) => event.kind === "root-removed")).toBe(true);
    expect(history.some((event) => event.kind === "root-restored")).toBe(true);
  });
});
