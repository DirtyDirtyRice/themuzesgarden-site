export type TimelineDawTakeCompPromotion = {
  compId: string;
  renderUri: string;
  renderChecksum: string;
  sourceName: string;
};

export function parseTimelineDawTakeCompPromotion(value: unknown): TimelineDawTakeCompPromotion {
  if (!value || typeof value !== "object") throw new Error("Comp promotion is required.");
  const input = value as Record<string, unknown>;
  const compId = typeof input.compId === "string" ? input.compId.trim() : "";
  const renderUri = typeof input.renderUri === "string" ? input.renderUri.trim() : "";
  const renderChecksum = typeof input.renderChecksum === "string" ? input.renderChecksum.trim().toLowerCase() : "";
  const promotedRenderChecksum = typeof input.promotedRenderChecksum === "string"
    ? input.promotedRenderChecksum.trim().toLowerCase()
    : "";
  const promotedSourceUri = typeof input.promotedSourceUri === "string" ? input.promotedSourceUri.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!compId) throw new Error("Comp ID is required for promotion.");
  if (!renderUri) throw new Error("A completed comp render is required for promotion.");
  if (!/^sha256:[a-f0-9]{64}$/.test(renderChecksum)) throw new Error("Comp render checksum is invalid.");
  if (promotedSourceUri && promotedRenderChecksum === renderChecksum) {
    throw new Error("This comp render is already promoted to the timeline source workflow.");
  }
  const safeName = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "take-comp";
  return {
    compId,
    renderUri,
    renderChecksum,
    sourceName: `${safeName}-promoted.wav`,
  };
}
