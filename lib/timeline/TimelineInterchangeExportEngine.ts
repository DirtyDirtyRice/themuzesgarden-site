import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineInterchangeFormat =
  | "aaf"
  | "omf"
  | "ableton"
  | "pro-tools"
  | "stems"
  | "midi"
  | "archive";

export type TimelineExportAssetRole =
  | "audio"
  | "midi"
  | "session"
  | "metadata"
  | "lyrics"
  | "artwork"
  | "manifest";

export type TimelineExportAsset = {
  id: TimelineId;
  artifactId: TimelineId;
  role: TimelineExportAssetRole;
  path: string;
  format: string;
  mediaType: string;
  fingerprint: string;
  sizeBytes: number;
  durationMs?: number;
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
};

export type TimelineExportSpecification = {
  format: TimelineInterchangeFormat;
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  frameRate?: number;
  startTimecode: string;
  handleLengthMs: number;
  consolidateAudio: boolean;
  includeMedia: boolean;
  requiredRoles: TimelineExportAssetRole[];
};

export type TimelineInterchangePackage = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  destination: string;
  specification: TimelineExportSpecification;
  assets: TimelineExportAsset[];
  manifestFingerprint: string;
  revision: number;
  parentPackageId: TimelineId | null;
  status: "draft" | "held" | "verified" | "approved" | "delivered" | "rejected" | "archived";
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  verifiedAt?: string;
  verifiedBy?: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  deliveredAt?: string;
  deliveredBy?: TimelineUserId;
  deliveryReference?: string;
};

export type TimelineInterchangeReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  packageId: TimelineId;
  action:
    | "created"
    | "revised"
    | "held"
    | "verified"
    | "approved"
    | "delivered"
    | "rejected"
    | "archived";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineInterchangeExportArchive = {
  packages: TimelineInterchangePackage[];
  receipts: TimelineInterchangeReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function text(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function whole(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function fingerprint(value: unknown): string {
  let hash = 2166136261;
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `export-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineInterchangeExportEngine {
  private readonly packages = new Map<TimelineId, TimelineInterchangePackage>();
  private readonly receipts: TimelineInterchangeReceipt[] = [];
  private packageSequence = 0;
  private assetSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createPackage(input: {
    projectId: TimelineId;
    name: string;
    destination: string;
    specification: TimelineExportSpecification;
    assets: Array<Omit<TimelineExportAsset, "id">>;
    createdBy: TimelineUserId;
  }): TimelineInterchangePackage {
    const value: TimelineInterchangePackage = {
      id: `timeline-interchange-package-${++this.packageSequence}`,
      projectId: text(input.projectId, "Project ID"),
      name: text(input.name, "Export package name"),
      destination: text(input.destination, "Export destination"),
      specification: this.normalizeSpecification(input.specification),
      assets: input.assets.map((asset) => ({
        ...clone(asset),
        id: `timeline-export-asset-${++this.assetSequence}`,
        path: this.normalizePath(asset.path),
        format: text(asset.format, "Export asset format").toLowerCase(),
        mediaType: text(asset.mediaType, "Export asset media type").toLowerCase(),
        fingerprint: text(asset.fingerprint, "Export asset fingerprint"),
      })),
      manifestFingerprint: "",
      revision: 1,
      parentPackageId: null,
      status: "draft",
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    value.issues = this.inspect(value);
    value.manifestFingerprint = this.manifestFingerprint(value);
    this.packages.set(value.id, clone(value));
    this.record(
      value,
      "created",
      value.issues.length
        ? `Export draft contains ${value.issues.length} blocking issue(s).`
        : "Content-addressed export package created as a draft.",
      input.createdBy,
    );
    return clone(value);
  }

  revise(input: {
    packageId: TimelineId;
    specification?: TimelineExportSpecification;
    assets?: Array<Omit<TimelineExportAsset, "id">>;
    destination?: string;
    createdBy: TimelineUserId;
  }): TimelineInterchangePackage {
    const source = this.required(input.packageId);
    if (!["draft", "held", "verified", "approved", "delivered"].includes(source.status)) {
      throw new Error("This interchange package cannot be revised.");
    }
    const value: TimelineInterchangePackage = {
      ...source,
      id: `timeline-interchange-package-${++this.packageSequence}`,
      destination: input.destination
        ? text(input.destination, "Export destination")
        : source.destination,
      specification: input.specification
        ? this.normalizeSpecification(input.specification)
        : clone(source.specification),
      assets: input.assets
        ? input.assets.map((asset) => ({
            ...clone(asset),
            id: `timeline-export-asset-${++this.assetSequence}`,
            path: this.normalizePath(asset.path),
            format: text(asset.format, "Export asset format").toLowerCase(),
            mediaType: text(asset.mediaType, "Export asset media type").toLowerCase(),
            fingerprint: text(asset.fingerprint, "Export asset fingerprint"),
          }))
        : clone(source.assets),
      manifestFingerprint: "",
      revision: source.revision + 1,
      parentPackageId: source.id,
      status: "draft",
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
      verifiedAt: undefined,
      verifiedBy: undefined,
      approvedAt: undefined,
      approvedBy: undefined,
      deliveredAt: undefined,
      deliveredBy: undefined,
      deliveryReference: undefined,
    };
    value.issues = this.inspect(value);
    value.manifestFingerprint = this.manifestFingerprint(value);
    this.packages.set(value.id, clone(value));
    this.record(
      value,
      "revised",
      `Export revision ${value.revision} created without changing the prior package.`,
      input.createdBy,
    );
    return clone(value);
  }

  verify(input: {
    packageId: TimelineId;
    observedFingerprints: Record<TimelineId, string>;
    verifiedBy: TimelineUserId;
  }): TimelineInterchangePackage {
    const value = this.required(input.packageId);
    if (!["draft", "held"].includes(value.status)) {
      throw new Error("Only a draft or held interchange package can be verified.");
    }
    const issues = this.inspect(value);
    for (const asset of value.assets) {
      const observed = input.observedFingerprints[asset.id];
      if (!observed) issues.push(`Asset "${asset.path}" was not observed during verification.`);
      else if (observed !== asset.fingerprint) {
        issues.push(`Asset "${asset.path}" failed fingerprint verification.`);
      }
    }
    if (issues.length) {
      return this.update(
        { ...value, status: "held", issues: [...new Set(issues)] },
        "held",
        `Export package held: ${[...new Set(issues)].join(" ")}`,
        input.verifiedBy,
      );
    }
    return this.update(
      {
        ...value,
        status: "verified",
        issues: [],
        verifiedAt: this.now().toISOString(),
        verifiedBy: input.verifiedBy,
      },
      "verified",
      "Every export asset and manifest rule passed verification.",
      input.verifiedBy,
    );
  }

  approve(input: {
    packageId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineInterchangePackage {
    const value = this.required(input.packageId);
    if (value.status !== "verified") {
      throw new Error("Only a verified interchange package can be approved.");
    }
    if (value.createdBy === input.approvedBy) {
      throw new Error("Interchange export approval requires an independent reviewer.");
    }
    return this.update(
      {
        ...value,
        status: "approved",
        approvedAt: this.now().toISOString(),
        approvedBy: input.approvedBy,
      },
      "approved",
      "Independent human approved the verified export package.",
      input.approvedBy,
    );
  }

  deliver(input: {
    packageId: TimelineId;
    deliveryReference: string;
    deliveredBy: TimelineUserId;
  }): TimelineInterchangePackage {
    const value = this.required(input.packageId);
    if (value.status !== "approved") {
      throw new Error("Only an approved interchange package can be delivered.");
    }
    for (const current of this.packages.values()) {
      if (
        current.projectId === value.projectId &&
        current.destination === value.destination &&
        current.status === "delivered"
      ) {
        this.packages.set(current.id, clone({ ...current, status: "archived" as const }));
        this.record(current, "archived", "Superseded by a newer delivery.", input.deliveredBy);
      }
    }
    return this.update(
      {
        ...value,
        status: "delivered",
        deliveredAt: this.now().toISOString(),
        deliveredBy: input.deliveredBy,
        deliveryReference: text(input.deliveryReference, "Delivery reference"),
      },
      "delivered",
      "Approved interchange package delivered with a permanent reference.",
      input.deliveredBy,
    );
  }

  reject(input: {
    packageId: TimelineId;
    reason: string;
    rejectedBy: TimelineUserId;
  }): TimelineInterchangePackage {
    const value = this.required(input.packageId);
    if (!["held", "verified"].includes(value.status)) {
      throw new Error("Only a held or verified interchange package can be rejected.");
    }
    return this.update(
      { ...value, status: "rejected" },
      "rejected",
      text(input.reason, "Rejection reason"),
      input.rejectedBy,
    );
  }

  getPackage(id: TimelineId): TimelineInterchangePackage | null {
    const value = this.packages.get(id);
    return value ? clone(value) : null;
  }

  listPackages(projectId?: TimelineId): TimelineInterchangePackage[] {
    return [...this.packages.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  listReceipts(projectId?: TimelineId): TimelineInterchangeReceipt[] {
    return this.receipts
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineInterchangeExportArchive {
    return { packages: this.listPackages(), receipts: this.receipts.map(clone) };
  }

  restoreArchive(archive: TimelineInterchangeExportArchive): void {
    const ids = new Set<TimelineId>();
    const delivered = new Set<string>();
    this.packages.clear();
    this.receipts.length = 0;
    for (const value of archive.packages) {
      if (ids.has(value.id)) throw new Error("Duplicate interchange package ID.");
      ids.add(value.id);
      if (value.manifestFingerprint !== this.manifestFingerprint(value)) {
        throw new Error(`Interchange package ${value.id} manifest fingerprint is invalid.`);
      }
      if (value.status === "delivered") {
        const key = `${value.projectId}|${value.destination}`;
        if (delivered.has(key)) throw new Error("Destination has multiple current deliveries.");
        delivered.add(key);
      }
      this.packages.set(value.id, clone(value));
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.packageSequence = this.highest(archive.packages.map((value) => value.id));
    this.assetSequence = this.highest(
      archive.packages.flatMap((value) => value.assets.map((asset) => asset.id)),
    );
    this.receiptSequence = this.highest(archive.receipts.map((value) => value.id));
  }

  private inspect(value: TimelineInterchangePackage): string[] {
    const issues: string[] = [];
    if (!value.assets.length) issues.push("Export package requires at least one asset.");
    const paths = new Set<string>();
    const artifactIds = new Set<TimelineId>();
    for (const asset of value.assets) {
      text(asset.artifactId, "Artifact ID");
      text(asset.path, "Export path");
      text(asset.fingerprint, "Asset fingerprint");
      whole(asset.sizeBytes, 1, Number.MAX_SAFE_INTEGER, "Asset size");
      if (paths.has(asset.path.toLowerCase())) issues.push(`Duplicate export path "${asset.path}".`);
      paths.add(asset.path.toLowerCase());
      if (artifactIds.has(asset.artifactId)) {
        issues.push(`Artifact "${asset.artifactId}" appears more than once.`);
      }
      artifactIds.add(asset.artifactId);
      if (asset.role === "audio") {
        if (asset.sampleRate !== value.specification.sampleRate) {
          issues.push(`Audio asset "${asset.path}" has the wrong sample rate.`);
        }
        if (asset.bitDepth !== value.specification.bitDepth) {
          issues.push(`Audio asset "${asset.path}" has the wrong bit depth.`);
        }
        whole(asset.channels ?? 0, 1, 128, "Audio channels");
        whole(asset.durationMs ?? 0, 1, 86_400_000, "Audio duration");
      }
      if (value.specification.format === "omf" && asset.sizeBytes > 2_000_000_000) {
        issues.push(`OMF asset "${asset.path}" exceeds the 2 GB compatibility limit.`);
      }
    }
    for (const role of value.specification.requiredRoles) {
      if (!value.assets.some((asset) => asset.role === role)) {
        issues.push(`Required export role "${role}" is missing.`);
      }
    }
    if (!value.specification.includeMedia && value.assets.some((asset) => asset.role === "audio")) {
      issues.push("Audio media cannot be embedded when includeMedia is false.");
    }
    if (value.specification.format === "midi" && value.assets.some((asset) => asset.role === "audio")) {
      issues.push("MIDI interchange packages cannot contain audio assets.");
    }
    if (
      ["aaf", "omf", "ableton", "pro-tools"].includes(value.specification.format) &&
      !value.assets.some((asset) => asset.role === "session")
    ) {
      issues.push(`${value.specification.format.toUpperCase()} export requires a session asset.`);
    }
    return [...new Set(issues)];
  }

  private normalizeSpecification(
    specification: TimelineExportSpecification,
  ): TimelineExportSpecification {
    whole(specification.sampleRate, 8_000, 384_000, "Export sample rate");
    whole(specification.handleLengthMs, 0, 600_000, "Export handle length");
    text(specification.startTimecode, "Export start timecode");
    if (!/^\d{2}:\d{2}:\d{2}[:;]\d{2}$/.test(specification.startTimecode)) {
      throw new Error("Export start timecode must use HH:MM:SS:FF format.");
    }
    if (specification.frameRate !== undefined) {
      if (
        !Number.isFinite(specification.frameRate) ||
        specification.frameRate < 1 ||
        specification.frameRate > 240
      ) {
        throw new Error("Export frame rate must be from 1 to 240.");
      }
    }
    return {
      ...clone(specification),
      requiredRoles: [...new Set(specification.requiredRoles)],
    };
  }

  private normalizePath(path: string): string {
    const normalized = text(path, "Export path").replace(/\\/g, "/");
    if (
      normalized.startsWith("/") ||
      /^[A-Za-z]:\//.test(normalized) ||
      normalized.split("/").some((part) => part === ".." || part === "")
    ) {
      throw new Error("Export path must be relative and cannot traverse directories.");
    }
    return normalized;
  }

  private manifestFingerprint(value: TimelineInterchangePackage): string {
    return fingerprint({
      projectId: value.projectId,
      name: value.name,
      destination: value.destination,
      specification: value.specification,
      assets: value.assets,
      revision: value.revision,
      parentPackageId: value.parentPackageId,
    });
  }

  private required(id: TimelineId): TimelineInterchangePackage {
    const value = this.packages.get(id);
    if (!value) throw new Error(`Unknown interchange package: ${id}`);
    return clone(value);
  }

  private update(
    value: TimelineInterchangePackage,
    action: TimelineInterchangeReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): TimelineInterchangePackage {
    this.packages.set(value.id, clone(value));
    this.record(value, action, message, recordedBy);
    return clone(value);
  }

  private record(
    value: TimelineInterchangePackage,
    action: TimelineInterchangeReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.receipts.push({
      id: `timeline-interchange-receipt-${++this.receiptSequence}`,
      projectId: value.projectId,
      packageId: value.id,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private highest(ids: string[]): number {
    return ids.reduce(
      (highest, id) => Math.max(highest, Number(id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }
}
