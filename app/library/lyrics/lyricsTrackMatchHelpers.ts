import type { LyricEntry } from "./lyricsTypes";

export type LyricTitleMatch = {
  entry: LyricEntry;
  score: number;
};

export function normalizeLyricMatchTitle(value: string): string {
  return value.trim().toLowerCase();
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

  return (
    entries.find(
      (entry) => normalizeLyricMatchTitle(entry.title) === normalizedTrackTitle
    ) || null
  );
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
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
}