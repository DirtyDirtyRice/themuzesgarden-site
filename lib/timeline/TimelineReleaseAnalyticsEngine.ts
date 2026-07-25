import { TimelineReleasePublishingEngine } from "./TimelineReleasePublishingEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineReleaseAnalyticsRow = {
  date: string;
  territory: string;
  plays: number;
  uniqueListeners: number;
  saves: number;
  downloads: number;
  revenueMinorUnits: number;
};

export type TimelineReleaseStatement = {
  id: TimelineId;
  sourceId: TimelineId;
  packageId: TimelineId;
  externalStatementId: string;
  fingerprint: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  rows: TimelineReleaseAnalyticsRow[];
  importedAt: string;
  importedBy: string;
};

export type TimelineReleaseAnalyticsSource = {
  id: TimelineId;
  packageId: TimelineId;
  destinationId: TimelineId;
  destinationName: string;
  externalReleaseId: string;
  currency: string;
  status: "active" | "paused" | "archived";
  statementIds: TimelineId[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineReleaseAnalyticsTotals = {
  plays: number;
  uniqueListeners: number;
  saves: number;
  downloads: number;
  revenueByCurrency: Record<string, number>;
  territories: Record<
    string,
    {
      plays: number;
      uniqueListeners: number;
      saves: number;
      downloads: number;
    }
  >;
};

export type TimelineReleaseAnalyticsAnomaly = {
  id: TimelineId;
  packageId: TimelineId;
  metric: "plays" | "saves" | "downloads";
  direction: "increase" | "decrease";
  previousValue: number;
  currentValue: number;
  changePercent: number;
  periodStart: string;
  periodEnd: string;
  detectedAt: string;
};

export type TimelineReleaseAnalyticsReceipt = {
  id: TimelineId;
  sourceId: TimelineId;
  action: "source-created" | "statement-imported" | "source-paused" | "source-resumed";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineReleaseAnalyticsArchive = {
  sources: TimelineReleaseAnalyticsSource[];
  statements: TimelineReleaseStatement[];
  anomalies: TimelineReleaseAnalyticsAnomaly[];
  receipts: TimelineReleaseAnalyticsReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function day(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`Invalid date: ${value}.`);
  return parsed.toISOString().slice(0, 10);
}

function emptyTotals(): TimelineReleaseAnalyticsTotals {
  return {
    plays: 0,
    uniqueListeners: 0,
    saves: 0,
    downloads: 0,
    revenueByCurrency: {},
    territories: {},
  };
}

export class TimelineReleaseAnalyticsEngine {
  private readonly sources = new Map<TimelineId, TimelineReleaseAnalyticsSource>();
  private readonly statements = new Map<TimelineId, TimelineReleaseStatement>();
  private readonly anomalies = new Map<TimelineId, TimelineReleaseAnalyticsAnomaly>();
  private readonly receipts: TimelineReleaseAnalyticsReceipt[] = [];
  private sourceSequence = 0;
  private statementSequence = 0;
  private anomalySequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly publishing = new TimelineReleasePublishingEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createSource(input: {
    packageId: TimelineId;
    destinationId: TimelineId;
    currency: string;
    createdBy: TimelineUserId;
  }): TimelineReleaseAnalyticsSource {
    const release = this.publishing.getPackage(input.packageId);
    if (!release || release.status !== "published") {
      throw new Error("Analytics requires a published release package.");
    }
    const destination = release.destinations.find(
      (item) => item.id === input.destinationId,
    );
    if (
      !destination ||
      destination.status !== "published" ||
      !destination.externalReleaseId
    ) {
      throw new Error("Analytics destination is not fully published.");
    }
    const currency = input.currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Analytics currency requires a three-letter code.");
    }
    const duplicate = [...this.sources.values()].some(
      (source) =>
        source.packageId === release.id &&
        source.destinationId === destination.id &&
        source.status !== "archived",
    );
    if (duplicate) {
      throw new Error("An active analytics source already exists.");
    }
    const source: TimelineReleaseAnalyticsSource = {
      id: `timeline-release-analytics-source-${++this.sourceSequence}`,
      packageId: release.id,
      destinationId: destination.id,
      destinationName: destination.name,
      externalReleaseId: destination.externalReleaseId,
      currency,
      status: "active",
      statementIds: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.sources.set(source.id, clone(source));
    this.record(
      source.id,
      "source-created",
      `Analytics connected to ${source.destinationName}.`,
      input.createdBy,
    );
    return clone(source);
  }

  importStatement(input: {
    sourceId: TimelineId;
    externalStatementId: string;
    fingerprint: string;
    periodStart: string;
    periodEnd: string;
    rows: TimelineReleaseAnalyticsRow[];
    importedBy: string;
  }): TimelineReleaseStatement {
    const source = this.requiredSource(input.sourceId);
    if (source.status !== "active") {
      throw new Error("Analytics source is not accepting statements.");
    }
    const externalStatementId = input.externalStatementId.trim();
    const fingerprint = input.fingerprint.trim();
    if (!externalStatementId || !fingerprint) {
      throw new Error("Statement ID and fingerprint are required.");
    }
    if (
      [...this.statements.values()].some(
        (statement) =>
          statement.sourceId === source.id &&
          (statement.externalStatementId === externalStatementId ||
            statement.fingerprint === fingerprint),
      )
    ) {
      throw new Error("Statement batch was already imported.");
    }
    const periodStart = day(input.periodStart);
    const periodEnd = day(input.periodEnd);
    if (periodStart > periodEnd) {
      throw new Error("Statement period dates are reversed.");
    }
    if (!input.rows.length) throw new Error("Statement has no analytics rows.");
    const rows = input.rows.map((row) =>
      this.validateRow(row, periodStart, periodEnd),
    );
    const statement: TimelineReleaseStatement = {
      id: `timeline-release-statement-${++this.statementSequence}`,
      sourceId: source.id,
      packageId: source.packageId,
      externalStatementId,
      fingerprint,
      periodStart,
      periodEnd,
      currency: source.currency,
      rows,
      importedAt: this.now().toISOString(),
      importedBy: input.importedBy,
    };
    this.statements.set(statement.id, clone(statement));
    this.sources.set(source.id, {
      ...source,
      statementIds: [...source.statementIds, statement.id],
    });
    this.record(
      source.id,
      "statement-imported",
      `Imported ${rows.length} immutable analytics row(s).`,
      input.importedBy,
    );
    return clone(statement);
  }

  totals(input: {
    packageId: TimelineId;
    startDate?: string;
    endDate?: string;
  }): TimelineReleaseAnalyticsTotals {
    const start = input.startDate ? day(input.startDate) : undefined;
    const end = input.endDate ? day(input.endDate) : undefined;
    if (start && end && start > end) {
      throw new Error("Analytics report dates are reversed.");
    }
    const totals = emptyTotals();
    this.rows(input.packageId, start, end).forEach(({ row, currency }) => {
      totals.plays += row.plays;
      totals.uniqueListeners += row.uniqueListeners;
      totals.saves += row.saves;
      totals.downloads += row.downloads;
      totals.revenueByCurrency[currency] =
        (totals.revenueByCurrency[currency] ?? 0) + row.revenueMinorUnits;
      const territory = (totals.territories[row.territory] ??= {
        plays: 0,
        uniqueListeners: 0,
        saves: 0,
        downloads: 0,
      });
      territory.plays += row.plays;
      territory.uniqueListeners += row.uniqueListeners;
      territory.saves += row.saves;
      territory.downloads += row.downloads;
    });
    return clone(totals);
  }

  detectAnomalies(input: {
    packageId: TimelineId;
    previousStart: string;
    previousEnd: string;
    currentStart: string;
    currentEnd: string;
    minimumBaseline?: number;
    thresholdPercent?: number;
  }): TimelineReleaseAnalyticsAnomaly[] {
    const previous = this.totals({
      packageId: input.packageId,
      startDate: input.previousStart,
      endDate: input.previousEnd,
    });
    const current = this.totals({
      packageId: input.packageId,
      startDate: input.currentStart,
      endDate: input.currentEnd,
    });
    const minimumBaseline = input.minimumBaseline ?? 100;
    const threshold = input.thresholdPercent ?? 50;
    if (minimumBaseline < 0 || threshold <= 0) {
      throw new Error("Anomaly thresholds must be positive.");
    }
    const detected: TimelineReleaseAnalyticsAnomaly[] = [];
    for (const metric of ["plays", "saves", "downloads"] as const) {
      const previousValue = previous[metric];
      const currentValue = current[metric];
      if (previousValue < minimumBaseline) continue;
      const changePercent =
        ((currentValue - previousValue) / previousValue) * 100;
      if (Math.abs(changePercent) < threshold) continue;
      const anomaly: TimelineReleaseAnalyticsAnomaly = {
        id: `timeline-release-anomaly-${++this.anomalySequence}`,
        packageId: input.packageId,
        metric,
        direction: changePercent >= 0 ? "increase" : "decrease",
        previousValue,
        currentValue,
        changePercent: Math.round(changePercent * 100) / 100,
        periodStart: day(input.currentStart),
        periodEnd: day(input.currentEnd),
        detectedAt: this.now().toISOString(),
      };
      this.anomalies.set(anomaly.id, clone(anomaly));
      detected.push(anomaly);
    }
    return detected.map(clone);
  }

  setSourceStatus(input: {
    sourceId: TimelineId;
    status: "active" | "paused";
    changedBy: TimelineUserId;
  }): TimelineReleaseAnalyticsSource {
    const source = this.requiredSource(input.sourceId);
    if (source.status === "archived") {
      throw new Error("Archived analytics source cannot be resumed.");
    }
    const next = { ...source, status: input.status };
    this.sources.set(next.id, clone(next));
    this.record(
      source.id,
      input.status === "active" ? "source-resumed" : "source-paused",
      `Analytics source ${input.status}.`,
      input.changedBy,
    );
    return clone(next);
  }

  getSource(sourceId: TimelineId): TimelineReleaseAnalyticsSource | null {
    const source = this.sources.get(sourceId);
    return source ? clone(source) : null;
  }

  listStatements(sourceId?: TimelineId): TimelineReleaseStatement[] {
    return [...this.statements.values()]
      .filter((statement) => !sourceId || statement.sourceId === sourceId)
      .map(clone);
  }

  listAnomalies(packageId?: TimelineId): TimelineReleaseAnalyticsAnomaly[] {
    return [...this.anomalies.values()]
      .filter((anomaly) => !packageId || anomaly.packageId === packageId)
      .map(clone);
  }

  listReceipts(sourceId?: TimelineId): TimelineReleaseAnalyticsReceipt[] {
    return this.receipts
      .filter((receipt) => !sourceId || receipt.sourceId === sourceId)
      .map(clone);
  }

  exportArchive(): TimelineReleaseAnalyticsArchive {
    return {
      sources: [...this.sources.values()].map(clone),
      statements: [...this.statements.values()].map(clone),
      anomalies: [...this.anomalies.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineReleaseAnalyticsArchive): void {
    this.assertUnique(archive.sources, "source");
    this.assertUnique(archive.statements, "statement");
    this.assertUnique(archive.anomalies, "anomaly");
    this.assertUnique(archive.receipts, "receipt");
    const sourceIds = new Set(archive.sources.map((source) => source.id));
    if (archive.statements.some((item) => !sourceIds.has(item.sourceId))) {
      throw new Error("Analytics statement references a missing source.");
    }
    this.sources.clear();
    this.statements.clear();
    this.anomalies.clear();
    this.receipts.length = 0;
    archive.sources.forEach((item) => this.sources.set(item.id, clone(item)));
    archive.statements.forEach((item) =>
      this.statements.set(item.id, clone(item)),
    );
    archive.anomalies.forEach((item) =>
      this.anomalies.set(item.id, clone(item)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.sourceSequence = Math.max(0, ...archive.sources.map((item) => sequence(item.id)));
    this.statementSequence = Math.max(0, ...archive.statements.map((item) => sequence(item.id)));
    this.anomalySequence = Math.max(0, ...archive.anomalies.map((item) => sequence(item.id)));
    this.receiptSequence = Math.max(0, ...archive.receipts.map((item) => sequence(item.id)));
  }

  private validateRow(
    input: TimelineReleaseAnalyticsRow,
    periodStart: string,
    periodEnd: string,
  ): TimelineReleaseAnalyticsRow {
    const row = {
      ...clone(input),
      date: day(input.date),
      territory: input.territory.trim().toUpperCase(),
    };
    if (row.date < periodStart || row.date > periodEnd) {
      throw new Error("Analytics row falls outside its statement period.");
    }
    if (!row.territory) throw new Error("Analytics territory is required.");
    const counters = [
      row.plays,
      row.uniqueListeners,
      row.saves,
      row.downloads,
      row.revenueMinorUnits,
    ];
    if (
      !counters.every(
        (value) => Number.isInteger(value) && value >= 0,
      )
    ) {
      throw new Error("Analytics counters must be nonnegative integers.");
    }
    if (row.uniqueListeners > row.plays) {
      throw new Error("Unique listeners cannot exceed plays.");
    }
    return row;
  }

  private rows(
    packageId: TimelineId,
    start?: string,
    end?: string,
  ): Array<{ row: TimelineReleaseAnalyticsRow; currency: string }> {
    return [...this.statements.values()]
      .filter((statement) => statement.packageId === packageId)
      .flatMap((statement) =>
        statement.rows
          .filter(
            (row) =>
              (!start || row.date >= start) && (!end || row.date <= end),
          )
          .map((row) => ({ row, currency: statement.currency })),
      );
  }

  private requiredSource(sourceId: TimelineId): TimelineReleaseAnalyticsSource {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error("Release analytics source was not found.");
    return source;
  }

  private record(
    sourceId: TimelineId,
    action: TimelineReleaseAnalyticsReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-release-analytics-receipt-${++this.receiptSequence}`,
      sourceId,
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
      throw new Error(`Archive contains duplicate analytics ${label} IDs.`);
    }
  }
}
