import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { searchCodeEvents, updateCodeEventLedger } from "../../lib/developer-workspace/codeEventLedger";
import { buildProjectIndex } from "../../lib/developer-workspace/projectIndex";
import { buildRelationshipIndex } from "../../lib/developer-workspace/relationshipIndex";
import { buildSymbolIndex } from "../../lib/developer-workspace/symbolIndex";

const temporaryRoots: string[] = [];

async function projectFixture(name: string, source: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), `workspace-isolation-${name}-`));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2022", module: "ESNext", strict: true },
    include: ["src/**/*.ts"],
  }));
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name, private: true }));
  await writeFile(path.join(root, "src", "shared.ts"), source);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Workspace project data isolation", () => {
  it("keeps conflicting files, symbols, relationships, and event history inside their own roots", async () => {
    const firstRoot = await projectFixture("first-project", [
      "export interface FirstProjectIdentity { firstOnly: string }",
      "export const sharedValue: FirstProjectIdentity = { firstOnly: 'first' };",
      "export function firstOnlyFunction(): string { return sharedValue.firstOnly; }",
    ].join("\n"));
    const secondRoot = await projectFixture("second-project", [
      "export interface SecondProjectIdentity { secondOnly: number }",
      "export const sharedValue: SecondProjectIdentity = { secondOnly: 2 };",
      "export function secondOnlyFunction(): number { return sharedValue.secondOnly; }",
    ].join("\n"));

    const [firstProject, secondProject, firstSymbols, secondSymbols, firstRelationships, secondRelationships] = await Promise.all([
      buildProjectIndex({ root: firstRoot }),
      buildProjectIndex({ root: secondRoot }),
      buildSymbolIndex({ root: firstRoot }),
      buildSymbolIndex({ root: secondRoot }),
      buildRelationshipIndex(firstRoot),
      buildRelationshipIndex(secondRoot),
    ]);

    expect(firstProject.root).toBe(firstRoot);
    expect(secondProject.root).toBe(secondRoot);
    expect(firstProject.stats.fileCount).toBe(3);
    expect(secondProject.stats.fileCount).toBe(3);

    const firstNames = firstSymbols.symbols.map((symbol) => symbol.name);
    const secondNames = secondSymbols.symbols.map((symbol) => symbol.name);
    expect(firstNames).toContain("FirstProjectIdentity");
    expect(firstNames).toContain("firstOnlyFunction");
    expect(firstNames).not.toContain("SecondProjectIdentity");
    expect(secondNames).toContain("SecondProjectIdentity");
    expect(secondNames).toContain("secondOnlyFunction");
    expect(secondNames).not.toContain("FirstProjectIdentity");

    expect(firstRelationships.relationships.some((item) => item.symbolName === "FirstProjectIdentity")).toBe(true);
    expect(firstRelationships.relationships.some((item) => item.symbolName === "SecondProjectIdentity")).toBe(false);
    expect(secondRelationships.relationships.some((item) => item.symbolName === "SecondProjectIdentity")).toBe(true);
    expect(secondRelationships.relationships.some((item) => item.symbolName === "FirstProjectIdentity")).toBe(false);

    await Promise.all([
      updateCodeEventLedger(firstSymbols, firstRoot),
      updateCodeEventLedger(secondSymbols, secondRoot),
    ]);

    const [firstOwnEvents, firstForeignEvents, secondOwnEvents, secondForeignEvents] = await Promise.all([
      searchCodeEvents("FirstProjectIdentity", 100, firstRoot),
      searchCodeEvents("SecondProjectIdentity", 100, firstRoot),
      searchCodeEvents("SecondProjectIdentity", 100, secondRoot),
      searchCodeEvents("FirstProjectIdentity", 100, secondRoot),
    ]);
    expect(firstOwnEvents.length).toBeGreaterThan(0);
    expect(firstForeignEvents).toHaveLength(0);
    expect(secondOwnEvents.length).toBeGreaterThan(0);
    expect(secondForeignEvents).toHaveLength(0);
  });
});
