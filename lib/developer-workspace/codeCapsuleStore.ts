import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  appendCodeCapsuleFragment,
  createCodeCapsule,
  type CodeCapsule,
  type CreateCodeCapsuleInput,
} from "./codeCapsule";

const directoryName = "code-map-reports/code-capsules";
const capsuleIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{7,80}$/;
const lockKey = "__developerWorkspaceCodeCapsuleLocks";
const lockStore = globalThis as typeof globalThis & { [lockKey]?: Map<string, Promise<void>> };
lockStore[lockKey] ??= new Map<string, Promise<void>>();

async function withCapsuleLock<T>(id: string, work: () => Promise<T>): Promise<T> {
  const locks = lockStore[lockKey]!;
  const previous = locks.get(id) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => gate);
  locks.set(id, queued);
  await previous;
  try {
    return await work();
  } finally {
    release();
    if (locks.get(id) === queued) locks.delete(id);
  }
}

function directory(root: string): string {
  return path.resolve(root, directoryName);
}

function capsulePath(root: string, id: string): string {
  if (!capsuleIdPattern.test(id)) throw new Error("Code capsule id is invalid.");
  return path.join(directory(root), `${id}.json`);
}

export async function readCodeCapsule(id: string, root = process.cwd()): Promise<CodeCapsule> {
  try {
    return JSON.parse(await readFile(capsulePath(root, id), "utf8")) as CodeCapsule;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Code capsule ${id} does not exist.`);
    }
    throw error;
  }
}

export async function listCodeCapsules(root = process.cwd()): Promise<CodeCapsule[]> {
  let names: string[];
  try {
    names = (await readdir(directory(root))).filter((name) => name.endsWith(".json"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const capsules = await Promise.all(
    names.map(async (name) => JSON.parse(await readFile(path.join(directory(root), name), "utf8")) as CodeCapsule)
  );
  return capsules.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() ||
      left.id.localeCompare(right.id)
  );
}

export async function writeCodeCapsule(capsule: CodeCapsule, root = process.cwd()): Promise<void> {
  const target = capsulePath(root, capsule.id);
  await mkdir(directory(root), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(capsule, null, 2), "utf8");
  await rename(temporary, target);
}

export async function storeNewCodeCapsule(
  input: CreateCodeCapsuleInput,
  root = process.cwd()
): Promise<CodeCapsule> {
  const capsule = createCodeCapsule(input);
  await writeCodeCapsule(capsule, root);
  return capsule;
}

export async function updateStoredCodeCapsule(
  id: string,
  expectedVersion: number,
  update: (capsule: CodeCapsule) => Promise<CodeCapsule> | CodeCapsule,
  root = process.cwd()
): Promise<CodeCapsule> {
  return withCapsuleLock(id, async () => {
    const capsule = await readCodeCapsule(id, root);
    if (capsule.version !== expectedVersion) {
      throw new Error("The code capsule changed after it was opened. Refresh before continuing.");
    }
    const updated = await update(capsule);
    await writeCodeCapsule(updated, root);
    return updated;
  });
}

export async function storeCodeCapsuleFragment(
  id: string,
  content: string,
  note: string,
  expectedVersion: number,
  root = process.cwd()
): Promise<CodeCapsule> {
  return withCapsuleLock(id, async () => {
    const capsule = await readCodeCapsule(id, root);
    if (capsule.version !== expectedVersion) {
      throw new Error("The code capsule changed after it was opened. Refresh before adding this fragment.");
    }
    const updated = appendCodeCapsuleFragment(capsule, content, note);
    await writeCodeCapsule(updated, root);
    return updated;
  });
}
