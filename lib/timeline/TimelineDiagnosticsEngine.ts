import type {
  TimelineEngineMetrics,
  TimelineEngineRuntime,
  TimelineId,
  TimelineStatistics,
  TimelineWorkspace,
} from "./TimelineTypes";
import type { TimelineHistorySnapshot } from "./TimelineHistoryEngine";
import type { TimelineRelationshipSnapshot } from "./TimelineRelationshipEngine";
import type { TimelineDetailedValidationReport } from "./TimelineValidationEngine";

export type TimelineDiagnosticSeverity = "info" | "warning" | "error" | "critical";
export type TimelineDiagnosticArea =
  | "validation"
  | "relationships"
  | "history"
  | "statistics"
  | "performance"
  | "runtime";

export type TimelineDiagnosticFinding = {
  id: TimelineId;
  severity: TimelineDiagnosticSeverity;
  area: TimelineDiagnosticArea;
  title: string;
  detail: string;
  entityIds: TimelineId[];
  repair: string;
  blocking: boolean;
};

export type TimelineDiagnosticHealth = "healthy" | "attention" | "degraded" | "blocked";

export type TimelineDiagnosticReport = {
  id: TimelineId;
  generatedAt: string;
  projectId: TimelineId;
  health: TimelineDiagnosticHealth;
  score: number;
  findings: TimelineDiagnosticFinding[];
  counts: Record<TimelineDiagnosticSeverity, number>;
  blockingCount: number;
  statistics: TimelineStatistics;
  metrics?: TimelineEngineMetrics;
  recommendations: string[];
};

export type TimelineDiagnosticInput = {
  workspace: TimelineWorkspace;
  validation: TimelineDetailedValidationReport;
  relationships?: TimelineRelationshipSnapshot;
  history?: TimelineHistorySnapshot;
  runtime?: TimelineEngineRuntime;
  thresholds?: {
    largeEventCount?: number;
    slowRenderMs?: number;
    slowUpdateMs?: number;
  };
};

function finding(
  id: string,
  severity: TimelineDiagnosticSeverity,
  area: TimelineDiagnosticArea,
  title: string,
  detail: string,
  repair: string,
  entityIds: TimelineId[] = [],
  blocking = severity === "critical"
): TimelineDiagnosticFinding {
  return { id, severity, area, title, detail, entityIds, repair, blocking };
}

function calculateStatistics(workspace: TimelineWorkspace): TimelineStatistics {
  const events = workspace.events;
  return {
    totalEvents: events.length,
    promptEvents: events.filter((event) => event.type === "prompt").length,
    lyricEvents: events.filter((event) => event.type === "lyric").length,
    markerEvents: events.filter((event) => event.type === "marker").length,
    automationEvents: events.filter((event) => event.type === "automation").length,
    relationshipEvents: events.filter((event) => event.type === "relationship").length,
    audioEvents: events.filter((event) => event.type === "audio").length,
    videoEvents: events.filter((event) => event.type === "video").length,
    imageEvents: events.filter((event) => event.type === "image").length,
    aiEvents: events.filter((event) => event.aiGenerated).length,
  };
}

export class TimelineDiagnosticsEngine {
  private reports: TimelineDiagnosticReport[] = [];

  diagnose(input: TimelineDiagnosticInput): TimelineDiagnosticReport {
    const findings: TimelineDiagnosticFinding[] = [];
    const actualStatistics = calculateStatistics(input.workspace);
    const thresholds = {
      largeEventCount: input.thresholds?.largeEventCount ?? 10_000,
      slowRenderMs: input.thresholds?.slowRenderMs ?? 32,
      slowUpdateMs: input.thresholds?.slowUpdateMs ?? 50,
    };

    input.validation.detailedIssues.forEach((issue) => {
      findings.push(
        finding(
          `validation:${issue.id}`,
          issue.severity === "error" ? "error" : issue.severity,
          "validation",
          issue.code,
          issue.message,
          `Correct ${issue.path}, then run validation again.`,
          issue.entityId ? [issue.entityId] : [],
          issue.blocking
        )
      );
    });

    if (input.relationships) {
      input.relationships.cycles.forEach((cycle, index) =>
        findings.push(
          finding(
            `relationship:cycle:${index}`,
            "error",
            "relationships",
            "Relationship cycle",
            cycle.join(" -> "),
            "Remove or redirect one dependency edge in this cycle.",
            cycle,
            true
          )
        )
      );
      if (input.relationships.orphanEvents.length) {
        findings.push(
          finding(
            "relationship:orphans",
            "warning",
            "relationships",
            "Unconnected Timeline events",
            `${input.relationships.orphanEvents.length} events have no relationships.`,
            "Review whether these events need links or are intentionally independent.",
            input.relationships.orphanEvents
          )
        );
      }
    }

    if (input.history && !input.history.integrityValid) {
      findings.push(
        finding(
          "history:integrity",
          "critical",
          "history",
          "History integrity failure",
          "The append-only history hash chain does not verify.",
          "Stop mutations, preserve the ledger, and restore from the last valid checkpoint.",
          [],
          true
        )
      );
    }

    for (const key of Object.keys(actualStatistics) as (keyof TimelineStatistics)[]) {
      if (actualStatistics[key] !== input.workspace.statistics[key]) {
        findings.push(
          finding(
            `statistics:${key}`,
            "warning",
            "statistics",
            `Stale ${key}`,
            `Stored ${input.workspace.statistics[key]}, actual ${actualStatistics[key]}.`,
            "Recalculate Timeline statistics."
          )
        );
      }
    }

    if (actualStatistics.totalEvents >= thresholds.largeEventCount) {
      findings.push(
        finding(
          "performance:event-volume",
          "warning",
          "performance",
          "Large Timeline",
          `${actualStatistics.totalEvents} events require indexed queries and virtualized rendering.`,
          "Use TimelineQueryEngine indexes and render only the visible time window."
        )
      );
    }

    const metrics = input.runtime?.metrics;
    if (metrics && metrics.renderTimeMs > thresholds.slowRenderMs) {
      findings.push(
        finding(
          "performance:render",
          "warning",
          "performance",
          "Slow Timeline rendering",
          `${metrics.renderTimeMs}ms exceeds the ${thresholds.slowRenderMs}ms threshold.`,
          "Profile visible-event rendering and reduce work per frame."
        )
      );
    }
    if (metrics && metrics.updateTimeMs > thresholds.slowUpdateMs) {
      findings.push(
        finding(
          "performance:update",
          "warning",
          "performance",
          "Slow Timeline updates",
          `${metrics.updateTimeMs}ms exceeds the ${thresholds.slowUpdateMs}ms threshold.`,
          "Batch mutations and refresh indexes once per transaction."
        )
      );
    }

    const counts: Record<TimelineDiagnosticSeverity, number> = {
      info: findings.filter((item) => item.severity === "info").length,
      warning: findings.filter((item) => item.severity === "warning").length,
      error: findings.filter((item) => item.severity === "error").length,
      critical: findings.filter((item) => item.severity === "critical").length,
    };
    const blockingCount = findings.filter((item) => item.blocking).length;
    const penalty = counts.warning * 3 + counts.error * 12 + counts.critical * 30;
    const score = Math.max(0, 100 - penalty);
    const health: TimelineDiagnosticHealth =
      counts.critical || blockingCount > 2
        ? "blocked"
        : counts.error
          ? "degraded"
          : counts.warning
            ? "attention"
            : "healthy";
    const recommendations = Array.from(new Set(findings.map((item) => item.repair)));
    const report: TimelineDiagnosticReport = {
      id: `timeline-diagnostics-${Date.now()}-${this.reports.length + 1}`,
      generatedAt: new Date().toISOString(),
      projectId: input.workspace.projectId,
      health,
      score,
      findings,
      counts,
      blockingCount,
      statistics: actualStatistics,
      metrics,
      recommendations,
    };
    this.reports.push(report);
    return report;
  }

  getLatestReport(): TimelineDiagnosticReport | null {
    return this.reports.at(-1) ?? null;
  }

  getTrend(): Array<{ generatedAt: string; health: TimelineDiagnosticHealth; score: number }> {
    return this.reports.map(({ generatedAt, health, score }) => ({ generatedAt, health, score }));
  }

  clear(): void {
    this.reports = [];
  }
}

export const timelineDiagnosticsEngine = new TimelineDiagnosticsEngine();
