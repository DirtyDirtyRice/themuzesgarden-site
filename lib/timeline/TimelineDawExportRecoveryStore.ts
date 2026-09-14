const DATABASE = "muzes-daw-export-recovery";
const STORE = "drafts";
const MAX_FILE_BYTES = 256 * 1024 * 1024;

export type TimelineDawExportRecovery = {
  sessionId: string;
  files: File[];
  savedAt: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "sessionId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Export recovery storage could not open."));
  });
}

export function validateTimelineDawExportRecovery(value: unknown, sessionId: string): TimelineDawExportRecovery | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<TimelineDawExportRecovery>;
  if (row.sessionId !== sessionId || !Array.isArray(row.files) || !row.files.length || !row.savedAt || !Number.isFinite(Date.parse(row.savedAt))) return null;
  if (row.files.some((file) => !(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES || !/\.(wav|mp3)$/i.test(file.name))) return null;
  return row as TimelineDawExportRecovery;
}

export async function loadTimelineDawExportRecovery(sessionId: string): Promise<TimelineDawExportRecovery | null> {
  const database = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).get(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return validateTimelineDawExportRecovery(value, sessionId);
  } finally { database.close(); }
}

export async function saveTimelineDawExportRecovery(value: TimelineDawExportRecovery): Promise<void> {
  if (!validateTimelineDawExportRecovery(value, value.sessionId)) throw new Error("Only valid WAV or MP3 files up to 256 MB can be protected for export recovery.");
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}

export async function deleteTimelineDawExportRecovery(sessionId: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}
