function normalizeNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeText(value: unknown): string | null {
  const s = String(value ?? "").trim()
  return s ? s : null
}

export { normalizeNumber, normalizeText }