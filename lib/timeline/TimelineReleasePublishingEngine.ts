import { TimelineMasteringEngine } from "./TimelineMasteringEngine";
import { TimelineRightsProvenanceEngine } from "./TimelineRightsProvenanceEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineReleaseMetadata = {
  title: string;
  primaryArtist: string;
  writers: string[];
  releaseDate: string;
  language: string;
  explicit: boolean;
  isrc?: string;
  upc?: string;
  copyrightLine: string;
  productionLine: string;
};

export type TimelineReleaseArtwork = {
  uri: string;
  fingerprint: string;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png";
};

export type TimelineReleaseDestination = {
  id: TimelineId;
  kind: "garden" | "dsp" | "download";
  name: string;
  territories: string[];
  status: "pending" | "published" | "failed";
  externalReleaseId?: string;
  publishedAt?: string;
  error?: string;
};

export type TimelineReleasePackage = {
  id: TimelineId;
  projectId: TimelineId;
  masteringJobId: TimelineId;
  masterFingerprint: string;
  rightsRecordIds: TimelineId[];
  metadata: TimelineReleaseMetadata;
  artwork: TimelineReleaseArtwork;
  destinations: TimelineReleaseDestination[];
  status: "held" | "ready" | "publishing" | "published" | "failed" | "withdrawn";
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  publishedAt?: string;
};

export type TimelineReleaseReceipt = {
  id: TimelineId;
  packageId: TimelineId;
  action:
    | "created"
    | "blocked"
    | "approved"
    | "destination-published"
    | "destination-failed"
    | "published"
    | "withdrawn";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineReleasePublishingArchive = {
  packages: TimelineReleasePackage[];
  receipts: TimelineReleaseReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineReleasePublishingEngine {
  private readonly packages = new Map<TimelineId, TimelineReleasePackage>();
  private readonly receipts: TimelineReleaseReceipt[] = [];
  private packageSequence = 0;
  private destinationSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly mastering = new TimelineMasteringEngine(),
    readonly rights = new TimelineRightsProvenanceEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createPackage(input: {
    projectId: TimelineId;
    masteringJobId: TimelineId;
    rightsRecordIds: TimelineId[];
    metadata: TimelineReleaseMetadata;
    artwork: TimelineReleaseArtwork;
    destinations: Array<
      Omit<
        TimelineReleaseDestination,
        "id" | "status" | "externalReleaseId" | "publishedAt" | "error"
      >
    >;
    createdBy: TimelineUserId;
  }): TimelineReleasePackage {
    const master = this.mastering.getJob(input.masteringJobId);
    if (
      !master ||
      master.status !== "delivered" ||
      !master.outputFingerprint ||
      !master.outputUri
    ) {
      throw new Error("Publishing requires a delivered mastered artifact.");
    }
    const destinations = input.destinations.map((destination) => ({
      ...clone(destination),
      id: `timeline-release-destination-${++this.destinationSequence}`,
      name: destination.name.trim(),
      territories: [...new Set(destination.territories.map((item) => item.trim().toUpperCase()))],
      status: "pending" as const,
    }));
    const release: TimelineReleasePackage = {
      id: `timeline-release-package-${++this.packageSequence}`,
      projectId: input.projectId,
      masteringJobId: master.id,
      masterFingerprint: master.outputFingerprint,
      rightsRecordIds: [...new Set(input.rightsRecordIds)],
      metadata: this.normalizeMetadata(input.metadata),
      artwork: clone(input.artwork),
      destinations,
      status: "held",
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    const issues = this.inspect(release);
    release.issues = issues;
    this.packages.set(release.id, clone(release));
    this.record(
      release.id,
      issues.length ? "blocked" : "created",
      issues.length
        ? issues.join(" ")
        : "Release package held for human approval.",
      input.createdBy,
    );
    return clone(release);
  }

  approve(input: {
    packageId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineReleasePackage {
    const release = this.required(input.packageId);
    if (release.status !== "held") {
      throw new Error("Only a held release package can be approved.");
    }
    const issues = this.inspect(release);
    if (issues.length) {
      const blocked = this.save({ ...release, issues });
      this.record(
        release.id,
        "blocked",
        issues.join(" "),
        input.approvedBy,
      );
      return blocked;
    }
    const ready = this.save({
      ...release,
      status: "ready",
      issues: [],
      approvedAt: this.now().toISOString(),
      approvedBy: input.approvedBy,
    });
    this.record(
      release.id,
      "approved",
      "Human approved the cleared release package.",
      input.approvedBy,
    );
    return ready;
  }

  beginPublishing(input: {
    packageId: TimelineId;
    requestedBy: TimelineUserId;
  }): TimelineReleasePackage {
    const release = this.required(input.packageId);
    if (release.status !== "ready") {
      throw new Error("Only an approved release package can publish.");
    }
    const issues = this.inspect(release);
    if (issues.length) {
      return this.save({ ...release, status: "held", issues });
    }
    return this.save({ ...release, status: "publishing" });
  }

  recordDestination(input: {
    packageId: TimelineId;
    destinationId: TimelineId;
    outcome: "published" | "failed";
    externalReleaseId?: string;
    error?: string;
    recordedBy: string;
  }): TimelineReleasePackage {
    const release = this.required(input.packageId);
    if (release.status !== "publishing") {
      throw new Error("Release package is not publishing.");
    }
    const current = release.destinations.find(
      (destination) => destination.id === input.destinationId,
    );
    if (!current) throw new Error("Release destination was not found.");
    if (current.status !== "pending") {
      throw new Error("Release destination already has a final result.");
    }
    if (input.outcome === "published" && !input.externalReleaseId?.trim()) {
      throw new Error("Published destination requires an external release ID.");
    }
    if (input.outcome === "failed" && !input.error?.trim()) {
      throw new Error("Failed destination requires an error message.");
    }
    const destinations = release.destinations.map((destination) =>
      destination.id === current.id
        ? {
            ...destination,
            status: input.outcome,
            externalReleaseId: input.externalReleaseId?.trim(),
            publishedAt:
              input.outcome === "published"
                ? this.now().toISOString()
                : undefined,
            error: input.error?.trim(),
          }
        : destination,
    );
    const hasPending = destinations.some(
      (destination) => destination.status === "pending",
    );
    const hasFailure = destinations.some(
      (destination) => destination.status === "failed",
    );
    const status = hasPending
      ? "publishing"
      : hasFailure
        ? "failed"
        : "published";
    const next = this.save({
      ...release,
      destinations,
      status,
      publishedAt:
        status === "published" ? this.now().toISOString() : undefined,
    });
    this.record(
      release.id,
      input.outcome === "published"
        ? "destination-published"
        : "destination-failed",
      input.outcome === "published"
        ? `${current.name} accepted the release.`
        : `${current.name}: ${input.error!.trim()}`,
      input.recordedBy,
    );
    if (status === "published") {
      this.record(
        release.id,
        "published",
        "Every release destination completed successfully.",
        input.recordedBy,
      );
    }
    return next;
  }

  withdraw(input: {
    packageId: TimelineId;
    withdrawnBy: TimelineUserId;
    reason: string;
  }): TimelineReleasePackage {
    const release = this.required(input.packageId);
    if (release.status === "withdrawn") {
      throw new Error("Release package is already withdrawn.");
    }
    if (!input.reason.trim()) {
      throw new Error("Release withdrawal requires a reason.");
    }
    const withdrawn = this.save({ ...release, status: "withdrawn" });
    this.record(
      release.id,
      "withdrawn",
      input.reason.trim(),
      input.withdrawnBy,
    );
    return withdrawn;
  }

  getPackage(packageId: TimelineId): TimelineReleasePackage | null {
    const release = this.packages.get(packageId);
    return release ? clone(release) : null;
  }

  listPackages(projectId?: TimelineId): TimelineReleasePackage[] {
    return [...this.packages.values()]
      .filter((release) => !projectId || release.projectId === projectId)
      .map(clone);
  }

  listReceipts(packageId?: TimelineId): TimelineReleaseReceipt[] {
    return this.receipts
      .filter((receipt) => !packageId || receipt.packageId === packageId)
      .map(clone);
  }

  exportArchive(): TimelineReleasePublishingArchive {
    return {
      packages: [...this.packages.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineReleasePublishingArchive): void {
    this.assertUnique(archive.packages, "package");
    this.assertUnique(archive.receipts, "receipt");
    const packageIds = new Set(archive.packages.map((release) => release.id));
    if (archive.receipts.some((receipt) => !packageIds.has(receipt.packageId))) {
      throw new Error("Release receipt references a missing package.");
    }
    this.packages.clear();
    this.receipts.length = 0;
    archive.packages.forEach((release) =>
      this.packages.set(release.id, clone(release)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.packageSequence = Math.max(
      0,
      ...archive.packages.map((release) => sequence(release.id)),
    );
    this.destinationSequence = Math.max(
      0,
      ...archive.packages
        .flatMap((release) => release.destinations)
        .map((destination) => sequence(destination.id)),
    );
    this.receiptSequence = Math.max(
      0,
      ...archive.receipts.map((receipt) => sequence(receipt.id)),
    );
  }

  private normalizeMetadata(
    metadata: TimelineReleaseMetadata,
  ): TimelineReleaseMetadata {
    return {
      ...clone(metadata),
      title: metadata.title.trim(),
      primaryArtist: metadata.primaryArtist.trim(),
      writers: [...new Set(metadata.writers.map((writer) => writer.trim()).filter(Boolean))],
      releaseDate: metadata.releaseDate.trim(),
      language: metadata.language.trim().toLowerCase(),
      isrc: metadata.isrc?.replace(/[-\s]/g, "").toUpperCase(),
      upc: metadata.upc?.replace(/\s/g, ""),
      copyrightLine: metadata.copyrightLine.trim(),
      productionLine: metadata.productionLine.trim(),
    };
  }

  private inspect(release: TimelineReleasePackage): string[] {
    const issues: string[] = [];
    const master = this.mastering.getJob(release.masteringJobId);
    if (
      !master ||
      master.status !== "delivered" ||
      master.outputFingerprint !== release.masterFingerprint
    ) {
      issues.push("Delivered master identity no longer matches.");
    }
    if (!release.rightsRecordIds.length) {
      issues.push("At least one rights record is required.");
    }
    release.rightsRecordIds.forEach((recordId) => {
      const record = this.rights.getRecord(recordId);
      if (!record || record.projectId !== release.projectId) {
        issues.push(`Rights record ${recordId} is missing or belongs elsewhere.`);
      } else if (record.state !== "cleared") {
        issues.push(`Rights record ${recordId} is not cleared.`);
      }
    });
    const metadata = release.metadata;
    if (!metadata.title) issues.push("Release title is required.");
    if (!metadata.primaryArtist) issues.push("Primary artist is required.");
    if (!metadata.writers.length) issues.push("At least one writer is required.");
    if (!metadata.language) issues.push("Release language is required.");
    if (!metadata.copyrightLine) issues.push("Copyright line is required.");
    if (!metadata.productionLine) issues.push("Production line is required.");
    const releaseTime = Date.parse(metadata.releaseDate);
    if (!Number.isFinite(releaseTime)) issues.push("Release date is invalid.");
    if (metadata.isrc && !/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(metadata.isrc)) {
      issues.push("ISRC must contain a valid 12-character code.");
    }
    if (metadata.upc && !/^\d{12,13}$/.test(metadata.upc)) {
      issues.push("UPC must contain 12 or 13 digits.");
    }
    const artwork = release.artwork;
    if (!artwork.uri.trim()) issues.push("Artwork URI is required.");
    if (!artwork.fingerprint.trim()) issues.push("Artwork fingerprint is required.");
    if (artwork.width < 3000 || artwork.height < 3000) {
      issues.push("Release artwork must be at least 3000 by 3000 pixels.");
    }
    if (artwork.width !== artwork.height) {
      issues.push("Release artwork must be square.");
    }
    if (!release.destinations.length) {
      issues.push("At least one release destination is required.");
    }
    release.destinations.forEach((destination) => {
      if (!destination.name) issues.push("Release destination name is required.");
      if (!destination.territories.length) {
        issues.push(`${destination.name || "Destination"} requires territories.`);
      }
    });
    return [...new Set(issues)];
  }

  private required(packageId: TimelineId): TimelineReleasePackage {
    const release = this.packages.get(packageId);
    if (!release) throw new Error("Release package was not found.");
    return release;
  }

  private save(release: TimelineReleasePackage): TimelineReleasePackage {
    this.packages.set(release.id, clone(release));
    return clone(release);
  }

  private record(
    packageId: TimelineId,
    action: TimelineReleaseReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-release-receipt-${++this.receiptSequence}`,
      packageId,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private assertUnique(
    values: Array<{ id: TimelineId }>,
    label: string,
  ): void {
    if (new Set(values.map((value) => value.id)).size !== values.length) {
      throw new Error(`Archive contains duplicate release ${label} IDs.`);
    }
  }
}
