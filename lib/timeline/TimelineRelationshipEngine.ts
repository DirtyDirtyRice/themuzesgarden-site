import type {
  TimelineEvent,
  TimelineId,
  TimelineRelationship,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineRelationshipDirection = "outgoing" | "incoming" | "both";

export type TimelineRelationshipEdge = {
  id: TimelineId;
  sourceId: TimelineId;
  targetId: TimelineId;
  type: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type TimelineRelationshipIssue = {
  code:
    | "missing-source"
    | "missing-target"
    | "self-reference"
    | "duplicate-edge"
    | "cycle"
    | "orphan";
  message: string;
  eventId?: TimelineId;
  edgeId?: TimelineId;
};

export type TimelineRelationshipImpact = {
  eventId: TimelineId;
  directDependents: TimelineId[];
  transitiveDependents: TimelineId[];
  dependencies: TimelineId[];
  affectedCount: number;
};

export type TimelineRelationshipSnapshot = {
  generatedAt: string;
  nodes: number;
  edges: number;
  orphanEvents: TimelineId[];
  cycles: TimelineId[][];
  issues: TimelineRelationshipIssue[];
};

function edgeKey(sourceId: TimelineId, targetId: TimelineId, type: string) {
  return `${sourceId}\u0000${targetId}\u0000${type.trim().toLowerCase()}`;
}

function cloneEdge(edge: TimelineRelationshipEdge): TimelineRelationshipEdge {
  return { ...edge, metadata: { ...edge.metadata } };
}

export class TimelineRelationshipEngine {
  private readonly events = new Map<TimelineId, TimelineEvent>();
  private readonly edges = new Map<TimelineId, TimelineRelationshipEdge>();
  private readonly outgoing = new Map<TimelineId, Set<TimelineId>>();
  private readonly incoming = new Map<TimelineId, Set<TimelineId>>();
  private edgeSequence = 0;

  load(workspace: TimelineWorkspace): TimelineRelationshipSnapshot {
    this.reset();
    workspace.events.forEach((event) => this.events.set(event.id, event));
    workspace.events.forEach((event) => {
      event.relationships.forEach((relationship) => {
        this.addRelationship(
          relationship.sourceId || event.id,
          relationship.targetId,
          relationship.type || relationship.relationship || "related",
          { importedFromEvent: event.id },
          relationship.id
        );
      });
    });
    return this.getSnapshot();
  }

  addEvent(event: TimelineEvent): void {
    if (!event.id.trim()) throw new Error("Relationship graph event ID is required.");
    this.events.set(event.id, event);
  }

  removeEvent(eventId: TimelineId, removeEdges = true): boolean {
    if (!this.events.delete(eventId)) return false;
    if (removeEdges) {
      this.getEdges(eventId, "both").forEach((edge) => this.removeRelationship(edge.id));
    }
    return true;
  }

  addRelationship(
    sourceId: TimelineId,
    targetId: TimelineId,
    type: string,
    metadata: Record<string, unknown> = {},
    requestedId?: TimelineId
  ): TimelineRelationshipEdge {
    if (!this.events.has(sourceId)) throw new Error(`Relationship source ${sourceId} does not exist.`);
    if (!this.events.has(targetId)) throw new Error(`Relationship target ${targetId} does not exist.`);
    if (sourceId === targetId) throw new Error("An event cannot relate to itself.");
    if (!type.trim()) throw new Error("Relationship type is required.");

    const key = edgeKey(sourceId, targetId, type);
    const duplicate = Array.from(this.edges.values()).find(
      (edge) => edgeKey(edge.sourceId, edge.targetId, edge.type) === key
    );
    if (duplicate) return cloneEdge(duplicate);

    this.edgeSequence += 1;
    const edge: TimelineRelationshipEdge = {
      id: requestedId?.trim() || `timeline-edge-${this.edgeSequence}`,
      sourceId,
      targetId,
      type: type.trim(),
      createdAt: new Date().toISOString(),
      metadata: { ...metadata },
    };
    if (this.edges.has(edge.id)) throw new Error(`Relationship ID ${edge.id} already exists.`);
    this.edges.set(edge.id, edge);
    this.addIndex(this.outgoing, sourceId, edge.id);
    this.addIndex(this.incoming, targetId, edge.id);
    return cloneEdge(edge);
  }

  private addIndex(index: Map<TimelineId, Set<TimelineId>>, eventId: TimelineId, edgeId: TimelineId) {
    const ids = index.get(eventId) ?? new Set<TimelineId>();
    ids.add(edgeId);
    index.set(eventId, ids);
  }

  removeRelationship(edgeId: TimelineId): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;
    this.edges.delete(edgeId);
    this.outgoing.get(edge.sourceId)?.delete(edgeId);
    this.incoming.get(edge.targetId)?.delete(edgeId);
    return true;
  }

  unlink(sourceId: TimelineId, targetId: TimelineId, type?: string): number {
    const matches = this.getEdges(sourceId, "outgoing").filter(
      (edge) =>
        edge.targetId === targetId &&
        (!type || edge.type.toLowerCase() === type.toLowerCase())
    );
    matches.forEach((edge) => this.removeRelationship(edge.id));
    return matches.length;
  }

  getEdges(
    eventId?: TimelineId,
    direction: TimelineRelationshipDirection = "both",
    type?: string
  ): TimelineRelationshipEdge[] {
    let edgeIds: Set<TimelineId>;
    if (!eventId) {
      edgeIds = new Set(this.edges.keys());
    } else {
      edgeIds = new Set<TimelineId>();
      if (direction !== "incoming") this.outgoing.get(eventId)?.forEach((id) => edgeIds.add(id));
      if (direction !== "outgoing") this.incoming.get(eventId)?.forEach((id) => edgeIds.add(id));
    }
    return Array.from(edgeIds)
      .flatMap((id) => {
        const edge = this.edges.get(id);
        return edge ? [edge] : [];
      })
      .filter((edge) => !type || edge.type.toLowerCase() === type.toLowerCase())
      .map(cloneEdge);
  }

  getRelatedEvents(
    eventId: TimelineId,
    direction: TimelineRelationshipDirection = "both",
    type?: string
  ): TimelineEvent[] {
    const ids = new Set<TimelineId>();
    this.getEdges(eventId, direction, type).forEach((edge) => {
      if (direction !== "incoming" && edge.sourceId === eventId) ids.add(edge.targetId);
      if (direction !== "outgoing" && edge.targetId === eventId) ids.add(edge.sourceId);
    });
    return Array.from(ids).flatMap((id) => {
      const event = this.events.get(id);
      return event ? [event] : [];
    });
  }

  traverse(
    startId: TimelineId,
    direction: Exclude<TimelineRelationshipDirection, "both">,
    maxDepth = Number.MAX_SAFE_INTEGER,
    type?: string
  ): TimelineId[] {
    if (!this.events.has(startId)) return [];
    const visited = new Set<TimelineId>([startId]);
    let frontier = new Set<TimelineId>([startId]);
    for (let depth = 0; depth < maxDepth && frontier.size > 0; depth += 1) {
      const next = new Set<TimelineId>();
      frontier.forEach((id) =>
        this.getRelatedEvents(id, direction, type).forEach((event) => {
          if (!visited.has(event.id)) {
            visited.add(event.id);
            next.add(event.id);
          }
        })
      );
      frontier = next;
    }
    visited.delete(startId);
    return Array.from(visited);
  }

  findShortestPath(sourceId: TimelineId, targetId: TimelineId): TimelineId[] {
    if (!this.events.has(sourceId) || !this.events.has(targetId)) return [];
    if (sourceId === targetId) return [sourceId];
    const queue: TimelineId[][] = [[sourceId]];
    const visited = new Set<TimelineId>([sourceId]);
    while (queue.length) {
      const path = queue.shift()!;
      const current = path[path.length - 1];
      for (const event of this.getRelatedEvents(current, "both")) {
        if (visited.has(event.id)) continue;
        const nextPath = [...path, event.id];
        if (event.id === targetId) return nextPath;
        visited.add(event.id);
        queue.push(nextPath);
      }
    }
    return [];
  }

  findCycles(): TimelineId[][] {
    const cycles: TimelineId[][] = [];
    const seen = new Set<string>();
    const visit = (current: TimelineId, path: TimelineId[], active: Set<TimelineId>) => {
      if (active.has(current)) {
        const start = path.indexOf(current);
        const cycle = [...path.slice(start), current];
        const canonical = [...new Set(cycle)].sort().join("|");
        if (!seen.has(canonical)) {
          seen.add(canonical);
          cycles.push(cycle);
        }
        return;
      }
      active.add(current);
      path.push(current);
      this.getRelatedEvents(current, "outgoing").forEach((event) =>
        visit(event.id, path, active)
      );
      path.pop();
      active.delete(current);
    };
    this.events.forEach((_event, id) => visit(id, [], new Set()));
    return cycles;
  }

  getOrphanEvents(): TimelineEvent[] {
    return Array.from(this.events.values()).filter(
      (event) =>
        (this.outgoing.get(event.id)?.size ?? 0) === 0 &&
        (this.incoming.get(event.id)?.size ?? 0) === 0
    );
  }

  analyzeImpact(eventId: TimelineId): TimelineRelationshipImpact {
    const directDependents = this.getRelatedEvents(eventId, "incoming").map((event) => event.id);
    const transitiveDependents = this.traverse(eventId, "incoming");
    const dependencies = this.traverse(eventId, "outgoing");
    return {
      eventId,
      directDependents,
      transitiveDependents,
      dependencies,
      affectedCount: new Set([...directDependents, ...transitiveDependents]).size,
    };
  }

  exportRelationships(eventId: TimelineId): TimelineRelationship[] {
    return this.getEdges(eventId, "outgoing").map((edge) => ({
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
    }));
  }

  getSnapshot(): TimelineRelationshipSnapshot {
    const cycles = this.findCycles();
    const orphanEvents = this.getOrphanEvents().map((event) => event.id);
    const issues: TimelineRelationshipIssue[] = [
      ...cycles.map((cycle) => ({
        code: "cycle" as const,
        message: `Relationship cycle detected: ${cycle.join(" -> ")}`,
        eventId: cycle[0],
      })),
      ...orphanEvents.map((eventId) => ({
        code: "orphan" as const,
        message: `Event ${eventId} has no relationships.`,
        eventId,
      })),
    ];
    return {
      generatedAt: new Date().toISOString(),
      nodes: this.events.size,
      edges: this.edges.size,
      orphanEvents,
      cycles,
      issues,
    };
  }

  reset(): void {
    this.events.clear();
    this.edges.clear();
    this.outgoing.clear();
    this.incoming.clear();
    this.edgeSequence = 0;
  }
}

export const timelineRelationshipEngine = new TimelineRelationshipEngine();
