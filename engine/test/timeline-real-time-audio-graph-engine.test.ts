import { describe, expect, it } from "vitest";
import { TimelineRealTimeAudioGraphEngine } from "../../lib/timeline/TimelineRealTimeAudioGraphEngine";

function graph(engine: TimelineRealTimeAudioGraphEngine) {
  return engine.createGraph({
    projectId: "project-1",
    name: "Main audio graph",
    sampleRate: 48_000,
    blockSize: 128,
    createdBy: "steve",
  });
}

function addNode(
  engine: TimelineRealTimeAudioGraphEngine,
  graphId: string,
  head: number,
  externalId: string,
  kind:
    | "source"
    | "track"
    | "instrument"
    | "processor"
    | "bus"
    | "send"
    | "return"
    | "master"
    | "output",
  options: {
    available?: boolean;
    latencySamples?: number;
    inputChannels?: number;
    outputChannels?: number;
  } = {},
) {
  return engine.addNode({
    graphId,
    expectedHead: head,
    externalId,
    name: externalId,
    kind,
    inputChannels:
      options.inputChannels ?? (kind === "source" || kind === "instrument" ? 0 : 2),
    outputChannels: options.outputChannels ?? (kind === "output" ? 0 : 2),
    available: options.available,
    latencySamples: options.latencySamples,
    editedBy: "steve",
  });
}

function connect(
  engine: TimelineRealTimeAudioGraphEngine,
  graphId: string,
  head: number,
  sourceNodeId: string,
  destinationNodeId: string,
) {
  return engine.connect({
    graphId,
    expectedHead: head,
    sourceNodeId,
    destinationNodeId,
    channelCount: 2,
    editedBy: "steve",
  });
}

describe("TimelineRealTimeAudioGraphEngine", () => {
  it("validates, orders, measures, and activates a complete real-time graph", () => {
    const engine = new TimelineRealTimeAudioGraphEngine(
      () => new Date("2026-07-25T12:00:00.000Z"),
    );
    let current = graph(engine);
    current = addNode(engine, current.id, current.head, "recording-1", "source");
    const source = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "compressor-1", "processor", {
      latencySamples: 128,
    });
    const processor = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "master-1", "master");
    const master = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "device-1", "output");
    const output = current.nodes.at(-1)!;
    current = connect(engine, current.id, current.head, source.id, processor.id);
    current = connect(engine, current.id, current.head, processor.id, master.id);
    current = connect(engine, current.id, current.head, master.id, output.id);

    const validation = engine.validate({
      graphId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });

    expect(validation.valid).toBe(true);
    expect(validation.processingOrder).toEqual([
      source.id,
      processor.id,
      master.id,
      output.id,
    ]);
    expect(validation.totalLatencySamples).toBe(128);

    const validated = engine.getGraph(current.id)!;
    const active = engine.activate({
      graphId: validated.id,
      expectedHead: validated.head,
      activatedBy: "reviewer",
    });
    expect(active.status).toBe("active");
    expect(() => engine.addNode({
      graphId: active.id,
      expectedHead: active.head,
      externalId: "late-node",
      name: "late",
      kind: "source",
      inputChannels: 0,
      outputChannels: 2,
      editedBy: "steve",
    })).toThrow(/cannot be edited/i);
  });

  it("holds unavailable and disconnected nodes outside active execution", () => {
    const engine = new TimelineRealTimeAudioGraphEngine();
    let current = graph(engine);
    current = addNode(engine, current.id, current.head, "source-1", "source");
    current = addNode(engine, current.id, current.head, "missing-plugin", "processor", {
      available: false,
    });
    current = addNode(engine, current.id, current.head, "master-1", "master");
    current = addNode(engine, current.id, current.head, "output-1", "output");

    const validation = engine.validate({
      graphId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues.some((issue) => issue.code === "node-unavailable")).toBe(true);
    expect(validation.issues.some((issue) => issue.code === "node-disconnected")).toBe(true);
    const held = engine.getGraph(current.id)!;
    expect(held.status).toBe("held");
    expect(() => engine.activate({
      graphId: held.id,
      expectedHead: held.head,
      activatedBy: "reviewer",
    })).toThrow(/validated/i);
  });

  it("detects feedback cycles before they can enter the real-time graph", () => {
    const engine = new TimelineRealTimeAudioGraphEngine();
    let current = graph(engine);
    current = addNode(engine, current.id, current.head, "source-1", "source");
    const source = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "bus-a", "bus");
    const busA = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "bus-b", "bus");
    const busB = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "master-1", "master");
    const master = current.nodes.at(-1)!;
    current = addNode(engine, current.id, current.head, "output-1", "output");
    const output = current.nodes.at(-1)!;
    current = connect(engine, current.id, current.head, source.id, busA.id);
    current = connect(engine, current.id, current.head, busA.id, busB.id);
    current = connect(engine, current.id, current.head, busB.id, busA.id);
    current = connect(engine, current.id, current.head, busB.id, master.id);
    current = connect(engine, current.id, current.head, master.id, output.id);

    const validation = engine.validate({
      graphId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((issue) => issue.code === "feedback-cycle")).toBe(true);
  });

  it("rejects stale edits, duplicate nodes, invalid channels, and duplicate routes", () => {
    const engine = new TimelineRealTimeAudioGraphEngine();
    let current = graph(engine);
    current = addNode(engine, current.id, current.head, "source-1", "source");
    const source = current.nodes.at(-1)!;
    expect(() => addNode(engine, current.id, 0, "stale", "source")).toThrow(/head conflict/i);
    expect(() => addNode(engine, current.id, current.head, "source-1", "source")).toThrow(/already present/i);
    current = addNode(engine, current.id, current.head, "master-1", "master");
    const master = current.nodes.at(-1)!;
    expect(() => engine.connect({
      graphId: current.id,
      expectedHead: current.head,
      sourceNodeId: source.id,
      destinationNodeId: master.id,
      channelCount: 3,
      editedBy: "steve",
    })).toThrow(/channel capacity/i);
    current = connect(engine, current.id, current.head, source.id, master.id);
    expect(() => connect(
      engine,
      current.id,
      current.head,
      source.id,
      master.id,
    )).toThrow(/already exists/i);
  });

  it("restores graph history and continues every stable identity sequence", () => {
    const sourceEngine = new TimelineRealTimeAudioGraphEngine();
    let first = graph(sourceEngine);
    first = addNode(sourceEngine, first.id, first.head, "source-1", "source");
    const archive = sourceEngine.exportArchive();
    const restored = new TimelineRealTimeAudioGraphEngine();
    restored.restoreArchive(archive);

    expect(restored.listGraphs()).toEqual(sourceEngine.listGraphs());
    expect(restored.listEvents()).toEqual(sourceEngine.listEvents());
    expect(() => restored.restoreArchive({
      graphs: [...archive.graphs, ...archive.graphs],
      events: archive.events,
    })).toThrow(/duplicate/i);

    const second = graph(restored);
    const withNode = addNode(
      restored,
      second.id,
      second.head,
      "source-2",
      "source",
    );
    expect(second.id).toBe("timeline-audio-graph-2");
    expect(withNode.nodes[0]?.id).toBe("timeline-audio-graph-node-2");
    expect(restored.listEvents().at(-1)?.id).toBe(
      "timeline-audio-graph-event-4",
    );
  });
});
