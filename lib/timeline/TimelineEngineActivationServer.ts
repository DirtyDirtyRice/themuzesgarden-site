import "server-only";

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { join, resolve } from "node:path";

import {
  TIMELINE_ENGINE_CATALOG,
  TimelineEngineRegistry,
} from "./TimelineEngineRegistry";
import { TimelineEngineActivationGate } from "./TimelineEngineActivationGate";
import { TimelineEngineActivationService } from "./TimelineEngineActivationService";
import { TimelineEngineActivationFileStore, type TimelineEngineActivationStore } from "./TimelineEngineActivationStore";
import { TimelineEngineActivationSupabaseStore } from "./TimelineEngineActivationSupabaseStore";
import { TimelineProductionCoordinatorEngine } from "./TimelineProductionCoordinatorEngine";

let servicePromise: Promise<TimelineEngineActivationService> | null = null;
let productionCoordinatorPromise: Promise<TimelineProductionCoordinatorEngine> | null = null;

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

function activationStore(): TimelineEngineActivationStore {
  const requested = process.env.TIMELINE_ENGINE_ACTIVATION_STORAGE?.trim().toLowerCase();
  if (requested === "supabase") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !serviceRoleKey) {
      throw new Error(
        "Supabase activation storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    return new TimelineEngineActivationSupabaseStore(createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }));
  }
  return new TimelineEngineActivationFileStore(activationLedgerPath());
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
    activationStore(),
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
export function getTimelineProductionCoordinatorServer(): Promise<TimelineProductionCoordinatorEngine> {
  if (!productionCoordinatorPromise) {
    productionCoordinatorPromise = getTimelineEngineActivationService()
      .then((service) => new TimelineProductionCoordinatorEngine(
        () => new Date(),
        service,
      ))
      .catch((error) => {
        productionCoordinatorPromise = null;
        throw error;
      });
  }
  return productionCoordinatorPromise;
}
