export type TimelineDawTakeReview = {
  name: string;
  notes: string;
  rating: number;
};

export function parseTimelineDawTakeReview(value: unknown): TimelineDawTakeReview {
  if (!value || typeof value !== "object") throw new Error("Take review is required.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const rating = input.rating;
  if (!name || name.length > 120) throw new Error("Take name must contain 1 to 120 characters.");
  if (notes.length > 1_000) throw new Error("Take notes cannot exceed 1000 characters.");
  if (!Number.isInteger(rating) || Number(rating) < 0 || Number(rating) > 5) {
    throw new Error("Take rating must be an integer from 0 to 5.");
  }
  return { name, notes, rating: Number(rating) };
}
