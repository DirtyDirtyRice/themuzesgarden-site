import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  TIMELINE_ENGINE_CATALOG,
  TimelineEngineRegistry,
  type TimelineEngineDescriptor,
  type TimelineEngineDomain,
  type TimelineEngineReadinessReport,
} from "../timeline/TimelineEngineRegistry";

export type TimelineEngineHealthRow = {
  descriptor: TimelineEngineDescriptor;
  healthy: boolean;
  message: string;
  sourcePath: string;
  startupPosition: number;
  directDependents: string[];
  downstreamImpact: string[];
};

export type TimelineEngineDomainHealth = {
  domain: TimelineEngineDomain;
  registered: number;
  healthy: number;
  ready: boolean;
};

export type TimelineEngineHealthDashboard = {
  report: TimelineEngineReadinessReport;
  engines: TimelineEngineHealthRow[];
  domains: TimelineEngineDomainHealth[];
  dependencyLinks: number;
};

function moduleSourcePath(projectRoot: string, descriptor: TimelineEngineDescriptor): string {
  const moduleName = descriptor.module.replace(/^\.\//, "");
  return resolve(projectRoot, "lib", "timeline", `${moduleName}.ts`);
}

export function buildTimelineEngineHealth(
  projectRoot: string,
  descriptors: TimelineEngineDescriptor[] = TIMELINE_ENGINE_CATALOG,
  now: () => Date = () => new Date(),
): TimelineEngineHealthDashboard {
  const registry = new TimelineEngineRegistry(descriptors, now);
  const sourceHealth = new Map<string, { healthy: boolean; message: string; sourcePath: string }>();

  registry.probeAll((descriptor) => {
    const sourcePath = moduleSourcePath(projectRoot, descriptor);
    const healthy = existsSync(sourcePath);
    const result = {
      healthy,
      sourcePath,
      message: healthy
        ? "Source module is present and registered."
        : `Source module is missing: ${sourcePath}`,
    };
    sourceHealth.set(descriptor.id, result);
    return result;
  });

  const report = registry.readiness();
  const startupPositions = new Map(report.startupOrder.map((id, index) => [id, index + 1]));
  const engines = registry.list().map((descriptor): TimelineEngineHealthRow => {
    const health = sourceHealth.get(descriptor.id);
    return {
      descriptor,
      healthy: health?.healthy ?? false,
      message: health?.message ?? "No source probe was recorded.",
      sourcePath: health?.sourcePath ?? moduleSourcePath(projectRoot, descriptor),
      startupPosition: startupPositions.get(descriptor.id) ?? 0,
      directDependents: registry.dependents(descriptor.id).map((item) => item.id),
      downstreamImpact: registry.impact(descriptor.id),
    };
  });

  const domains = [...new Set(engines.map((engine) => engine.descriptor.domain))]
    .sort()
    .map((domain): TimelineEngineDomainHealth => {
      const members = engines.filter((engine) => engine.descriptor.domain === domain);
      const healthy = members.filter((engine) => engine.healthy).length;
      return { domain, registered: members.length, healthy, ready: healthy === members.length };
    });

  return {
    report,
    engines,
    domains,
    dependencyLinks: engines.reduce(
      (total, engine) => total + engine.descriptor.dependencies.length,
      0,
    ),
  };
}
