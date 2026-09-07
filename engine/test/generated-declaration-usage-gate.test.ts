import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

import {
  evaluateGeneratedDeclarationUsage,
  newlyIntroducedDeclarationKeys,
} from "../../lib/developer-workspace/generatedDeclarationUsageGate";

const temporaryDirectories: string[] = [];

function programFor(source: string): { program: ts.Program; file: string } {
  const directory = mkdtempSync(path.join(tmpdir(), "declaration-usage-"));
  temporaryDirectories.push(directory);
  const file = path.join(directory, "candidate.ts");
  writeFileSync(file, source, "utf8");
  return {
    file,
    program: ts.createProgram([file], { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022 }),
  };
}

afterEach(() => {
  while (temporaryDirectories.length) rmSync(temporaryDirectories.pop()!, { recursive: true, force: true });
});

describe("generated declaration usage gate", () => {
  it("detects declarations that a direct Safe Patch would otherwise introduce", () => {
    expect(newlyIntroducedDeclarationKeys(
      "export const existing = true;",
      "export const existing = true;\nexport function inventedHelper() { return true; }",
      "candidate.ts"
    )).toEqual(["function:inventedHelper"]);
  });

  it("accepts generated declarations with verified symbol usage", () => {
    const { program, file } = programFor("export type SongId = string;\nexport const currentSong: SongId = 'song-1';\n");
    const report = evaluateGeneratedDeclarationUsage(program, file, 1, 1);

    expect(report.passed).toBe(true);
    expect(report.declarations[0]).toMatchObject({ name: "SongId", kind: "type", reserved: false });
    expect(report.declarations[0].references).toHaveLength(1);
  });

  it("holds generated declarations that compile but have no verified usage", () => {
    const { program, file } = programFor("export interface ImaginaryFeature { enabled: boolean }\n");
    const report = evaluateGeneratedDeclarationUsage(program, file, 1, 1);

    expect(report.passed).toBe(false);
    expect(report.diagnostics[0]).toContain("UNREALIZED_DECLARATION");
    expect(report.diagnostics[0]).toContain("ImaginaryFeature");
  });

  it("accepts an unused declaration only with a matching timestamped human reservation", () => {
    const { program, file } = programFor("export const futureProtocol = 'reserved';\n");
    const report = evaluateGeneratedDeclarationUsage(program, file, 1, 1, [{
      declarationName: "futureProtocol",
      declarationKind: "constant",
      reason: "Approved extension point for a scheduled integration.",
      approvedBy: "developer",
      approvedAt: "2026-09-07T12:00:00.000Z",
    }]);

    expect(report.passed).toBe(true);
    expect(report.declarations[0]).toMatchObject({ name: "futureProtocol", reserved: true, references: [] });
  });

  it("rejects a reservation that does not match the declaration kind", () => {
    const { program, file } = programFor("export class FutureEngine {}\n");
    const report = evaluateGeneratedDeclarationUsage(program, file, 1, 1, [{
      declarationName: "FutureEngine",
      declarationKind: "interface",
      reason: "Wrong kind must not bypass the gate.",
      approvedBy: "developer",
      approvedAt: "2026-09-07T12:00:00.000Z",
    }]);

    expect(report.passed).toBe(false);
  });
});
