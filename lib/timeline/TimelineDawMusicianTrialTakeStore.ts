const DATABASE = "muzes-daw-musician-trial";
const STORE = "takes";
const MAX_BYTES = 100 * 1024 * 1024;

export type TimelineDawMusicianTrialTake = { sessionId: string; wav: Blob; savedAt: string };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "sessionId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Trial recording storage could not open."));
  });
}

export function validateTimelineDawMusicianTrialTake(value: unknown, sessionId: string): TimelineDawMusicianTrialTake | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<TimelineDawMusicianTrialTake>;
  if (row.sessionId !== sessionId || !(row.wav instanceof Blob) || row.wav.type !== "audio/wav" || row.wav.size < 45 || row.wav.size > MAX_BYTES || !row.savedAt || !Number.isFinite(Date.parse(row.savedAt))) return null;
  return row as TimelineDawMusicianTrialTake;
}

export async function loadTimelineDawMusicianTrialTake(sessionId: string): Promise<TimelineDawMusicianTrialTake | null> {
  const database = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).get(sessionId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return validateTimelineDawMusicianTrialTake(value, sessionId);
  } finally { database.close(); }
}

export async function saveTimelineDawMusicianTrialTake(take: TimelineDawMusicianTrialTake): Promise<void> {
  if (!validateTimelineDawMusicianTrialTake(take, take.sessionId)) throw new Error("Trial WAV is invalid or larger than 100 MB.");
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).put(take);
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}

export async function deleteTimelineDawMusicianTrialTake(sessionId: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE, "readwrite").objectStore(STORE).delete(sessionId);
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}
