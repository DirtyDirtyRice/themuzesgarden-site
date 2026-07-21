import "server-only";

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { VerificationJob } from "./verificationCoordinator";

export async function readVerificationHistory(limit = 100, root = process.cwd()): Promise<VerificationJob[]> {
  try {
    const source = await readFile(path.join(root, "code-map-reports", "verification", "history.jsonl"), "utf8");
    return source
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .reverse()
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as VerificationJob];
        } catch {
          return [];
        }
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function appendVerificationHistory(job: VerificationJob, root = job.root ?? process.cwd()): Promise<void> {
  const outputLimit = 20_000;
  const stored = job.result
    ? {
        ...job,
        result: {
          ...job.result,
          output: job.result.output.slice(-outputLimit),
          outputTruncated: job.result.outputTruncated || job.result.output.length > outputLimit,
        },
      }
    : job;
  const historyDirectory = path.join(root, "code-map-reports", "verification");
  await mkdir(historyDirectory, { recursive: true });
  await appendFile(path.join(historyDirectory, "history.jsonl"), `${JSON.stringify(stored)}\n`, "utf8");
}
