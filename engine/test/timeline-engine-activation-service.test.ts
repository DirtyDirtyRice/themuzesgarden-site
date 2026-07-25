import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { TimelineEngineActivationGate } from "../../lib/timeline/TimelineEngineActivationGate";
import { TimelineEngineActivationService } from "../../lib/timeline/TimelineEngineActivationService";
import {
  TimelineEngineRegistry,
  type TimelineEngineDescriptor,
} from "../../lib/timeline/TimelineEngineRegistry";

const folders: string[] = [];

async function ledgerFile(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "timeline-engine-activation-"));
  folders.push(folder);
  return join(folder, "activation-ledger.json");
}

afterEach(async () => {
  await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});

function registry(healthy = true): TimelineEngineRegistry {
  const descriptor: TimelineEngineDescriptor = {
    id: "production",
    name: "production",
    module: "./production",
    version: "1.0.0",
    domain: "production",
    capabilities: ["coordinate"],
    dependencies: [],
    required: true,
  };
  const value = new TimelineEngineRegistry([descriptor], () => new Date("2026-07-25T12:00:00.000Z"));
  value.probeAll(() => ({ healthy, message: healthy ? "green" : "regression" }));
  return value;
}

describe("TimelineEngineActivationService", () => {
  it("persists authorized and consumed evidence across restarts", async () => {
    const filePath = await ledgerFile();
    const source = new TimelineEngineActivationService(
      filePath,
      new TimelineEngineActivationGate(registry(), () => new Date("2026-07-25T12:01:00.000Z")),
      () => new Date("2026-07-25T12:01:00.000Z"),
    );
    const authorization = await source.request({ workflowId: "plan-1", requestedBy: "producer-1" });
    await source.consume({
      authorizationId: authorization.id,
      workflowId: "plan-1",
      consumedBy: "coordinator",
    });

    const restarted = new TimelineEngineActivationService(
      filePath,
      new TimelineEngineActivationGate(registry()),
    );
    const snapshot = await restarted.initialize();
    const stored = JSON.parse(await readFile(filePath, "utf8"));

    expect(snapshot).toMatchObject({ total: 1, consumed: 1, blocked: 0 });
    expect(snapshot.decisions[0].id).toBe(authorization.id);
    expect(stored.schemaVersion).toBe(1);
    expect(stored.archive.decisions[0].status).toBe("consumed");
  });

  it("persists blocked decisions as prevented activation evidence", async () => {
    const filePath = await ledgerFile();
    const service = new TimelineEngineActivationService(
      filePath,
      new TimelineEngineActivationGate(registry(false)),
    );
    const decision = await service.request({ workflowId: "plan-2", requestedBy: "producer-1" });
    const restarted = new TimelineEngineActivationService(
      filePath,
      new TimelineEngineActivationGate(registry(false)),
    );
    const snapshot = await restarted.initialize();

    expect(decision.status).toBe("blocked");
    expect(snapshot.blocked).toBe(1);
    expect(snapshot.decisions[0].reasons.join(" ")).toContain("unhealthy");
  });

  it("saves expiration evidence even when consumption throws", async () => {
    const filePath = await ledgerFile();
    let time = new Date("2026-07-25T12:00:00.000Z");
    const gate = new TimelineEngineActivationGate(registry(), () => time, 1_000);
    const service = new TimelineEngineActivationService(filePath, gate, () => time);
    const authorization = await service.request({ workflowId: "plan-3", requestedBy: "producer-1" });
    time = new Date("2026-07-25T12:00:02.000Z");
    await expect(service.consume({
      authorizationId: authorization.id,
      workflowId: "plan-3",
      consumedBy: "coordinator",
    })).rejects.toThrow("expired");

    const stored = JSON.parse(await readFile(filePath, "utf8"));
    expect(stored.archive.decisions[0].status).toBe("expired");
  });

  it("serializes concurrent requests without losing decisions", async () => {
    const filePath = await ledgerFile();
    const service = new TimelineEngineActivationService(
      filePath,
      new TimelineEngineActivationGate(registry()),
    );
    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        service.request({ workflowId: `plan-${index}`, requestedBy: "producer-1" })
      ),
    );
    const restarted = new TimelineEngineActivationService(
      filePath,
      new TimelineEngineActivationGate(registry()),
    );
    expect((await restarted.initialize()).total).toBe(25);
  });
});
