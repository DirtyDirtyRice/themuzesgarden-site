import "server-only";

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  TIMELINE_ENGINE_CATALOG,
  TimelineEngineRegistry,
} from "./TimelineEngineRegistry";
import { TimelineEngineActivationGate } from "./TimelineEngineActivationGate";
import { TimelineEngineActivationService } from "./TimelineEngineActivationService";

let servicePromise: Promise<TimelineEngineActivationService> | null = null;

function activationLedgerPath(): string {
  return (
    process.env.TIMELINE_ENGINE_ACTIVATION_LEDGER_PATH?.trim() ||
    join(
      process.cwd(),
      "code-map-reports",
      "timeline-workflows",
      "engine-activation-ledger.json",
    )
  );
}

async function createService(): Promise<TimelineEngineActivationService> {
  const registry = new TimelineEngineRegistry();
  registry.probeAll((descriptor) => {
    const moduleName = descriptor.module.replace(/^\.\//, "");
    const sourcePath = resolve(process.cwd(), "lib", "timeline", `${moduleName}.ts`);
    const healthy = existsSync(sourcePath);
    return {
      healthy,
      message: healthy
        ? "Source module is present and registered."
        : `Registered source module is missing: ${moduleName}.ts`,
    };
  });
  if (registry.list().length !== TIMELINE_ENGINE_CATALOG.length) {
    throw new Error("Engine activation registry is incomplete.");
  }
  const service = new TimelineEngineActivationService(
    activationLedgerPath(),
    new TimelineEngineActivationGate(registry),
  );
  await service.initialize();
  return service;
}

export function getTimelineEngineActivationService(): Promise<TimelineEngineActivationService> {
  if (!servicePromise) {
    servicePromise = createService().catch((error) => {
      servicePromise = null;
      throw error;
    });
  }
  return servicePromise;
}
