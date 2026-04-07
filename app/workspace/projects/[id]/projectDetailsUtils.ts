import type { LoopMode, ProjectKind } from "./projectDetailsTypes";

export type PersistLoopMode = "off" | "one" | "all";

export function formatKind(kind: ProjectKind) {
  switch (kind) {
    case "music":
      return "Music";
    case "education":
      return "Education";
    case "game":
      return "Game";
    case "experiment":
      return "Experiment";
    case "collab":
      return "Collaboration";
    default:
      return "Project";
  }
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function looksLikeUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export function firstLine(s: string) {
  const line = (s ?? "").replace(/\r/g, "").split("\n")[0] ?? "";
  return line.trim();
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function clamp01(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

export function fmtTime(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const s = Math.floor(secs);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function nextLoopMode(m: LoopMode): LoopMode {
  if (m === "off") return "track";
  if (m === "track") return "setlist";
  return "off";
}

export function toPersistLoopMode(m: LoopMode): PersistLoopMode {
  if (m === "track") return "one";
  if (m === "setlist") return "all";
  return "off";
}

export function fromPersistLoopMode(m: PersistLoopMode): LoopMode {
  if (m === "one") return "track";
  if (m === "all") return "setlist";
  return "off";
}

export function shuffled<T>(arr: T[]) {
  const a = arr.slice();

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }

  return a;
}

export function buildShuffleOrder(ids: string[], keepFirstId?: string | null) {
  const unique = Array.from(new Set(ids.map(String)));
  if (!unique.length) return [];

  const keep = keepFirstId ? String(keepFirstId) : null;

  if (!keep || !unique.includes(keep)) {
    return shuffled(unique);
  }

  const rest = unique.filter((x) => x !== keep);
  return [keep, ...shuffled(rest)];
}