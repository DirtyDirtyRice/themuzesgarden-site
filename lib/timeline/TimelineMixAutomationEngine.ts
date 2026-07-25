import { createHash } from "node:crypto";

import {
  TimelineMixSessionEngine,
  type TimelineMixSession,
} from "./TimelineMixSessionEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAutomationTargetKind = "lane" | "bus" | "session";
export type TimelineAutomationWriteMode = "read" | "touch" | "latch" | "write";
export type TimelineAutomationCurve =
  "step" | "linear" | "exponential" | "smooth";

export type TimelineAutomationPoint = {
  id: TimelineId;
  timeSeconds: number;
  value: number;
  curve: TimelineAutomationCurve;
  tension: number;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineAutomationLane = {
  id: TimelineId;
  sessionId: TimelineId;
  targetKind: TimelineAutomationTargetKind;
  targetId: TimelineId;
  parameter: string;
  minimum: number;
  maximum: number;
  defaultValue: number;
  writeMode: TimelineAutomationWriteMode;
  enabled: boolean;
  head: number;
  points: TimelineAutomationPoint[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineAutomationSample = {
  timeSeconds: number;
  value: number;
};

export type TimelineAutomationSnapshot = {
  id: TimelineId;
  sessionId: TimelineId;
  mixHead: number;
  checksum: string;
  lanes: TimelineAutomationLane[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineMixAutomationArchive = {
  lanes: TimelineAutomationLane[];
  snapshots: TimelineAutomationSnapshot[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
}

export class TimelineMixAutomationEngine {
  private readonly lanes = new Map<TimelineId, TimelineAutomationLane>();
  private readonly snapshots = new Map<
    TimelineId,
    TimelineAutomationSnapshot
  >();
  private laneSequence = 0;
  private pointSequence = 0;
  private snapshotSequence = 0;

  constructor(
    readonly mixes = new TimelineMixSessionEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createLane(input: {
    sessionId: TimelineId;
    targetKind: TimelineAutomationTargetKind;
    targetId?: TimelineId;
    parameter: string;
    minimum: number;
    maximum: number;
    defaultValue: number;
    writeMode?: TimelineAutomationWriteMode;
    createdBy: TimelineUserId;
  }): TimelineAutomationLane {
    const session = this.editableSession(input.sessionId);
    this.validateTarget(session, input.targetKind, input.targetId);
    finite(input.minimum, "Minimum");
    finite(input.maximum, "Maximum");
    finite(input.defaultValue, "Default value");
    if (input.minimum >= input.maximum) {
      throw new Error("Automation minimum must be less than maximum.");
    }
    this.validateValue(input.defaultValue, input.minimum, input.maximum);
    const parameter = input.parameter.trim();
    if (!parameter) throw new Error("Automation parameter is required.");
    const targetId =
      input.targetKind === "session" ? session.id : input.targetId!;
    if (
      [...this.lanes.values()].some(
        (lane) =>
          lane.sessionId === session.id &&
          lane.targetKind === input.targetKind &&
          lane.targetId === targetId &&
          lane.parameter === parameter,
      )
    ) {
      throw new Error("An automation lane already controls this parameter.");
    }
    const now = this.now().toISOString();
    const lane: TimelineAutomationLane = {
      id: `timeline-automation-lane-${++this.laneSequence}`,
      sessionId: session.id,
      targetKind: input.targetKind,
      targetId,
      parameter,
      minimum: input.minimum,
      maximum: input.maximum,
      defaultValue: input.defaultValue,
      writeMode: input.writeMode ?? "read",
      enabled: true,
      head: 0,
      points: [],
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.lanes.set(lane.id, clone(lane));
    return clone(lane);
  }

  updateLane(input: {
    laneId: TimelineId;
    expectedHead: number;
    patch: Partial<
      Pick<
        TimelineAutomationLane,
        "minimum" | "maximum" | "defaultValue" | "writeMode" | "enabled"
      >
    >;
    editedBy: TimelineUserId;
  }): TimelineAutomationLane {
    const lane = this.editableLane(input.laneId, input.expectedHead);
    const next = { ...lane, ...clone(input.patch) };
    finite(next.minimum, "Minimum");
    finite(next.maximum, "Maximum");
    finite(next.defaultValue, "Default value");
    if (next.minimum >= next.maximum) {
      throw new Error("Automation minimum must be less than maximum.");
    }
    this.validateValue(next.defaultValue, next.minimum, next.maximum);
    next.points.forEach((point) =>
      this.validateValue(point.value, next.minimum, next.maximum),
    );
    return this.saveEdit(next, input.editedBy);
  }

  addPoint(input: {
    laneId: TimelineId;
    expectedHead: number;
    timeSeconds: number;
    value: number;
    curve?: TimelineAutomationCurve;
    tension?: number;
    editedBy: TimelineUserId;
  }): TimelineAutomationLane {
    const lane = this.editableLane(input.laneId, input.expectedHead);
    this.validateTime(input.timeSeconds);
    this.validateValue(input.value, lane.minimum, lane.maximum);
    this.validateTension(input.tension ?? 0.5);
    if (
      lane.points.some(
        (point) => Math.abs(point.timeSeconds - input.timeSeconds) < 0.000001,
      )
    ) {
      throw new Error("An automation point already exists at this time.");
    }
    const now = this.now().toISOString();
    const point: TimelineAutomationPoint = {
      id: `timeline-automation-point-${++this.pointSequence}`,
      timeSeconds: input.timeSeconds,
      value: input.value,
      curve: input.curve ?? "linear",
      tension: input.tension ?? 0.5,
      createdAt: now,
      createdBy: input.editedBy,
      updatedAt: now,
      updatedBy: input.editedBy,
    };
    return this.saveEdit(
      {
        ...lane,
        points: [...lane.points, point].sort(
          (left, right) =>
            left.timeSeconds - right.timeSeconds ||
            left.id.localeCompare(right.id),
        ),
      },
      input.editedBy,
    );
  }

  updatePoint(input: {
    laneId: TimelineId;
    expectedHead: number;
    pointId: TimelineId;
    patch: Partial<
      Pick<
        TimelineAutomationPoint,
        "timeSeconds" | "value" | "curve" | "tension"
      >
    >;
    editedBy: TimelineUserId;
  }): TimelineAutomationLane {
    const lane = this.editableLane(input.laneId, input.expectedHead);
    const current = lane.points.find((point) => point.id === input.pointId);
    if (!current) throw new Error("Automation point was not found.");
    const next = { ...current, ...clone(input.patch), id: current.id };
    this.validateTime(next.timeSeconds);
    this.validateValue(next.value, lane.minimum, lane.maximum);
    this.validateTension(next.tension);
    if (
      lane.points.some(
        (point) =>
          point.id !== current.id &&
          Math.abs(point.timeSeconds - next.timeSeconds) < 0.000001,
      )
    ) {
      throw new Error("An automation point already exists at this time.");
    }
    const now = this.now().toISOString();
    next.updatedAt = now;
    next.updatedBy = input.editedBy;
    const points = lane.points
      .map((point) => (point.id === next.id ? next : point))
      .sort(
        (left, right) =>
          left.timeSeconds - right.timeSeconds ||
          left.id.localeCompare(right.id),
      );
    return this.saveEdit({ ...lane, points }, input.editedBy);
  }

  removePoint(input: {
    laneId: TimelineId;
    expectedHead: number;
    pointId: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineAutomationLane {
    const lane = this.editableLane(input.laneId, input.expectedHead);
    if (!lane.points.some((point) => point.id === input.pointId)) {
      throw new Error("Automation point was not found.");
    }
    return this.saveEdit(
      {
        ...lane,
        points: lane.points.filter((point) => point.id !== input.pointId),
      },
      input.editedBy,
    );
  }

  recordGesture(input: {
    laneId: TimelineId;
    expectedHead: number;
    samples: Array<{ timeSeconds: number; value: number }>;
    curve?: TimelineAutomationCurve;
    recordedBy: TimelineUserId;
  }): TimelineAutomationLane {
    let lane = this.editableLane(input.laneId, input.expectedHead);
    if (lane.writeMode === "read") {
      throw new Error("Read mode cannot record automation.");
    }
    const samples = [...input.samples].sort(
      (left, right) => left.timeSeconds - right.timeSeconds,
    );
    if (!samples.length) throw new Error("Automation gesture is empty.");
    const seen = new Set<number>();
    samples.forEach((sample) => {
      this.validateTime(sample.timeSeconds);
      this.validateValue(sample.value, lane.minimum, lane.maximum);
      const key = Math.round(sample.timeSeconds * 1_000_000);
      if (seen.has(key)) {
        throw new Error("Automation gesture contains duplicate times.");
      }
      seen.add(key);
    });
    const start = samples[0].timeSeconds;
    const end = samples[samples.length - 1].timeSeconds;
    const retained =
      lane.writeMode === "write"
        ? lane.points.filter(
            (point) => point.timeSeconds < start || point.timeSeconds > end,
          )
        : lane.points;
    const now = this.now().toISOString();
    const additions = samples.map<TimelineAutomationPoint>((sample) => ({
      id: `timeline-automation-point-${++this.pointSequence}`,
      timeSeconds: sample.timeSeconds,
      value: sample.value,
      curve: input.curve ?? "smooth",
      tension: 0.5,
      createdAt: now,
      createdBy: input.recordedBy,
      updatedAt: now,
      updatedBy: input.recordedBy,
    }));
    const byTime = new Map<number, TimelineAutomationPoint>();
    [...retained, ...additions].forEach((point) =>
      byTime.set(Math.round(point.timeSeconds * 1_000_000), point),
    );
    lane = {
      ...lane,
      points: [...byTime.values()].sort(
        (left, right) => left.timeSeconds - right.timeSeconds,
      ),
    };
    return this.saveEdit(lane, input.recordedBy);
  }

  evaluate(laneId: TimelineId, timeSeconds: number): number {
    this.validateTime(timeSeconds);
    const lane = this.requiredLane(laneId);
    if (!lane.enabled || !lane.points.length) return lane.defaultValue;
    const first = lane.points[0];
    const last = lane.points[lane.points.length - 1];
    if (timeSeconds <= first.timeSeconds) return first.value;
    if (timeSeconds >= last.timeSeconds) return last.value;
    const rightIndex = lane.points.findIndex(
      (point) => point.timeSeconds >= timeSeconds,
    );
    const left = lane.points[rightIndex - 1];
    const right = lane.points[rightIndex];
    if (timeSeconds === right.timeSeconds) return right.value;
    const progress =
      (timeSeconds - left.timeSeconds) / (right.timeSeconds - left.timeSeconds);
    return this.interpolate(left, right, progress);
  }

  renderEnvelope(input: {
    laneId: TimelineId;
    startSeconds: number;
    endSeconds: number;
    intervalSeconds: number;
  }): TimelineAutomationSample[] {
    this.validateTime(input.startSeconds);
    this.validateTime(input.endSeconds);
    finite(input.intervalSeconds, "Automation interval");
    if (input.endSeconds < input.startSeconds) {
      throw new Error("Envelope end must not precede its start.");
    }
    if (input.intervalSeconds <= 0) {
      throw new Error("Automation interval must be greater than zero.");
    }
    const samples: TimelineAutomationSample[] = [];
    for (
      let time = input.startSeconds;
      time < input.endSeconds;
      time += input.intervalSeconds
    ) {
      const normalized = Number(time.toFixed(9));
      samples.push({
        timeSeconds: normalized,
        value: this.evaluate(input.laneId, normalized),
      });
      if (samples.length > 1_000_000) {
        throw new Error("Automation envelope exceeds one million samples.");
      }
    }
    samples.push({
      timeSeconds: input.endSeconds,
      value: this.evaluate(input.laneId, input.endSeconds),
    });
    return samples;
  }

  createSnapshot(input: {
    sessionId: TimelineId;
    createdBy: TimelineUserId;
  }): TimelineAutomationSnapshot {
    const session = this.requiredSession(input.sessionId);
    const lanes = this.listLanes(session.id);
    const snapshot: TimelineAutomationSnapshot = {
      id: `timeline-automation-snapshot-${++this.snapshotSequence}`,
      sessionId: session.id,
      mixHead: session.head,
      checksum: checksum(lanes),
      lanes,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.snapshots.set(snapshot.id, clone(snapshot));
    return clone(snapshot);
  }

  verifySnapshot(snapshotId: TimelineId): {
    valid: boolean;
    mixChanged: boolean;
    automationChanged: boolean;
  } {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new Error("Automation snapshot was not found.");
    const session = this.requiredSession(snapshot.sessionId);
    const mixChanged = session.head !== snapshot.mixHead;
    const automationChanged =
      checksum(this.listLanes(snapshot.sessionId)) !== snapshot.checksum;
    return {
      valid: !mixChanged && !automationChanged,
      mixChanged,
      automationChanged,
    };
  }

  getLane(laneId: TimelineId): TimelineAutomationLane | null {
    const lane = this.lanes.get(laneId);
    return lane ? clone(lane) : null;
  }

  listLanes(sessionId: TimelineId): TimelineAutomationLane[] {
    return [...this.lanes.values()]
      .filter((lane) => lane.sessionId === sessionId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineMixAutomationArchive {
    return {
      lanes: [...this.lanes.values()].map(clone),
      snapshots: [...this.snapshots.values()].map(clone),
    };
  }

  restoreArchive(archive: TimelineMixAutomationArchive): void {
    this.assertUnique(archive.lanes, "automation lane");
    this.assertUnique(archive.snapshots, "automation snapshot");
    this.assertUnique(
      archive.lanes.flatMap((lane) => lane.points),
      "automation point",
    );
    archive.lanes.forEach((lane) => {
      this.requiredSession(lane.sessionId);
      lane.points.forEach((point) => {
        this.validateTime(point.timeSeconds);
        this.validateValue(point.value, lane.minimum, lane.maximum);
      });
    });
    this.lanes.clear();
    this.snapshots.clear();
    archive.lanes.forEach((lane) => this.lanes.set(lane.id, clone(lane)));
    archive.snapshots.forEach((snapshot) =>
      this.snapshots.set(snapshot.id, clone(snapshot)),
    );
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.laneSequence = Math.max(
      0,
      ...archive.lanes.map((lane) => sequence(lane.id)),
    );
    this.pointSequence = Math.max(
      0,
      ...archive.lanes
        .flatMap((lane) => lane.points)
        .map((point) => sequence(point.id)),
    );
    this.snapshotSequence = Math.max(
      0,
      ...archive.snapshots.map((snapshot) => sequence(snapshot.id)),
    );
  }

  private interpolate(
    left: TimelineAutomationPoint,
    right: TimelineAutomationPoint,
    progress: number,
  ): number {
    if (left.curve === "step") return left.value;
    let shaped = progress;
    if (left.curve === "exponential") {
      shaped =
        left.value > 0 && right.value > 0
          ? (Math.pow(right.value / left.value, progress) * left.value -
              left.value) /
            (right.value - left.value || 1)
          : progress * progress;
    }
    if (left.curve === "smooth") {
      const smooth = progress * progress * (3 - 2 * progress);
      shaped = progress + (smooth - progress) * left.tension;
    }
    return left.value + (right.value - left.value) * shaped;
  }

  private validateTarget(
    session: TimelineMixSession,
    kind: TimelineAutomationTargetKind,
    targetId?: TimelineId,
  ): void {
    if (kind === "session") {
      if (targetId && targetId !== session.id) {
        throw new Error("Session automation target must be its session.");
      }
      return;
    }
    if (!targetId) throw new Error("Automation target ID is required.");
    const collection = kind === "lane" ? session.lanes : session.buses;
    if (!collection.some((item) => item.id === targetId)) {
      throw new Error(`Automation ${kind} target was not found.`);
    }
  }

  private editableSession(sessionId: TimelineId): TimelineMixSession {
    const session = this.requiredSession(sessionId);
    if (session.status !== "editing") {
      throw new Error("Automation can change only while its mix is editing.");
    }
    return session;
  }

  private requiredSession(sessionId: TimelineId): TimelineMixSession {
    const session = this.mixes.getSession(sessionId);
    if (!session) throw new Error("Mix session was not found.");
    return session;
  }

  private editableLane(
    laneId: TimelineId,
    expectedHead: number,
  ): TimelineAutomationLane {
    const lane = this.requiredLane(laneId);
    this.editableSession(lane.sessionId);
    if (lane.head !== expectedHead) {
      throw new Error(
        `Stale automation head ${expectedHead}; current head is ${lane.head}.`,
      );
    }
    return lane;
  }

  private requiredLane(laneId: TimelineId): TimelineAutomationLane {
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error("Automation lane was not found.");
    return clone(lane);
  }

  private saveEdit(
    lane: TimelineAutomationLane,
    editedBy: TimelineUserId,
  ): TimelineAutomationLane {
    const next = {
      ...clone(lane),
      head: lane.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: editedBy,
    };
    this.lanes.set(next.id, clone(next));
    return clone(next);
  }

  private validateTime(timeSeconds: number): void {
    finite(timeSeconds, "Automation time");
    if (timeSeconds < 0) throw new Error("Automation time cannot be negative.");
  }

  private validateValue(value: number, minimum: number, maximum: number): void {
    finite(value, "Automation value");
    if (value < minimum || value > maximum) {
      throw new Error(
        `Automation value must be between ${minimum} and ${maximum}.`,
      );
    }
  }

  private validateTension(tension: number): void {
    finite(tension, "Automation tension");
    if (tension < 0 || tension > 1) {
      throw new Error("Automation tension must be between 0 and 1.");
    }
  }

  private assertUnique<T extends { id: TimelineId }>(
    values: T[],
    label: string,
  ): void {
    if (new Set(values.map((value) => value.id)).size !== values.length) {
      throw new Error(`Archive contains duplicate ${label} IDs.`);
    }
  }
}

export const timelineMixAutomationEngine = new TimelineMixAutomationEngine();
