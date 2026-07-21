import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  readWorkspaceProjectRegistry,
  registerWorkspaceProject,
  selectWorkspaceProject,
  workspaceProjectDataDirectory,
} from "../../lib/developer-workspace/workspaceProjectRegistry";

const roots: string[] = [];

async function temporaryHost(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "workspace-project-registry-"));
  roots.push(root);
  return root;
}

async function createProject(
  host: string,
  directory: string,
  metadata: Record<string, unknown> = { name: directory }
): Promise<string> {
  const project = path.join(host, directory);
  await mkdir(project, { recursive: true });
  await writeFile(path.join(project, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true } }));
  await writeFile(path.join(project, "package.json"), JSON.stringify(metadata));
  return project;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Workspace Project Registry", () => {
  it("creates a stable identity and recognizes duplicate registration", async () => {
    const host = await temporaryHost();
    const project = await createProject(host, "next-project", {
      name: "coder-project",
      dependencies: { next: "16.1.6" },
    });

    const first = await registerWorkspaceProject(project, host);
    const second = await registerWorkspaceProject(project, host);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.project.id).toBe(first.project.id);
    expect(second.project.framework).toBe("nextjs");
    expect(second.project.packageName).toBe("coder-project");
    expect(second.project.id).toMatch(/^project-[a-f0-9]{24}$/);
  });

  it("isolates identities and data namespaces for different projects", async () => {
    const host = await temporaryHost();
    const firstPath = await createProject(host, "first-project");
    const secondPath = await createProject(host, "second-project");

    const [first, second] = await Promise.all([
      registerWorkspaceProject(firstPath, host),
      registerWorkspaceProject(secondPath, host),
    ]);

    expect(first.project.id).not.toBe(second.project.id);
    expect(workspaceProjectDataDirectory(first.project.id, host)).not.toBe(
      workspaceProjectDataDirectory(second.project.id, host)
    );
    const registry = await readWorkspaceProjectRegistry(host);
    expect(Object.keys(registry.projects)).toHaveLength(2);
  });

  it("selects projects by registered identity rather than accepting a raw path", async () => {
    const host = await temporaryHost();
    const first = await registerWorkspaceProject(await createProject(host, "first"), host);
    const second = await registerWorkspaceProject(await createProject(host, "second"), host);

    const selected = await selectWorkspaceProject(first.project.id, host);
    const registry = await readWorkspaceProjectRegistry(host);

    expect(selected.id).toBe(first.project.id);
    expect(registry.activeProjectId).toBe(first.project.id);
    expect(registry.activeProjectId).not.toBe(second.project.id);
    await expect(selectWorkspaceProject("project-000000000000000000000000", host)).rejects.toThrow("not registered");
  });

  it("rejects directories that are not TypeScript projects", async () => {
    const host = await temporaryHost();
    const unsupported = path.join(host, "plain-folder");
    await mkdir(unsupported);

    await expect(registerWorkspaceProject(unsupported, host)).rejects.toThrow("tsconfig.json is missing");
    expect(Object.keys((await readWorkspaceProjectRegistry(host)).projects)).toHaveLength(0);
  });

  it("rejects filesystem roots and malformed package metadata", async () => {
    const host = await temporaryHost();
    await expect(registerWorkspaceProject(path.parse(host).root, host)).rejects.toThrow("filesystem root");

    const malformed = path.join(host, "malformed-project");
    await mkdir(malformed);
    await writeFile(path.join(malformed, "tsconfig.json"), "{}");
    await writeFile(path.join(malformed, "package.json"), "{not-json");
    await expect(registerWorkspaceProject(malformed, host)).rejects.toThrow("not valid JSON");
  });
});
