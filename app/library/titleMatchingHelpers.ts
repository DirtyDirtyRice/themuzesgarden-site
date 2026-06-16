function splitTitleWords(value: string): string[] {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function isDetailWord(word: string): boolean {
  const normalized = word.toLowerCase();

  return [
    "suno",
    "udio",
    "mp3",
    "wav",
    "stem",
    "stems",
    "instrumental",
    "novocal",
    "no",
    "vocal",
    "keeper",
    "keeper1",
    "keeper2",
    "rock",
    "funk",
    "jazz",
    "blues",
    "country",
    "pop",
    "mix",
    "master",
    "demo",
    "final",
    "version",
    "take",
    "render",
  ].includes(normalized);
}

function isLikelyExtraCodeWord(word: string): boolean {
  const normalized = word.toLowerCase();

  return normalized.length >= 3 && /^[a-z]+$/.test(normalized);
}

export function getCleanLibraryTrackTitle(fullTitle: string): string {
  const words = splitTitleWords(fullTitle);

  if (words.length === 0) return "Untitled track";

  const titleWords: string[] = [];

  for (const word of words) {
    if (isDetailWord(word)) break;

    if (titleWords.length >= 2 && isLikelyExtraCodeWord(word)) {
      break;
    }

    titleWords.push(word);
  }

  if (titleWords.length === 0) return fullTitle.trim() || "Untitled track";

  return titleWords.join(" ");
}

export function hasDifferentFullTitle(fullTitle: string, cleanTitle: string): boolean {
  return fullTitle.trim() !== cleanTitle.trim();
}