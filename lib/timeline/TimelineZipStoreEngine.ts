import { createHash } from "node:crypto";

export type TimelineZipEntry = {
  name: string;
  bytes: Uint8Array;
  checksum: string;
};

export type TimelineZipArchive = {
  bytes: Uint8Array;
  byteLength: number;
  checksum: string;
  entries: Array<{ name: string; byteLength: number; checksum: string }>;
};

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffff_ffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb8_8320 : 0);
    }
  }
  return (crc ^ 0xffff_ffff) >>> 0;
}

function safeName(value: string): string {
  const normalized = value.trim().replace(/\\/g, "/");
  if (
    !normalized
    || normalized.length > 240
    || normalized.startsWith("/")
    || normalized.includes("../")
    || normalized.includes("\0")
  ) {
    throw new Error("ZIP entry name is unsafe.");
  }
  return normalized;
}

export class TimelineZipStoreEngine {
  create(entries: Array<{ name: string; bytes: Uint8Array }>): TimelineZipArchive {
    if (!entries.length) throw new Error("ZIP package requires at least one entry.");
    const names = new Set<string>();
    const prepared: Array<TimelineZipEntry & { nameBytes: Uint8Array; crc: number; offset: number }> = [];
    let localBytes = 0;
    for (const entry of entries) {
      const name = safeName(entry.name);
      if (names.has(name)) throw new Error(`ZIP package contains duplicate entry ${name}.`);
      names.add(name);
      if (!(entry.bytes instanceof Uint8Array) || !entry.bytes.byteLength) {
        throw new Error(`ZIP entry ${name} has no bytes.`);
      }
      const nameBytes = encoder.encode(name);
      const checksum = `sha256:${createHash("sha256").update(entry.bytes).digest("hex")}`;
      prepared.push({
        name,
        bytes: entry.bytes,
        checksum,
        nameBytes,
        crc: crc32(entry.bytes),
        offset: localBytes,
      });
      localBytes += 30 + nameBytes.length + entry.bytes.length;
    }
    const centralBytes = prepared.reduce(
      (total, entry) => total + 46 + entry.nameBytes.length,
      0,
    );
    const totalBytes = localBytes + centralBytes + 22;
    if (totalBytes > 0xffff_ffff) throw new Error("ZIP package exceeds the classic ZIP size limit.");
    const output = new Uint8Array(totalBytes);
    const view = new DataView(output.buffer);
    let cursor = 0;
    for (const entry of prepared) {
      view.setUint32(cursor, 0x04034b50, true);
      view.setUint16(cursor + 4, 20, true);
      view.setUint16(cursor + 6, 0x0800, true);
      view.setUint16(cursor + 8, 0, true);
      view.setUint32(cursor + 14, entry.crc, true);
      view.setUint32(cursor + 18, entry.bytes.length, true);
      view.setUint32(cursor + 22, entry.bytes.length, true);
      view.setUint16(cursor + 26, entry.nameBytes.length, true);
      output.set(entry.nameBytes, cursor + 30);
      output.set(entry.bytes, cursor + 30 + entry.nameBytes.length);
      cursor += 30 + entry.nameBytes.length + entry.bytes.length;
    }
    const centralOffset = cursor;
    for (const entry of prepared) {
      view.setUint32(cursor, 0x02014b50, true);
      view.setUint16(cursor + 4, 20, true);
      view.setUint16(cursor + 6, 20, true);
      view.setUint16(cursor + 8, 0x0800, true);
      view.setUint16(cursor + 10, 0, true);
      view.setUint32(cursor + 16, entry.crc, true);
      view.setUint32(cursor + 20, entry.bytes.length, true);
      view.setUint32(cursor + 24, entry.bytes.length, true);
      view.setUint16(cursor + 28, entry.nameBytes.length, true);
      view.setUint32(cursor + 42, entry.offset, true);
      output.set(entry.nameBytes, cursor + 46);
      cursor += 46 + entry.nameBytes.length;
    }
    view.setUint32(cursor, 0x06054b50, true);
    view.setUint16(cursor + 8, prepared.length, true);
    view.setUint16(cursor + 10, prepared.length, true);
    view.setUint32(cursor + 12, centralBytes, true);
    view.setUint32(cursor + 16, centralOffset, true);
    return {
      bytes: output,
      byteLength: output.byteLength,
      checksum: `sha256:${createHash("sha256").update(output).digest("hex")}`,
      entries: prepared.map((entry) => ({
        name: entry.name,
        byteLength: entry.bytes.byteLength,
        checksum: entry.checksum,
      })),
    };
  }
}
