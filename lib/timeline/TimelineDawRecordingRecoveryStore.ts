const DATABASE = "muzes-daw-private-recovery";
const STORE = "recordings";
export const TIMELINE_DAW_MAX_RECOVERY_BYTES = 500 * 1024 * 1024;

export type TimelineDawStoredRecordingRecovery = {
  sessionId: string;
  file: File;
  plan: {
    mode: "normal" | "punch" | "loop"; countInBars: number; beatsPerBar: number;
    bpm: number; rangeStartFrame: number; rangeEndFrame: number | null;
    loopPasses: number; groupId?: string | null; countInCaptured?: boolean;
  };
  uploaded: unknown | null;
  failure: string;
  savedAt: string;
};

type StoredRow = Omit<TimelineDawStoredRecordingRecovery, "file"> & {
  blob: Blob;
  fileName: string;
  fileType: string;
  lastModified: number;
};

export function validateTimelineDawStoredRecovery(value: unknown, expectedSessionId: string): string | null {
  if (!value || typeof value !== "object") return "Recovery metadata is missing.";
  const row = value as Record<string, unknown>;
  if (row.sessionId !== expectedSessionId) return "Recovery belongs to a different DAW session.";
  if (!(row.blob instanceof Blob) || row.blob.size < 44 || row.blob.size > TIMELINE_DAW_MAX_RECOVERY_BYTES) return "Recovery WAV is empty, corrupt, or too large.";
  if (typeof row.fileName !== "string" || !row.fileName.toLowerCase().endsWith(".wav")) return "Recovery filename is invalid.";
  if (!row.plan || typeof row.plan !== "object") return "Recovery recording plan is invalid.";
  if (typeof row.savedAt !== "string" || !Number.isFinite(Date.parse(row.savedAt))) return "Recovery timestamp is invalid.";
  return null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "sessionId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Private recovery storage could not open."));
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode), request = action(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Private recovery storage failed."));
    tx.oncomplete = () => database.close();
    tx.onerror = () => { database.close(); reject(tx.error ?? new Error("Private recovery transaction failed.")); };
  });
}

export async function saveTimelineDawRecordingRecovery(recovery: TimelineDawStoredRecordingRecovery): Promise<void> {
  if (recovery.file.size < 44 || recovery.file.size > TIMELINE_DAW_MAX_RECOVERY_BYTES) throw new Error("Recovery WAV exceeds the private 500 MB browser limit.");
  const row: StoredRow = { ...recovery, blob: recovery.file, fileName: recovery.file.name, fileType: recovery.file.type, lastModified: recovery.file.lastModified };
  await transaction("readwrite", (store) => store.put(row));
}

export async function loadTimelineDawRecordingRecovery(sessionId: string): Promise<{ recovery: TimelineDawStoredRecordingRecovery | null; warning: string | null }> {
  const row = await transaction<StoredRow | undefined>("readonly", (store) => store.get(sessionId));
  if (!row) return { recovery: null, warning: null };
  const warning = validateTimelineDawStoredRecovery(row, sessionId);
  if (warning) { await deleteTimelineDawRecordingRecovery(sessionId); return { recovery: null, warning }; }
  return { recovery: { sessionId, file: new File([row.blob], row.fileName, { type: row.fileType || "audio/wav", lastModified: row.lastModified }), plan: row.plan, uploaded: row.uploaded, failure: row.failure, savedAt: row.savedAt }, warning: null };
}

export async function deleteTimelineDawRecordingRecovery(sessionId: string): Promise<void> {
  await transaction("readwrite", (store) => store.delete(sessionId));
}
