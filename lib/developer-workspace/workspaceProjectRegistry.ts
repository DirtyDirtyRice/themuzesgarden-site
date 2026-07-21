import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type WorkspaceProjectFramework = "nextjs" | "typescript";
export type WorkspaceProjectStatus = "available" | "missing";

export type WorkspaceProjectRecord = {
  id: string;
  name: string;
  rootPath: string;
  framework: WorkspaceProjectFramework;
  packageName: string | null;
  status: WorkspaceProjectStatus;
  registeredAt: string;
  lastOpenedAt: string;
  lastVerifiedAt: string;
};

export type WorkspaceProjectRegistry = {
  version: 1;
  updatedAt: string;
  activeProjectId: string | null;
  projects: Record<string, WorkspaceProjectRecord>;
};

export type RegisterWorkspaceProjectResult = {
  project: WorkspaceProjectRecord;
  created: boolean;
  activeProjectId: string;
};

const registryDirectory = "code-map-reports/workspace-projects";
const registryFile = "registry.json";
const lockKey = "__developerWorkspaceProjectRegistryLock";
const lockState = globalThis as typeof globalThis & { [lockKey]?: Promise<void> };
lockState[lockKey] ??= Promise.resolve();

function emptyRegistry(): WorkspaceProjectRegistry {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    activeProjectId: null,
    projects: {},
  };
}

function registryPath(hostRoot: string): string {
  return path.resolve(hostRoot, registryDirectory, registryFile);
}

function canonicalIdentity(rootPath: string): string {
  const normalized = path.normalize(rootPath).replace(/[\\/]+$/, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function projectId(rootPath: string): string {
  return `project-${createHash("sha256").update(canonicalIdentity(rootPath)).digest("hex").slice(0, 24)}`;
}

function assertReasonableProjectRoot(rootPath: string): void {
  if (path.parse(rootPath).root === rootPath) {
    throw new Error("A filesystem root cannot be registered as a workspace project.");
  }
  const segments = rootPath.split(path.sep).filter(Boolean);
  if (segments.length < 2) throw new Error("Choose a specific project directory, not a broad system directory.");
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

type PackageMetadata = {
  name?: unknown;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
};

async function packageMetadata(rootPath: string): Promise<PackageMetadata | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path.join(rootPath, "package.json"), "utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed as PackageMetadata : null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    if (error instanceof SyntaxError) throw new Error("The selected project's package.json is not valid JSON.");
    throw error;
  }
}

function frameworkFor(metadata: PackageMetadata | null): WorkspaceProjectFramework {
  const dependencies = { ...(metadata?.dependencies ?? {}), ...(metadata?.devDependencies ?? {}) };
  return "next" in dependencies ? "nextjs" : "typescript";
}

function packageName(metadata: PackageMetadata | null): string | null {
  return typeof metadata?.name === "string" && metadata.name.trim() ? metadata.name.trim() : null;
}

async function inspectProject(requestedPath: string): Promise<{
  rootPath: string;
  name: string;
  framework: WorkspaceProjectFramework;
  packageName: string | null;
}> {
  if (!requestedPath.trim()) throw new Error("A project directory is required.");
  const rootPath = await realpath(path.resolve(requestedPath.trim()));
  assertReasonableProjectRoot(rootPath);
  const rootStats = await stat(rootPath);
  if (!rootStats.isDirectory()) throw new Error("The selected project path is not a directory.");
  if (!await exists(path.join(rootPath, "tsconfig.json"))) {
    throw new Error("The selected directory is not a supported TypeScript project because tsconfig.json is missing.");
  }
  const metadata = await packageMetadata(rootPath);
  return {
    rootPath,
    name: path.basename(rootPath),
    framework: frameworkFor(metadata),
    packageName: packageName(metadata),
  };
}

async function withRegistryLock<T>(work: () => Promise<T>): Promise<T> {
  const previous = lockState[lockKey]!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  lockState[lockKey] = previous.then(() => gate);
  await previous;
  try {
    return await work();
  } finally {
    release();
  }
}

export async function readWorkspaceProjectRegistry(
  hostRoot = process.cwd()
): Promise<WorkspaceProjectRegistry> {
  try {
    const parsed = JSON.parse(await readFile(registryPath(hostRoot), "utf8")) as Partial<WorkspaceProjectRegistry>;
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      activeProjectId: typeof parsed.activeProjectId === "string" ? parsed.activeProjectId : null,
      projects: typeof parsed.projects === "object" && parsed.projects !== null
        ? parsed.projects as Record<string, WorkspaceProjectRecord>
        : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyRegistry();
    throw error;
  }
}

async function writeRegistry(registry: WorkspaceProjectRegistry, hostRoot: string): Promise<void> {
  const file = registryPath(hostRoot);
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(registry, null, 2), "utf8");
  await rename(temporary, file);
}

export async function registerWorkspaceProject(
  requestedPath: string,
  hostRoot = process.cwd()
): Promise<RegisterWorkspaceProjectResult> {
  const inspected = await inspectProject(requestedPath);
  return withRegistryLock(async () => {
    const registry = await readWorkspaceProjectRegistry(hostRoot);
    const id = projectId(inspected.rootPath);
    const now = new Date().toISOString();
    const previous = registry.projects[id];
    const project: WorkspaceProjectRecord = {
      id,
      ...inspected,
      status: "available",
      registeredAt: previous?.registeredAt ?? now,
      lastOpenedAt: now,
      lastVerifiedAt: now,
    };
    const updated: WorkspaceProjectRegistry = {
      version: 1,
      updatedAt: now,
      activeProjectId: id,
      projects: { ...registry.projects, [id]: project },
    };
    await writeRegistry(updated, hostRoot);
    return { project, created: !previous, activeProjectId: id };
  });
}

export async function selectWorkspaceProject(
  id: string,
  hostRoot = process.cwd()
): Promise<WorkspaceProjectRecord> {
  return withRegistryLock(async () => {
    const registry = await readWorkspaceProjectRegistry(hostRoot);
    const existing = registry.projects[id];
    if (!existing) throw new Error("The requested workspace project is not registered.");
    let verifiedRoot: string;
    try {
      verifiedRoot = await realpath(existing.rootPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const now = new Date().toISOString();
        await writeRegistry({
          ...registry,
          updatedAt: now,
          projects: { ...registry.projects, [id]: { ...existing, status: "missing", lastVerifiedAt: now } },
        }, hostRoot);
        throw new Error("The registered project directory is no longer available.");
      }
      throw error;
    }
    if (canonicalIdentity(verifiedRoot) !== canonicalIdentity(existing.rootPath) || projectId(verifiedRoot) !== id) {
      throw new Error("The registered project identity no longer matches its canonical filesystem location.");
    }
    const now = new Date().toISOString();
    const selected: WorkspaceProjectRecord = {
      ...existing,
      rootPath: verifiedRoot,
      status: "available",
      lastOpenedAt: now,
      lastVerifiedAt: now,
    };
    await writeRegistry({
      ...registry,
      updatedAt: now,
      activeProjectId: id,
      projects: { ...registry.projects, [id]: selected },
    }, hostRoot);
    return selected;
  });
}

export async function resolveWorkspaceProject(
  id: string,
  hostRoot = process.cwd()
): Promise<WorkspaceProjectRecord> {
  if (!/^project-[a-f0-9]{24}$/.test(id)) throw new Error("Workspace project id is invalid.");
  const registry = await readWorkspaceProjectRegistry(hostRoot);
  const existing = registry.projects[id];
  if (!existing) throw new Error("The requested workspace project is not registered.");
  let verifiedRoot: string;
  try {
    verifiedRoot = await realpath(existing.rootPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("The registered project directory is no longer available.");
    }
    throw error;
  }
  if (canonicalIdentity(verifiedRoot) !== canonicalIdentity(existing.rootPath) || projectId(verifiedRoot) !== id) {
    throw new Error("The registered project identity no longer matches its canonical filesystem location.");
  }
  if (!await exists(path.join(verifiedRoot, "tsconfig.json"))) {
    throw new Error("The registered directory is no longer a supported TypeScript project.");
  }
  return { ...existing, rootPath: verifiedRoot, status: "available", lastVerifiedAt: new Date().toISOString() };
}
export async function resolveActiveWorkspaceProject(
  hostRoot = process.cwd()
): Promise<WorkspaceProjectRecord> {
  const registry = await readWorkspaceProjectRegistry(hostRoot);
  if (!registry.activeProjectId) {
    return (await registerWorkspaceProject(hostRoot, hostRoot)).project;
  }
  return selectWorkspaceProject(registry.activeProjectId, hostRoot);
}

export function workspaceProjectDataDirectory(projectIdValue: string, hostRoot = process.cwd()): string {
  if (!/^project-[a-f0-9]{24}$/.test(projectIdValue)) throw new Error("Workspace project id is invalid.");
  return path.resolve(hostRoot, registryDirectory, "data", projectIdValue);
}
