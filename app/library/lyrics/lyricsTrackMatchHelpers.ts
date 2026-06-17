import type { LyricEntry } from "./lyricsTypes";

export type LyricTitleMatch = {
  entry: LyricEntry;
  score: number;
};

export function normalizeLyricMatchTitle(value: string): string {
  return value.trim().toLowerCase();
}

function isStarterLyricMatchEntry(entry: LyricEntry): boolean {
  return entry.id.startsWith("starter-");
}

export function getLyricTitleMatchScore(
  trackTitle: string,
  lyricTitle: string
): number {
  const track = normalizeLyricMatchTitle(trackTitle);
  const lyric = normalizeLyricMatchTitle(lyricTitle);

  if (!track || !lyric) return 0;
  if (track === lyric) return 100;
  if (track.includes(lyric) || lyric.includes(track)) return 80;

  const trackWords = track.split(/\s+/).filter(Boolean);
  const lyricWords = lyric.split(/\s+/).filter(Boolean);

  if (trackWords.length === 0 || lyricWords.length === 0) return 0;

  const sharedWords = trackWords.filter((word) => lyricWords.includes(word));

  return Math.round((sharedWords.length / trackWords.length) * 60);
}

export function findExactLyricTitleMatch(
  entries: LyricEntry[],
  trackTitle: string
): LyricEntry | null {
  const normalizedTrackTitle = normalizeLyricMatchTitle(trackTitle);

  if (!normalizedTrackTitle) return null;

  const exactMatches = entries.filter(
    (entry) => normalizeLyricMatchTitle(entry.title) === normalizedTrackTitle
  );

  if (exactMatches.length === 0) return null;

  const realExactMatch = exactMatches.find(
    (entry) => !isStarterLyricMatchEntry(entry)
  );

  return realExactMatch || exactMatches[0] || null;
}

export function findPossibleLyricTitleMatches(
  entries: LyricEntry[],
  trackTitle: string,
  limit = 6
): LyricTitleMatch[] {
  return entries
    .map((entry) => ({
      entry,
      score: getLyricTitleMatchScore(trackTitle, entry.title),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      if (
        isStarterLyricMatchEntry(first.entry) &&
        !isStarterLyricMatchEntry(second.entry)
      ) {
        return 1;
      }

      if (
        !isStarterLyricMatchEntry(first.entry) &&
        isStarterLyricMatchEntry(second.entry)
      ) {
        return -1;
      }

      return 0;
    })
    .slice(0, limit);
}