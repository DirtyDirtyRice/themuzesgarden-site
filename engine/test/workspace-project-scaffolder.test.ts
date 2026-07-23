import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createWorkspaceTypeScriptProject } from "../../lib/developer-workspace/workspaceProjectScaffolder";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("workspace project scaffolder", () => {
  it("atomically creates and registers a strict TypeScript project", async () => {
    const hostRoot = await mkdtemp(path.join(os.tmpdir(), "workspace-host-"));
    const parent = await mkdtemp(path.join(os.tmpdir(), "workspace-projects-"));
    temporaryRoots.push(hostRoot, parent);

    const result = await createWorkspaceTypeScriptProject({ parentDirectory: parent, projectName: "first-app" }, hostRoot);
    const packageJson = JSON.parse(await readFile(path.join(result.project.rootPath, "package.json"), "utf8")) as { scripts: Record<string, string> };
    const tsconfig = JSON.parse(await readFile(path.join(result.project.rootPath, "tsconfig.json"), "utf8")) as { compilerOptions: { strict: boolean } };

    expect(result.created).toBe(true);
    expect(result.activeProjectId).toBe(result.project.id);
    expect(result.createdFiles).toContain("src/index.ts");
    expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");
    expect(tsconfig.compilerOptions.strict).toBe(true);

    await expect(createWorkspaceTypeScriptProject({ parentDirectory: parent, projectName: "first-app" }, hostRoot))
      .rejects.toThrow("already exists");
  });
});
