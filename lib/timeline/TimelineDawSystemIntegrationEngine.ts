import { TIMELINE_ENGINE_CATALOG, TimelineEngineRegistry, type TimelineEngineDescriptor } from "./TimelineEngineRegistry";
import type { TimelineId } from "./TimelineTypes";

export const TIMELINE_DAW_ENGINE_IDS = [
  "real-time-audio-graph", "multi-track-session", "transport-synchronization",
  "recording-take-management", "audio-clip-arrangement", "midi-performance",
  "instrument-sampler", "mixer-routing", "plugin-device-chain",
  "automation-execution", "offline-render-export", "session-recovery-performance",
] as const;

export type TimelineDawStage = {
  order: number; engineId: TimelineId; name: string; domain: string;
  dependencies: TimelineId[]; ready: boolean; blockingReasons: string[];
};
export type TimelineDawIntegrationReport = {
  ready: boolean; completed: number; required: number; stages: TimelineDawStage[];
  startupOrder: TimelineId[]; errors: string[];
};

export class TimelineDawSystemIntegrationEngine {
  constructor(private readonly catalog: TimelineEngineDescriptor[] = TIMELINE_ENGINE_CATALOG) {}

  report(healthyEngineIds: Iterable<TimelineId> = this.catalog.map((engine) => engine.id)): TimelineDawIntegrationReport {
    const healthy = new Set(healthyEngineIds);
    const registry = new TimelineEngineRegistry(this.catalog);
    const errors: string[] = [];
    let startupOrder: TimelineId[] = [];
    try { startupOrder = registry.startupOrder(); } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
    const byId = new Map(this.catalog.map((engine) => [engine.id, engine]));
    const stages = TIMELINE_DAW_ENGINE_IDS.map((engineId, index) => {
      const descriptor = byId.get(engineId);
      const blockingReasons: string[] = [];
      if (!descriptor) blockingReasons.push(`DAW engine ${engineId} is not registered.`);
      else {
        if (!healthy.has(engineId)) blockingReasons.push(`${engineId} is unhealthy.`);
        descriptor.dependencies.forEach((dependency) => {
          if (!byId.has(dependency)) blockingReasons.push(`Required dependency ${dependency} is missing.`);
          else if (!healthy.has(dependency)) blockingReasons.push(`Required dependency ${dependency} is unhealthy.`);
        });
      }
      return {
        order: index + 1, engineId, name: descriptor?.name ?? engineId,
        domain: descriptor?.domain ?? "unknown", dependencies: descriptor?.dependencies ?? [],
        ready: blockingReasons.length === 0, blockingReasons,
      };
    });
    stages.flatMap((stage) => stage.blockingReasons).forEach((reason) => errors.push(reason));
    return {
      ready: stages.every((stage) => stage.ready) && errors.length === 0,
      completed: stages.filter((stage) => stage.ready).length,
      required: TIMELINE_DAW_ENGINE_IDS.length, stages,
      startupOrder: startupOrder.filter((id) => TIMELINE_DAW_ENGINE_IDS.includes(id as typeof TIMELINE_DAW_ENGINE_IDS[number])),
      errors: [...new Set(errors)],
    };
  }
}

export const timelineDawSystemIntegrationEngine = new TimelineDawSystemIntegrationEngine();
