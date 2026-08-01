import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TimelineZipStoreEngine } from "../../lib/timeline/TimelineZipStoreEngine";

describe("TimelineZipStoreEngine", () => {
  it("creates deterministic stored ZIP entries and fingerprints exact bytes", () => {
    const archive = new TimelineZipStoreEngine().create([
      { name: "stems/vocal.wav", bytes: new Uint8Array([1, 2, 3]) },
      { name: "stems/drums.wav", bytes: new Uint8Array([4, 5]) },
    ]);
    const view = new DataView(archive.bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(archive.bytes.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(archive.bytes.length - 12, true)).toBe(2);
    expect(archive.entries.map((entry) => entry.name)).toEqual([
      "stems/vocal.wav", "stems/drums.wav",
    ]);
    expect(archive.checksum).toBe(
      `sha256:${createHash("sha256").update(archive.bytes).digest("hex")}`,
    );
  });
  it("rejects unsafe, duplicate, and empty entries", () => {
    const zip = new TimelineZipStoreEngine();
    expect(() => zip.create([{ name: "../secret", bytes: new Uint8Array([1]) }])).toThrow(/unsafe/i);
    expect(() => zip.create([
      { name: "one.wav", bytes: new Uint8Array([1]) },
      { name: "one.wav", bytes: new Uint8Array([2]) },
    ])).toThrow(/duplicate/i);
    expect(() => zip.create([{ name: "empty.wav", bytes: new Uint8Array() }])).toThrow(/no bytes/i);
  });
});
