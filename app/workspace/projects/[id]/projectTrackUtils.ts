export function safeTrackId(value: unknown): string {
  return String(value ?? "").trim();
}

export function safeText(value: unknown, fallback = ""): string {
  const v = String(value ?? "").trim();
  return v || fallback;
}