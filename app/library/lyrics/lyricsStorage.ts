import { STARTER_LYRICS } from "./lyricsSeed";
import type { LyricEntry } from "./lyricsTypes";

export const LYRICS_STORAGE_KEY = "muzesgarden.library.lyrics.v2";
export const LYRICS_INDEXED_DB_NAME = "muzesgarden-library-lyrics-db";
export const LYRICS_INDEXED_DB_STORE = "lyrics";
export const LYRICS_INDEXED_DB_VERSION = 1;

export function normalizeEntry(entry: Partial<LyricEntry>): LyricEntry {
  const now = new Date().toLocaleString();

  return {
    id: entry.id || `lyric-${Date.now()}`,
    title: entry.title || "Untitled Lyrics",
    artist: entry.artist || "",
    tags: entry.tags || "",
    body: entry.body || "",
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt || entry.createdAt || now,
  };
}

function openLyricsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      LYRICS_INDEXED_DB_NAME,
      LYRICS_INDEXED_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(LYRICS_INDEXED_DB_STORE)) {
        database.createObjectStore(LYRICS_INDEXED_DB_STORE, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Could not open lyrics database."));
    };
  });
}

export async function getStartingLyrics(): Promise<LyricEntry[]> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return STARTER_LYRICS;
  }

  try {
    const database = await openLyricsDatabase();

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        LYRICS_INDEXED_DB_STORE,
        "readonly"
      );
      const store = transaction.objectStore(LYRICS_INDEXED_DB_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as Partial<LyricEntry>[];

        if (!entries || entries.length === 0) {
          resolve(STARTER_LYRICS);
          return;
        }

        resolve(entries.map(normalizeEntry));
      };

      request.onerror = () => {
        reject(new Error("Could not read lyrics database."));
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  } catch {
    return STARTER_LYRICS;
  }
}

export async function saveLyricsToBrowser(
  entries: LyricEntry[]
): Promise<boolean> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return false;
  }

  try {
    const database = await openLyricsDatabase();

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        LYRICS_INDEXED_DB_STORE,
        "readwrite"
      );
      const store = transaction.objectStore(LYRICS_INDEXED_DB_STORE);

      store.clear();

      entries.forEach((entry) => {
        store.put(normalizeEntry(entry));
      });

      transaction.oncomplete = () => {
        database.close();
        resolve(true);
      };

      transaction.onerror = () => {
        database.close();
        reject(new Error("Could not save lyrics database."));
      };
    });
  } catch {
    return false;
  }
}