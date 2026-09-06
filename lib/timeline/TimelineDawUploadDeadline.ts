export const TIMELINE_DAW_UPLOAD_DEADLINE_MS = 120_000;
export const TIMELINE_DAW_LARGE_UPLOAD_DEADLINE_MS = 30 * 60_000;

export async function withTimelineDawUploadDeadline<T>(operation: Promise<T>, timeoutMs = TIMELINE_DAW_UPLOAD_DEADLINE_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("The private audio upload stopped responding. Your source file was not erased. Choose it again and retry.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
