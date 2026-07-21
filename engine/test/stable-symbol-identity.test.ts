import { describe, expect, it } from "vitest";

import {
  reconcileStableSymbols,
  type StableSymbolRecord,
} from "../../lib/developer-workspace/stableSymbolIdentity";
import type { ProjectSymbol } from "../../lib/developer-workspace/symbolIndex";

function symbol(overrides: Partial<ProjectSymbol> = {}): ProjectSymbol {
  return {
    id: "src/example.ts:10:1:function:prepare",
    name: "prepare",
    kind: "function",
    path: "src/example.ts",
    line: 10,
    column: 1,
    endLine: 14,
    endColumn: 2,
    exported: true,
    defaultExport: false,
    containerName: null,
    declarationHash: "declaration-a",
    shapeHash: "shape-a",
    ...overrides,
  };
}

function firstRecord(records: Record<string, StableSymbolRecord>): StableSymbolRecord {
  const record = Object.values(records)[0];
  if (!record) throw new Error("Expected a stable symbol record.");
  return record;
}

describe("stable symbol identity", () => {
  it("keeps one identity when surrounding edits shift a declaration's line", () => {
    const initial = reconcileStableSymbols({}, [symbol()], "2026-07-20T01:00:00.000Z", () => "stable-1");
    const shifted = reconcileStableSymbols(
      initial.records,
      [symbol({ id: "shifted", line: 40, endLine: 44 })],
      "2026-07-20T02:00:00.000Z"
    );

    expect(shifted.matches[0].record.stableId).toBe("stable-1");
    expect(shifted.matches[0].reason).toBe("same-locator");
    expect(shifted.matches[0].record.line).toBe(40);
  });

  it("recognizes file moves and renames from declaration and shape fingerprints", () => {
    const initial = reconcileStableSymbols({}, [symbol()], "2026-07-20T01:00:00.000Z", () => "stable-1");
    const moved = reconcileStableSymbols(
      initial.records,
      [symbol({ id: "moved", path: "src/runtime/example.ts", line: 3 })],
      "2026-07-20T02:00:00.000Z"
    );
    const renamed = reconcileStableSymbols(
      moved.records,
      [symbol({ id: "renamed", path: "src/runtime/example.ts", line: 3, name: "initialize", declarationHash: "declaration-b" })],
      "2026-07-20T03:00:00.000Z"
    );

    expect(moved.matches[0].record.stableId).toBe("stable-1");
    expect(moved.matches[0].reason).toBe("same-declaration");
    expect(renamed.matches[0].record.stableId).toBe("stable-1");
    expect(renamed.matches[0].reason).toBe("same-shape");
    expect(renamed.matches[0].record.nameHistory).toEqual(["prepare", "initialize"]);
    expect(renamed.matches[0].record.pathHistory).toEqual([
      "src/example.ts",
      "src/runtime/example.ts",
    ]);
  });

  it("records removal once and restores the same identity when code returns", () => {
    const initial = reconcileStableSymbols({}, [symbol()], "2026-07-20T01:00:00.000Z", () => "stable-1");
    const removed = reconcileStableSymbols(initial.records, [], "2026-07-20T02:00:00.000Z");
    const stillRemoved = reconcileStableSymbols(removed.records, [], "2026-07-20T03:00:00.000Z");
    const restored = reconcileStableSymbols(
      stillRemoved.records,
      [symbol()],
      "2026-07-20T04:00:00.000Z"
    );

    expect(removed.removed).toHaveLength(1);
    expect(stillRemoved.removed).toHaveLength(0);
    expect(firstRecord(stillRemoved.records).present).toBe(false);
    expect(restored.matches[0].record.stableId).toBe("stable-1");
    expect(restored.matches[0].record.present).toBe(true);
    expect(restored.matches[0].previous?.present).toBe(false);
  });
});
