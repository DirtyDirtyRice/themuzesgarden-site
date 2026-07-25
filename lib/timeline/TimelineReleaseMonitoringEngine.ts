import { TimelineReleasePublishingEngine } from "./TimelineReleasePublishingEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineDestinationObservation = {
  destinationId: TimelineId;
  available: boolean;
  externalReleaseId: string;
  masterFingerprint: string;
  checkedAt: string;
};

export type TimelineReleaseIncident = {
  id: TimelineId;
  monitorId: TimelineId;
  kind:
    | "rights"
    | "availability"
    | "identity"
    | "destination"
    | "withdrawal";
  severity: "warning" | "critical";
  message: string;
  status: "open" | "resolved";
  openedAt: string;
  openedBy: string;
  resolvedAt?: string;
  resolvedBy?: TimelineUserId;
  resolution?: string;
};

export type TimelineReleaseMonitor = {
  id: TimelineId;
  packageId: TimelineId;
  projectId: TimelineId;
  status: "active" | "attention" | "recalling" | "recalled" | "archived";
  incidentIds: TimelineId[];
  lastCheckedAt?: string;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineRecallDestination = {
  destinationId: TimelineId;
  name: string;
  status: "pending" | "removed" | "failed";
  confirmationId?: string;
  error?: string;
  recordedAt?: string;
};

export type TimelineReleaseRecall = {
  id: TimelineId;
  monitorId: TimelineId;
  packageId: TimelineId;
  incidentId: TimelineId;
  reason: string;
  status: "held" | "approved" | "in-progress" | "completed" | "failed";
  destinations: TimelineRecallDestination[];
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
};

export type TimelineReleaseMonitoringReceipt = {
  id: TimelineId;
  monitorId: TimelineId;
  action:
    | "monitor-created"
    | "audit-passed"
    | "incident-opened"
    | "incident-resolved"
    | "recall-created"
    | "recall-approved"
    | "destination-removed"
    | "destination-failed"
    | "recall-completed";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineReleaseMonitoringArchive = {
  monitors: TimelineReleaseMonitor[];
  incidents: TimelineReleaseIncident[];
  recalls: TimelineReleaseRecall[];
  receipts: TimelineReleaseMonitoringReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineReleaseMonitoringEngine {
  private readonly monitors = new Map<TimelineId, TimelineReleaseMonitor>();
  private readonly incidents = new Map<TimelineId, TimelineReleaseIncident>();
  private readonly recalls = new Map<TimelineId, TimelineReleaseRecall>();
  private readonly receipts: TimelineReleaseMonitoringReceipt[] = [];
  private monitorSequence = 0;
  private incidentSequence = 0;
  private recallSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly publishing = new TimelineReleasePublishingEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createMonitor(input: {
    packageId: TimelineId;
    createdBy: TimelineUserId;
  }): TimelineReleaseMonitor {
    const release = this.publishing.getPackage(input.packageId);
    if (!release || release.status !== "published") {
      throw new Error("Monitoring requires a fully published release.");
    }
    if (
      [...this.monitors.values()].some(
        (monitor) =>
          monitor.packageId === release.id && monitor.status !== "archived",
      )
    ) {
      throw new Error("An active monitor already exists for this release.");
    }
    const monitor: TimelineReleaseMonitor = {
      id: `timeline-release-monitor-${++this.monitorSequence}`,
      packageId: release.id,
      projectId: release.projectId,
      status: "active",
      incidentIds: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.monitors.set(monitor.id, clone(monitor));
    this.record(
      monitor.id,
      "monitor-created",
      "Post-release monitoring started.",
      input.createdBy,
    );
    return clone(monitor);
  }

  audit(input: {
    monitorId: TimelineId;
    observations: TimelineDestinationObservation[];
    checkedBy: string;
  }): { monitor: TimelineReleaseMonitor; incidents: TimelineReleaseIncident[] } {
    const current = this.requiredMonitor(input.monitorId);
    if (!["active", "attention"].includes(current.status)) {
      throw new Error("Release monitor is not accepting audits.");
    }
    const release = this.publishing.getPackage(current.packageId);
    if (!release) throw new Error("Monitored release package was not found.");
    const issues: Array<{
      kind: TimelineReleaseIncident["kind"];
      severity: TimelineReleaseIncident["severity"];
      message: string;
    }> = [];
    if (release.status === "withdrawn") {
      issues.push({
        kind: "withdrawal",
        severity: "critical",
        message: "Published release package has been withdrawn.",
      });
    }
    release.rightsRecordIds.forEach((recordId) => {
      const record = this.publishing.rights.getRecord(recordId);
      if (!record || record.state !== "cleared") {
        issues.push({
          kind: "rights",
          severity: "critical",
          message: `Rights record ${recordId} is no longer cleared.`,
        });
      }
    });
    const observationMap = new Map(
      input.observations.map((observation) => [
        observation.destinationId,
        observation,
      ]),
    );
    release.destinations.forEach((destination) => {
      const observation = observationMap.get(destination.id);
      if (!observation) {
        issues.push({
          kind: "destination",
          severity: "warning",
          message: `${destination.name} did not return monitoring evidence.`,
        });
        return;
      }
      if (!observation.available) {
        issues.push({
          kind: "availability",
          severity: "critical",
          message: `${destination.name} reports the release unavailable.`,
        });
      }
      if (
        observation.externalReleaseId !== destination.externalReleaseId ||
        observation.masterFingerprint !== release.masterFingerprint
      ) {
        issues.push({
          kind: "identity",
          severity: "critical",
          message: `${destination.name} returned mismatched release identity.`,
        });
      }
    });
    const opened = issues.map((issue) =>
      this.openIncident(current.id, issue, input.checkedBy),
    );
    const monitor = this.saveMonitor({
      ...current,
      status: opened.length ? "attention" : "active",
      incidentIds: [
        ...current.incidentIds,
        ...opened.map((incident) => incident.id),
      ],
      lastCheckedAt: this.now().toISOString(),
    });
    if (!opened.length) {
      this.record(
        current.id,
        "audit-passed",
        "Every destination, identity, and rights record passed.",
        input.checkedBy,
      );
    }
    return { monitor, incidents: opened };
  }

  resolveIncident(input: {
    incidentId: TimelineId;
    resolvedBy: TimelineUserId;
    resolution: string;
  }): TimelineReleaseIncident {
    const incident = this.requiredIncident(input.incidentId);
    if (incident.status !== "open") {
      throw new Error("Release incident is already resolved.");
    }
    if (!input.resolution.trim()) {
      throw new Error("Incident resolution evidence is required.");
    }
    const resolved: TimelineReleaseIncident = {
      ...incident,
      status: "resolved",
      resolvedAt: this.now().toISOString(),
      resolvedBy: input.resolvedBy,
      resolution: input.resolution.trim(),
    };
    this.incidents.set(resolved.id, clone(resolved));
    const monitor = this.requiredMonitor(incident.monitorId);
    const stillOpen = monitor.incidentIds.some(
      (id) =>
        id !== incident.id && this.incidents.get(id)?.status === "open",
    );
    if (!stillOpen && monitor.status === "attention") {
      this.saveMonitor({ ...monitor, status: "active" });
    }
    this.record(
      monitor.id,
      "incident-resolved",
      input.resolution.trim(),
      input.resolvedBy,
    );
    return clone(resolved);
  }

  createRecall(input: {
    monitorId: TimelineId;
    incidentId: TimelineId;
    reason: string;
    createdBy: TimelineUserId;
  }): TimelineReleaseRecall {
    const monitor = this.requiredMonitor(input.monitorId);
    const incident = this.requiredIncident(input.incidentId);
    if (
      incident.monitorId !== monitor.id ||
      incident.status !== "open" ||
      incident.severity !== "critical"
    ) {
      throw new Error("Recall requires an open critical incident.");
    }
    if (!input.reason.trim()) {
      throw new Error("Recall reason is required.");
    }
    const release = this.publishing.getPackage(monitor.packageId);
    if (!release) throw new Error("Monitored release package was not found.");
    const recall: TimelineReleaseRecall = {
      id: `timeline-release-recall-${++this.recallSequence}`,
      monitorId: monitor.id,
      packageId: release.id,
      incidentId: incident.id,
      reason: input.reason.trim(),
      status: "held",
      destinations: release.destinations.map((destination) => ({
        destinationId: destination.id,
        name: destination.name,
        status: "pending",
      })),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.recalls.set(recall.id, clone(recall));
    this.record(
      monitor.id,
      "recall-created",
      "Recall held for human approval.",
      input.createdBy,
    );
    return clone(recall);
  }

  approveRecall(input: {
    recallId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineReleaseRecall {
    const recall = this.requiredRecall(input.recallId);
    if (recall.status !== "held") {
      throw new Error("Only a held recall can be approved.");
    }
    const approved: TimelineReleaseRecall = {
      ...recall,
      status: "in-progress",
      approvedAt: this.now().toISOString(),
      approvedBy: input.approvedBy,
    };
    this.recalls.set(approved.id, clone(approved));
    this.saveMonitor({
      ...this.requiredMonitor(recall.monitorId),
      status: "recalling",
    });
    this.record(
      recall.monitorId,
      "recall-approved",
      "Human approved destination takedowns.",
      input.approvedBy,
    );
    return clone(approved);
  }

  recordTakedown(input: {
    recallId: TimelineId;
    destinationId: TimelineId;
    outcome: "removed" | "failed";
    confirmationId?: string;
    error?: string;
    recordedBy: string;
  }): TimelineReleaseRecall {
    const recall = this.requiredRecall(input.recallId);
    if (recall.status !== "in-progress") {
      throw new Error("Recall is not in progress.");
    }
    const current = recall.destinations.find(
      (destination) => destination.destinationId === input.destinationId,
    );
    if (!current) throw new Error("Recall destination was not found.");
    if (current.status !== "pending") {
      throw new Error("Recall destination already has a final result.");
    }
    if (input.outcome === "removed" && !input.confirmationId?.trim()) {
      throw new Error("Removed destination requires confirmation evidence.");
    }
    if (input.outcome === "failed" && !input.error?.trim()) {
      throw new Error("Failed takedown requires an error message.");
    }
    const destinations = recall.destinations.map((destination) =>
      destination.destinationId === current.destinationId
        ? {
            ...destination,
            status: input.outcome,
            confirmationId: input.confirmationId?.trim(),
            error: input.error?.trim(),
            recordedAt: this.now().toISOString(),
          }
        : destination,
    );
    const pending = destinations.some(
      (destination) => destination.status === "pending",
    );
    const failed = destinations.some(
      (destination) => destination.status === "failed",
    );
    const status = pending ? "in-progress" : failed ? "failed" : "completed";
    const next: TimelineReleaseRecall = { ...recall, destinations, status };
    this.recalls.set(next.id, clone(next));
    this.record(
      recall.monitorId,
      input.outcome === "removed"
        ? "destination-removed"
        : "destination-failed",
      input.outcome === "removed"
        ? `${current.name} confirmed removal.`
        : `${current.name}: ${input.error!.trim()}`,
      input.recordedBy,
    );
    if (status === "completed") {
      this.saveMonitor({
        ...this.requiredMonitor(recall.monitorId),
        status: "recalled",
      });
      this.record(
        recall.monitorId,
        "recall-completed",
        "Every destination confirmed removal.",
        input.recordedBy,
      );
    }
    return clone(next);
  }

  getMonitor(id: TimelineId): TimelineReleaseMonitor | null {
    const value = this.monitors.get(id);
    return value ? clone(value) : null;
  }

  getRecall(id: TimelineId): TimelineReleaseRecall | null {
    const value = this.recalls.get(id);
    return value ? clone(value) : null;
  }

  listIncidents(monitorId?: TimelineId): TimelineReleaseIncident[] {
    return [...this.incidents.values()]
      .filter((incident) => !monitorId || incident.monitorId === monitorId)
      .map(clone);
  }

  listReceipts(monitorId?: TimelineId): TimelineReleaseMonitoringReceipt[] {
    return this.receipts
      .filter((receipt) => !monitorId || receipt.monitorId === monitorId)
      .map(clone);
  }

  exportArchive(): TimelineReleaseMonitoringArchive {
    return {
      monitors: [...this.monitors.values()].map(clone),
      incidents: [...this.incidents.values()].map(clone),
      recalls: [...this.recalls.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineReleaseMonitoringArchive): void {
    this.assertUnique(archive.monitors, "monitor");
    this.assertUnique(archive.incidents, "incident");
    this.assertUnique(archive.recalls, "recall");
    this.assertUnique(archive.receipts, "receipt");
    this.monitors.clear();
    this.incidents.clear();
    this.recalls.clear();
    this.receipts.length = 0;
    archive.monitors.forEach((item) => this.monitors.set(item.id, clone(item)));
    archive.incidents.forEach((item) =>
      this.incidents.set(item.id, clone(item)),
    );
    archive.recalls.forEach((item) => this.recalls.set(item.id, clone(item)));
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.monitorSequence = Math.max(0, ...archive.monitors.map((item) => sequence(item.id)));
    this.incidentSequence = Math.max(0, ...archive.incidents.map((item) => sequence(item.id)));
    this.recallSequence = Math.max(0, ...archive.recalls.map((item) => sequence(item.id)));
    this.receiptSequence = Math.max(0, ...archive.receipts.map((item) => sequence(item.id)));
  }

  private openIncident(
    monitorId: TimelineId,
    issue: Pick<TimelineReleaseIncident, "kind" | "severity" | "message">,
    openedBy: string,
  ): TimelineReleaseIncident {
    const existing = [...this.incidents.values()].find(
      (incident) =>
        incident.monitorId === monitorId &&
        incident.status === "open" &&
        incident.kind === issue.kind &&
        incident.message === issue.message,
    );
    if (existing) return clone(existing);
    const incident: TimelineReleaseIncident = {
      id: `timeline-release-incident-${++this.incidentSequence}`,
      monitorId,
      ...issue,
      status: "open",
      openedAt: this.now().toISOString(),
      openedBy,
    };
    this.incidents.set(incident.id, clone(incident));
    this.record(
      monitorId,
      "incident-opened",
      issue.message,
      openedBy,
    );
    return clone(incident);
  }

  private requiredMonitor(id: TimelineId): TimelineReleaseMonitor {
    const value = this.monitors.get(id);
    if (!value) throw new Error("Release monitor was not found.");
    return value;
  }

  private requiredIncident(id: TimelineId): TimelineReleaseIncident {
    const value = this.incidents.get(id);
    if (!value) throw new Error("Release incident was not found.");
    return value;
  }

  private requiredRecall(id: TimelineId): TimelineReleaseRecall {
    const value = this.recalls.get(id);
    if (!value) throw new Error("Release recall was not found.");
    return value;
  }

  private saveMonitor(value: TimelineReleaseMonitor): TimelineReleaseMonitor {
    this.monitors.set(value.id, clone(value));
    return clone(value);
  }

  private record(
    monitorId: TimelineId,
    action: TimelineReleaseMonitoringReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-release-monitoring-receipt-${++this.receiptSequence}`,
      monitorId,
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
