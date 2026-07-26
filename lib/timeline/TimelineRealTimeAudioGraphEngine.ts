import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAudioGraphNodeKind =
  | "source"
  | "track"
  | "instrument"
  | "processor"
  | "bus"
  | "send"
  | "return"
  | "master"
  | "output";

export type TimelineAudioGraphStatus =
  | "draft"
  | "held"
  | "validated"
  | "active"
  | "archived";

export type TimelineAudioGraphNode = {
  id: TimelineId;
  externalId: TimelineId;
  name: string;
  kind: TimelineAudioGraphNodeKind;
  inputChannels: number;
  outputChannels: number;
  available: boolean;
  latencySamples: number;
  bypassed: boolean;
  order: number;
};

export type TimelineAudioGraphConnection = {
  id: TimelineId;
  sourceNodeId: TimelineId;
  destinationNodeId: TimelineId;
  sourceChannelOffset: number;
  destinationChannelOffset: number;
  channelCount: number;
  gainDb: number;
  enabled: boolean;
  order: number;
};

export type TimelineAudioGraphIssue = {
  code:
    | "graph-invalid"
    | "node-unavailable"
    | "node-disconnected"
    | "master-required"
    | "output-required"
    | "route-invalid"
    | "channel-mismatch"
    | "feedback-cycle";
  message: string;
  subjectId: TimelineId | null;
};

export type TimelineAudioGraphValidation = {
  valid: boolean;
  issues: TimelineAudioGraphIssue[];
  processingOrder: TimelineId[];
  totalLatencySamples: number;
  validatedAt: string;
  validatedBy: TimelineUserId;
};

export type TimelineRealTimeAudioGraph = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  sampleRate: number;
  blockSize: number;
  status: TimelineAudioGraphStatus;
  head: number;
  nodes: TimelineAudioGraphNode[];
  connections: TimelineAudioGraphConnection[];
  processingOrder: TimelineId[];
  totalLatencySamples: number;
  issues: TimelineAudioGraphIssue[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineAudioGraphEvent = {
  id: TimelineId;
  graphId: TimelineId;
  action:
    | "created"
    | "node-added"
    | "connection-added"
    | "validated"
    | "held"
    | "activated"
    | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineRealTimeAudioGraphArchive = {
  graphs: TimelineRealTimeAudioGraph[];
  events: TimelineAudioGraphEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function whole(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${label} must be a whole number from ${minimum} to ${maximum}.`,
    );
  }
  return value;
}

function gain(value: number): number {
  if (!Number.isFinite(value) || value < -96 || value > 24) {
    throw new Error("Connection gain must be between -96 dB and +24 dB.");
  }
  return value;
}

export class TimelineRealTimeAudioGraphEngine {
  private readonly graphs = new Map<TimelineId, TimelineRealTimeAudioGraph>();
  private readonly events: TimelineAudioGraphEvent[] = [];
  private graphSequence = 0;
  private nodeSequence = 0;
  private connectionSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createGraph(input: {
    projectId: TimelineId;
    name: string;
    sampleRate: number;
    blockSize: number;
    createdBy: TimelineUserId;
  }): TimelineRealTimeAudioGraph {
    const now = this.now().toISOString();
    const graph: TimelineRealTimeAudioGraph = {
      id: `timeline-audio-graph-${++this.graphSequence}`,
      projectId: requiredText(input.projectId, "Project identity"),
      name: requiredText(input.name, "Audio graph name"),
      sampleRate: whole(input.sampleRate, 8_000, 384_000, "Sample rate"),
      blockSize: whole(input.blockSize, 16, 8_192, "Block size"),
      status: "draft",
      head: 0,
      nodes: [],
      connections: [],
      processingOrder: [],
      totalLatencySamples: 0,
      issues: [],
      createdAt: now,
      createdBy: requiredText(input.createdBy, "Creator identity"),
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.graphs.set(graph.id, clone(graph));
    this.record(
      graph.id,
      "created",
      graph.id,
      "Real-time audio graph created as a draft.",
      input.createdBy,
    );
    return clone(graph);
  }

  addNode(input: {
    graphId: TimelineId;
    expectedHead: number;
    externalId: TimelineId;
    name: string;
    kind: TimelineAudioGraphNodeKind;
    inputChannels: number;
    outputChannels: number;
    available?: boolean;
    latencySamples?: number;
    bypassed?: boolean;
    editedBy: TimelineUserId;
  }): TimelineRealTimeAudioGraph {
    const graph = this.editable(input.graphId, input.expectedHead);
    const externalId = requiredText(input.externalId, "External node identity");
    if (graph.nodes.some((node) => node.externalId === externalId)) {
      throw new Error("This external node is already present in the graph.");
    }
    if (
      ![
        "source",
        "track",
        "instrument",
        "processor",
        "bus",
        "send",
        "return",
        "master",
        "output",
      ].includes(input.kind)
    ) {
      throw new Error("Audio graph node kind is invalid.");
    }
    if (
      input.kind === "master" &&
      graph.nodes.some((node) => node.kind === "master")
    ) {
      throw new Error("An audio graph can contain only one master node.");
    }
    if (
      input.kind === "output" &&
      graph.nodes.some((node) => node.kind === "output")
    ) {
      throw new Error("An audio graph can contain only one output node.");
    }
    const inputChannels = whole(
      input.inputChannels,
      input.kind === "source" || input.kind === "instrument" ? 0 : 1,
      64,
      "Input channels",
    );
    const outputChannels = whole(
      input.outputChannels,
      input.kind === "output" ? 0 : 1,
      64,
      "Output channels",
    );
    if (input.kind === "output" && inputChannels < 1) {
      throw new Error("The output node must accept at least one channel.");
    }
    if (
      (input.kind === "source" || input.kind === "instrument") &&
      inputChannels !== 0
    ) {
      throw new Error("Source and instrument nodes cannot have audio inputs.");
    }
    if (input.kind === "output" && outputChannels !== 0) {
      throw new Error("The output node cannot expose audio outputs.");
    }
    const node: TimelineAudioGraphNode = {
      id: `timeline-audio-graph-node-${++this.nodeSequence}`,
      externalId,
      name: requiredText(input.name, "Node name"),
      kind: input.kind,
      inputChannels,
      outputChannels,
      available: input.available ?? true,
      latencySamples: whole(
        input.latencySamples ?? 0,
        0,
        graph.sampleRate * 10,
        "Node latency",
      ),
      bypassed: input.bypassed ?? false,
      order: graph.nodes.length,
    };
    const saved = this.save(
      graph,
      { nodes: [...graph.nodes, node] },
      input.editedBy,
    );
    this.record(
      graph.id,
      "node-added",
      node.id,
      `${node.kind} node added to the draft graph.`,
      input.editedBy,
    );
    return saved;
  }

  connect(input: {
    graphId: TimelineId;
    expectedHead: number;
    sourceNodeId: TimelineId;
    destinationNodeId: TimelineId;
    sourceChannelOffset?: number;
    destinationChannelOffset?: number;
    channelCount: number;
    gainDb?: number;
    enabled?: boolean;
    editedBy: TimelineUserId;
  }): TimelineRealTimeAudioGraph {
    const graph = this.editable(input.graphId, input.expectedHead);
    const source = this.requiredNode(graph, input.sourceNodeId);
    const destination = this.requiredNode(graph, input.destinationNodeId);
    if (source.id === destination.id) {
      throw new Error("A node cannot route directly to itself.");
    }
    if (source.kind === "output") {
      throw new Error("The output node cannot be used as a route source.");
    }
    if (destination.kind === "source" || destination.kind === "instrument") {
      throw new Error("Source and instrument nodes cannot receive audio routes.");
    }
    const sourceChannelOffset = whole(
      input.sourceChannelOffset ?? 0,
      0,
      63,
      "Source channel offset",
    );
    const destinationChannelOffset = whole(
      input.destinationChannelOffset ?? 0,
      0,
      63,
      "Destination channel offset",
    );
    const channelCount = whole(input.channelCount, 1, 64, "Channel count");
    if (
      sourceChannelOffset + channelCount > source.outputChannels ||
      destinationChannelOffset + channelCount > destination.inputChannels
    ) {
      throw new Error("Connection channels exceed node channel capacity.");
    }
    if (
      graph.connections.some((connection) =>
        connection.sourceNodeId === source.id &&
        connection.destinationNodeId === destination.id &&
        connection.sourceChannelOffset === sourceChannelOffset &&
        connection.destinationChannelOffset === destinationChannelOffset &&
        connection.channelCount === channelCount
      )
    ) {
      throw new Error("This audio route already exists.");
    }
    const connection: TimelineAudioGraphConnection = {
      id: `timeline-audio-graph-connection-${++this.connectionSequence}`,
      sourceNodeId: source.id,
      destinationNodeId: destination.id,
      sourceChannelOffset,
      destinationChannelOffset,
      channelCount,
      gainDb: gain(input.gainDb ?? 0),
      enabled: input.enabled ?? true,
      order: graph.connections.length,
    };
    const saved = this.save(
      graph,
      { connections: [...graph.connections, connection] },
      input.editedBy,
    );
    this.record(
      graph.id,
      "connection-added",
      connection.id,
      `Audio route added from ${source.name} to ${destination.name}.`,
      input.editedBy,
    );
    return saved;
  }

  validate(input: {
    graphId: TimelineId;
    expectedHead: number;
    validatedBy: TimelineUserId;
  }): TimelineAudioGraphValidation {
    const graph = this.editable(input.graphId, input.expectedHead);
    const issues: TimelineAudioGraphIssue[] = [];
    const master = graph.nodes.filter((node) => node.kind === "master");
    const output = graph.nodes.filter((node) => node.kind === "output");
    if (master.length !== 1) {
      issues.push({
        code: "master-required",
        message: "The graph requires exactly one master node.",
        subjectId: graph.id,
      });
    }
    if (output.length !== 1) {
      issues.push({
        code: "output-required",
        message: "The graph requires exactly one output node.",
        subjectId: graph.id,
      });
    }
    for (const node of graph.nodes) {
      if (!node.available && !node.bypassed) {
        issues.push({
          code: "node-unavailable",
          message: `${node.name} is unavailable and has not been bypassed.`,
          subjectId: node.id,
        });
      }
    }
    const activeConnections = graph.connections.filter(
      (connection) => connection.enabled,
    );
    const incoming = new Map<TimelineId, number>();
    const outgoing = new Map<TimelineId, number>();
    for (const connection of activeConnections) {
      incoming.set(
        connection.destinationNodeId,
        (incoming.get(connection.destinationNodeId) ?? 0) + 1,
      );
      outgoing.set(
        connection.sourceNodeId,
        (outgoing.get(connection.sourceNodeId) ?? 0) + 1,
      );
      const source = graph.nodes.find(
        (node) => node.id === connection.sourceNodeId,
      );
      const destination = graph.nodes.find(
        (node) => node.id === connection.destinationNodeId,
      );
      if (!source || !destination) {
        issues.push({
          code: "route-invalid",
          message: "A route references a missing graph node.",
          subjectId: connection.id,
        });
      } else if (
        connection.sourceChannelOffset + connection.channelCount >
          source.outputChannels ||
        connection.destinationChannelOffset + connection.channelCount >
          destination.inputChannels
      ) {
        issues.push({
          code: "channel-mismatch",
          message: "A route exceeds the connected node channel capacity.",
          subjectId: connection.id,
        });
      }
    }
    for (const node of graph.nodes) {
      if (
        node.kind !== "source" &&
        node.kind !== "instrument" &&
        (incoming.get(node.id) ?? 0) === 0
      ) {
        issues.push({
          code: "node-disconnected",
          message: `${node.name} has no active audio input.`,
          subjectId: node.id,
        });
      }
      if (
        node.kind !== "output" &&
        (outgoing.get(node.id) ?? 0) === 0
      ) {
        issues.push({
          code: "node-disconnected",
          message: `${node.name} has no active audio output route.`,
          subjectId: node.id,
        });
      }
    }
    const processingOrder = this.topologicalOrder(
      graph.nodes,
      activeConnections,
    );
    if (!processingOrder) {
      issues.push({
        code: "feedback-cycle",
        message: "The graph contains an audio feedback cycle.",
        subjectId: graph.id,
      });
    }
    if (
      master.length === 1 &&
      output.length === 1 &&
      !activeConnections.some((connection) =>
        connection.sourceNodeId === master[0].id &&
        connection.destinationNodeId === output[0].id
      )
    ) {
      issues.push({
        code: "route-invalid",
        message: "The master node must route directly to the output node.",
        subjectId: master[0].id,
      });
    }
    const order = processingOrder ?? [];
    const totalLatencySamples = this.maximumPathLatency(
      graph.nodes,
      activeConnections,
      order,
    );
    const valid = issues.length === 0;
    const status: TimelineAudioGraphStatus = valid ? "validated" : "held";
    this.save(
      graph,
      {
        status,
        issues,
        processingOrder: order,
        totalLatencySamples,
      },
      input.validatedBy,
    );
    this.record(
      graph.id,
      valid ? "validated" : "held",
      graph.id,
      valid
        ? "Audio graph passed routing validation."
        : `Audio graph held with ${issues.length} issue(s).`,
      input.validatedBy,
    );
    return {
      valid,
      issues: clone(issues),
      processingOrder: [...order],
      totalLatencySamples,
      validatedAt: this.now().toISOString(),
      validatedBy: input.validatedBy,
    };
  }

  activate(input: {
    graphId: TimelineId;
    expectedHead: number;
    activatedBy: TimelineUserId;
  }): TimelineRealTimeAudioGraph {
    const graph = this.requiredGraph(input.graphId);
    this.assertHead(graph, input.expectedHead);
    if (graph.status !== "validated" || graph.issues.length) {
      throw new Error("Only a validated, issue-free audio graph can activate.");
    }
    const saved = this.save(
      graph,
      { status: "active" },
      input.activatedBy,
    );
    this.record(
      graph.id,
      "activated",
      graph.id,
      "Audio graph activated for real-time execution.",
      input.activatedBy,
    );
    return saved;
  }

  archive(input: {
    graphId: TimelineId;
    expectedHead: number;
    archivedBy: TimelineUserId;
  }): TimelineRealTimeAudioGraph {
    const graph = this.requiredGraph(input.graphId);
    this.assertHead(graph, input.expectedHead);
    if (graph.status === "archived") {
      throw new Error("The audio graph is already archived.");
    }
    const saved = this.save(
      graph,
      { status: "archived" },
      input.archivedBy,
    );
    this.record(
      graph.id,
      "archived",
      graph.id,
      "Audio graph archived.",
      input.archivedBy,
    );
    return saved;
  }

  getGraph(graphId: TimelineId): TimelineRealTimeAudioGraph | null {
    const value = this.graphs.get(graphId);
    return value ? clone(value) : null;
  }

  listGraphs(projectId?: TimelineId): TimelineRealTimeAudioGraph[] {
    return [...this.graphs.values()]
      .filter((graph) => !projectId || graph.projectId === projectId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  listEvents(graphId?: TimelineId): TimelineAudioGraphEvent[] {
    return this.events
      .filter((event) => !graphId || event.graphId === graphId)
      .map(clone);
  }

  exportArchive(): TimelineRealTimeAudioGraphArchive {
    return {
      graphs: this.listGraphs(),
      events: this.listEvents(),
    };
  }

  restoreArchive(archive: TimelineRealTimeAudioGraphArchive): void {
    const graphs = new Map<TimelineId, TimelineRealTimeAudioGraph>();
    const eventIds = new Set<TimelineId>();
    let graphSequence = 0;
    let nodeSequence = 0;
    let connectionSequence = 0;
    let eventSequence = 0;
    for (const graph of archive.graphs) {
      if (graphs.has(graph.id)) {
        throw new Error(`Duplicate audio graph id: ${graph.id}`);
      }
      graphs.set(graph.id, clone(graph));
      graphSequence = Math.max(
        graphSequence,
        this.sequence(graph.id, /^timeline-audio-graph-(\d+)$/),
      );
      for (const node of graph.nodes) {
        nodeSequence = Math.max(
          nodeSequence,
          this.sequence(node.id, /^timeline-audio-graph-node-(\d+)$/),
        );
      }
      for (const connection of graph.connections) {
        connectionSequence = Math.max(
          connectionSequence,
          this.sequence(
            connection.id,
            /^timeline-audio-graph-connection-(\d+)$/,
          ),
        );
      }
    }
    for (const event of archive.events) {
      if (eventIds.has(event.id)) {
        throw new Error(`Duplicate audio graph event id: ${event.id}`);
      }
      if (!graphs.has(event.graphId)) {
        throw new Error("Audio graph event references a missing graph.");
      }
      eventIds.add(event.id);
      eventSequence = Math.max(
        eventSequence,
        this.sequence(event.id, /^timeline-audio-graph-event-(\d+)$/),
      );
    }
    this.graphs.clear();
    for (const [id, graph] of graphs) this.graphs.set(id, graph);
    this.events.splice(0, this.events.length, ...clone(archive.events));
    this.graphSequence = graphSequence;
    this.nodeSequence = nodeSequence;
    this.connectionSequence = connectionSequence;
    this.eventSequence = eventSequence;
  }

  private editable(
    graphId: TimelineId,
    expectedHead: number,
  ): TimelineRealTimeAudioGraph {
    const graph = this.requiredGraph(graphId);
    this.assertHead(graph, expectedHead);
    if (graph.status === "active" || graph.status === "archived") {
      throw new Error("Active or archived audio graphs cannot be edited.");
    }
    return graph;
  }

  private requiredGraph(graphId: TimelineId): TimelineRealTimeAudioGraph {
    const graph = this.graphs.get(graphId);
    if (!graph) throw new Error("Audio graph was not found.");
    return clone(graph);
  }

  private requiredNode(
    graph: TimelineRealTimeAudioGraph,
    nodeId: TimelineId,
  ): TimelineAudioGraphNode {
    const node = graph.nodes.find((value) => value.id === nodeId);
    if (!node) throw new Error("Audio graph node was not found.");
    return node;
  }

  private assertHead(
    graph: TimelineRealTimeAudioGraph,
    expectedHead: number,
  ): void {
    if (graph.head !== expectedHead) {
      throw new Error(
        `Audio graph head conflict: expected ${expectedHead}, current ${graph.head}.`,
      );
    }
  }

  private save(
    graph: TimelineRealTimeAudioGraph,
    patch: Partial<TimelineRealTimeAudioGraph>,
    editedBy: TimelineUserId,
  ): TimelineRealTimeAudioGraph {
    const saved: TimelineRealTimeAudioGraph = {
      ...graph,
      ...clone(patch),
      id: graph.id,
      projectId: graph.projectId,
      head: graph.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: requiredText(editedBy, "Editor identity"),
    };
    this.graphs.set(saved.id, clone(saved));
    return clone(saved);
  }

  private topologicalOrder(
    nodes: TimelineAudioGraphNode[],
    connections: TimelineAudioGraphConnection[],
  ): TimelineId[] | null {
    const indegree = new Map(nodes.map((node) => [node.id, 0]));
    const outgoing = new Map<TimelineId, TimelineId[]>();
    for (const connection of connections) {
      if (
        !indegree.has(connection.sourceNodeId) ||
        !indegree.has(connection.destinationNodeId)
      ) continue;
      indegree.set(
        connection.destinationNodeId,
        (indegree.get(connection.destinationNodeId) ?? 0) + 1,
      );
      const targets = outgoing.get(connection.sourceNodeId) ?? [];
      targets.push(connection.destinationNodeId);
      outgoing.set(connection.sourceNodeId, targets);
    }
    const ready = nodes
      .filter((node) => indegree.get(node.id) === 0)
      .sort((left, right) => left.order - right.order)
      .map((node) => node.id);
    const order: TimelineId[] = [];
    while (ready.length) {
      const id = ready.shift()!;
      order.push(id);
      for (const target of outgoing.get(id) ?? []) {
        const next = (indegree.get(target) ?? 0) - 1;
        indegree.set(target, next);
        if (next === 0) ready.push(target);
      }
    }
    return order.length === nodes.length ? order : null;
  }

  private maximumPathLatency(
    nodes: TimelineAudioGraphNode[],
    connections: TimelineAudioGraphConnection[],
    order: TimelineId[],
  ): number {
    const latency = new Map<TimelineId, number>();
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    for (const nodeId of order) {
      const node = nodeById.get(nodeId);
      if (!node) continue;
      const ownLatency = node.bypassed ? 0 : node.latencySamples;
      const prior = connections
        .filter(
          (connection) =>
            connection.enabled && connection.destinationNodeId === nodeId,
        )
        .map((connection) => latency.get(connection.sourceNodeId) ?? 0);
      latency.set(nodeId, (prior.length ? Math.max(...prior) : 0) + ownLatency);
    }
    return Math.max(0, ...latency.values());
  }

  private record(
    graphId: TimelineId,
    action: TimelineAudioGraphEvent["action"],
    subjectId: TimelineId,
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.events.push({
      id: `timeline-audio-graph-event-${++this.eventSequence}`,
      graphId,
      action,
      subjectId,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy: requiredText(recordedBy, "Event actor"),
    });
  }

  private sequence(id: TimelineId, pattern: RegExp): number {
    const match = pattern.exec(id);
    return match ? Number(match[1]) : 0;
  }
}
