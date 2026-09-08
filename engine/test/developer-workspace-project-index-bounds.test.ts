import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildProjectIndex } from "../../lib/developer-workspace/projectIndex";
import { buildSymbolIndex } from "../../lib/developer-workspace/symbolIndex";

const temporaryRoots: string[] = [];

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "developer-workspace-bounds-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "bounded-fixture", private: true }));
  await writeFile(path.join(root, "tsconfig.json"), JSON.stringify({ include: ["**/*.ts"] }));
  await writeFile(path.join(root, "src", "real.ts"), "export function realSource(): string { return 'real'; }");
  for (const folder of ["node_modules", ".next", "dist", "coverage", ".codex-deploy-copy"]) {
    await mkdir(path.join(root, folder), { recursive: true });
    await writeFile(path.join(root, folder, "copied.ts"), `export const ${folder.replace(/\W/g, "_")} = true;`);
  }
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Developer Workspace bounded project scanning", () => {
  it("skips dependency, generated, report, repository, and deployment-copy directories", async () => {
    const root = await fixture();
    const [project, symbols] = await Promise.all([
      buildProjectIndex({ root }),
      buildSymbolIndex({ root }),
    ]);

    expect(project.stats.fileCount).toBe(3);
    expect(project.stats.directoryCount).toBe(1);
    expect(project.truncated).toBe(false);
    expect(project.truncationReason).toBeNull();
    expect(symbols.symbols.map((symbol) => symbol.name)).toContain("realSource");
    expect(symbols.symbols.some((symbol) => symbol.path.includes(".codex-deploy-"))).toBe(false);
  });

  it("stops cleanly and reports the file limit", async () => {
    const root = await fixture();
    const project = await buildProjectIndex({ root, maxFiles: 2 });

    expect(project.stats.fileCount).toBe(2);
    expect(project.truncated).toBe(true);
    expect(project.truncationReason).toBe("file-limit");
  });

  it("stops cleanly and reports the directory limit", async () => {
    const root = await fixture();
    await mkdir(path.join(root, "second-source"));
    await writeFile(path.join(root, "second-source", "other.ts"), "export const other = true;");
    const project = await buildProjectIndex({ root, maxDirectories: 1 });

    expect(project.stats.directoryCount).toBe(1);
    expect(project.truncated).toBe(true);
    expect(project.truncationReason).toBe("directory-limit");
  });
});
