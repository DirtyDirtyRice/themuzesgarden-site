import type { TimelineId, TimelineTrackId, TimelineUserId } from "./TimelineTypes";

export type TimelineArrangementStatus = "draft" | "held" | "validated" | "active" | "archived";

export type TimelineArrangementClip = {
  id: TimelineId;
  trackId: TimelineTrackId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  timelineStartTick: number;
  timelineEndTick: number;
  sourceStartSample: number;
  sourceEndSample: number;
  lane: number;
  gainDb: number;
  fadeInTicks: number;
  fadeOutTicks: number;
  muted: boolean;
  reversed: boolean;
  playbackRate: number;
  loop: boolean;
  allowCrossfade: boolean;
  parentClipId: TimelineId | null;
  supersededBy: TimelineId[];
  archived: boolean;
};

export type TimelineArrangementIssue = {
  code: "clip-range-invalid" | "source-range-invalid" | "fade-range-invalid" | "source-identity-missing" | "clip-overlap" | "playback-rate-invalid";
  message: string;
  subjectId: TimelineId;
};

export type TimelineAudioArrangement = {
  id: TimelineId;
  projectId: TimelineId;
  songId: TimelineId;
  multiTrackSessionId: TimelineId;
  transportId: TimelineId;
  name: string;
  sampleRate: number;
  status: TimelineArrangementStatus;
  head: number;
  clips: TimelineArrangementClip[];
  issues: TimelineArrangementIssue[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineArrangementEvent = {
  id: TimelineId;
  arrangementId: TimelineId;
  action: "created" | "clip-added" | "clip-moved" | "clip-trimmed" | "clip-split" | "clip-updated" | "clip-archived" | "clip-restored" | "validated" | "held" | "activated" | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineAudioArrangementArchive = {
  arrangements: TimelineAudioArrangement[];
  events: TimelineArrangementEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

function text(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function whole(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  return value;
}

function finite(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`${label} must be from ${minimum} to ${maximum}.`);
  return value;
}

export class TimelineAudioClipAndArrangementEngine {
  private readonly arrangements = new Map<TimelineId, TimelineAudioArrangement>();
  private readonly events: TimelineArrangementEvent[] = [];
  private arrangementSequence = 0;
  private clipSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createArrangement(input: { projectId: TimelineId; songId: TimelineId; multiTrackSessionId: TimelineId; transportId: TimelineId; name: string; sampleRate: number; createdBy: TimelineUserId }) {
    const timestamp = this.now().toISOString();
    const arrangement: TimelineAudioArrangement = {
      id: `timeline-audio-arrangement-${++this.arrangementSequence}`,
      projectId: text(input.projectId, "Project identity"),
      songId: text(input.songId, "Song identity"),
      multiTrackSessionId: text(input.multiTrackSessionId, "Multi-track session identity"),
      transportId: text(input.transportId, "Transport identity"),
      name: text(input.name, "Arrangement name"),
      sampleRate: whole(input.sampleRate, 8_000, 384_000, "Sample rate"),
      status: "draft", head: 0, clips: [], issues: [],
      createdAt: timestamp, createdBy: text(input.createdBy, "Creator identity"),
      updatedAt: timestamp, updatedBy: input.createdBy,
    };
    this.arrangements.set(arrangement.id, clone(arrangement));
    this.record(arrangement, "created", arrangement.id, "Audio arrangement created.", input.createdBy);
    return clone(arrangement);
  }

  addClip(input: { arrangementId: TimelineId; expectedHead: number; trackId: TimelineTrackId; sourceArtifactId: TimelineId; sourceFingerprint: string; timelineStartTick: number; timelineEndTick: number; sourceStartSample: number; sourceEndSample: number; lane?: number; allowCrossfade?: boolean; editedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const clip = this.makeClip(input);
    this.assertNoInvalidOverlap(arrangement, clip);
    arrangement.clips.push(clip);
    const next = this.save(arrangement, input.editedBy);
    this.record(next, "clip-added", clip.id, "Non-destructive audio clip placed.", input.editedBy);
    return next;
  }

  moveClip(input: { arrangementId: TimelineId; expectedHead: number; clipId: TimelineId; timelineStartTick: number; lane?: number; editedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const clip = this.clip(arrangement, input.clipId);
    const duration = clip.timelineEndTick - clip.timelineStartTick;
    clip.timelineStartTick = whole(input.timelineStartTick, 0, Number.MAX_SAFE_INTEGER, "Timeline start");
    clip.timelineEndTick = clip.timelineStartTick + duration;
    if (input.lane !== undefined) clip.lane = whole(input.lane, 1, 10_000, "Clip lane");
    this.assertNoInvalidOverlap(arrangement, clip);
    const next = this.save(arrangement, input.editedBy);
    this.record(next, "clip-moved", clip.id, "Audio clip moved without changing its source.", input.editedBy);
    return next;
  }

  trimClip(input: { arrangementId: TimelineId; expectedHead: number; clipId: TimelineId; timelineStartTick: number; timelineEndTick: number; sourceStartSample: number; sourceEndSample: number; editedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const clip = this.clip(arrangement, input.clipId);
    clip.timelineStartTick = whole(input.timelineStartTick, 0, Number.MAX_SAFE_INTEGER, "Timeline start");
    clip.timelineEndTick = whole(input.timelineEndTick, 0, Number.MAX_SAFE_INTEGER, "Timeline end");
    clip.sourceStartSample = whole(input.sourceStartSample, 0, Number.MAX_SAFE_INTEGER, "Source start");
    clip.sourceEndSample = whole(input.sourceEndSample, 1, Number.MAX_SAFE_INTEGER, "Source end");
    this.assertClipRanges(clip);
    this.assertNoInvalidOverlap(arrangement, clip);
    const next = this.save(arrangement, input.editedBy);
    this.record(next, "clip-trimmed", clip.id, "Clip boundaries trimmed non-destructively.", input.editedBy);
    return next;
  }

  splitClip(input: { arrangementId: TimelineId; expectedHead: number; clipId: TimelineId; splitTick: number; splitSourceSample: number; editedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const original = this.clip(arrangement, input.clipId);
    const splitTick = whole(input.splitTick, original.timelineStartTick + 1, original.timelineEndTick - 1, "Split tick");
    const splitSample = whole(input.splitSourceSample, original.sourceStartSample + 1, original.sourceEndSample - 1, "Split source sample");
    const left = clone(original);
    const right = clone(original);
    left.id = `timeline-arrangement-clip-${++this.clipSequence}`;
    right.id = `timeline-arrangement-clip-${++this.clipSequence}`;
    left.timelineEndTick = splitTick; left.sourceEndSample = splitSample; left.fadeOutTicks = Math.min(left.fadeOutTicks, splitTick - left.timelineStartTick);
    right.timelineStartTick = splitTick; right.sourceStartSample = splitSample; right.fadeInTicks = Math.min(right.fadeInTicks, right.timelineEndTick - splitTick);
    left.parentClipId = right.parentClipId = original.id;
    left.supersededBy = []; right.supersededBy = [];
    original.archived = true; original.supersededBy = [left.id, right.id];
    arrangement.clips.push(left, right);
    const next = this.save(arrangement, input.editedBy);
    this.record(next, "clip-split", original.id, `Clip split into ${left.id} and ${right.id}.`, input.editedBy);
    return next;
  }

  updateClip(input: { arrangementId: TimelineId; expectedHead: number; clipId: TimelineId; gainDb?: number; fadeInTicks?: number; fadeOutTicks?: number; muted?: boolean; reversed?: boolean; playbackRate?: number; loop?: boolean; allowCrossfade?: boolean; editedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const clip = this.clip(arrangement, input.clipId);
    if (input.gainDb !== undefined) clip.gainDb = finite(input.gainDb, -120, 24, "Clip gain");
    if (input.fadeInTicks !== undefined) clip.fadeInTicks = whole(input.fadeInTicks, 0, Number.MAX_SAFE_INTEGER, "Fade in");
    if (input.fadeOutTicks !== undefined) clip.fadeOutTicks = whole(input.fadeOutTicks, 0, Number.MAX_SAFE_INTEGER, "Fade out");
    if (input.playbackRate !== undefined) clip.playbackRate = finite(input.playbackRate, 0.125, 8, "Playback rate");
    if (input.muted !== undefined) clip.muted = input.muted;
    if (input.reversed !== undefined) clip.reversed = input.reversed;
    if (input.loop !== undefined) clip.loop = input.loop;
    if (input.allowCrossfade !== undefined) clip.allowCrossfade = input.allowCrossfade;
    this.assertClipRanges(clip);
    this.assertNoInvalidOverlap(arrangement, clip);
    const next = this.save(arrangement, input.editedBy);
    this.record(next, "clip-updated", clip.id, "Clip playback properties updated.", input.editedBy);
    return next;
  }

  archiveClip(input: { arrangementId: TimelineId; expectedHead: number; clipId: TimelineId; archivedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const clip = this.clip(arrangement, input.clipId);
    clip.archived = true;
    const next = this.save(arrangement, input.archivedBy);
    this.record(next, "clip-archived", clip.id, "Clip moved to the recoverable archive.", input.archivedBy);
    return next;
  }

  restoreClip(input: { arrangementId: TimelineId; expectedHead: number; clipId: TimelineId; restoredBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    const clip = arrangement.clips.find((item) => item.id === input.clipId);
    if (!clip) throw new Error("Audio clip was not found.");
    if (!clip.archived) throw new Error("Audio clip is not archived.");
    if (clip.supersededBy.length) throw new Error("A superseded clip cannot replace its active split children.");
    clip.archived = false;
    this.assertNoInvalidOverlap(arrangement, clip);
    const next = this.save(arrangement, input.restoredBy);
    this.record(next, "clip-restored", clip.id, "Archived clip restored.", input.restoredBy);
    return next;
  }

  validate(input: { arrangementId: TimelineId; expectedHead: number; validatedBy: TimelineUserId }) {
    const arrangement = this.editable(input.arrangementId, input.expectedHead);
    arrangement.issues = this.inspect(arrangement);
    arrangement.status = arrangement.issues.length ? "held" : "validated";
    const next = this.save(arrangement, input.validatedBy);
    this.record(next, next.status === "held" ? "held" : "validated", next.id, next.status === "held" ? `Arrangement held with ${next.issues.length} issue(s).` : "Arrangement validated.", input.validatedBy);
    return next;
  }

  activate(input: { arrangementId: TimelineId; expectedHead: number; activatedBy: TimelineUserId }) {
    const arrangement = this.required(input.arrangementId);
    this.assertHead(arrangement, input.expectedHead);
    if (arrangement.status !== "validated") throw new Error("Only a validated arrangement can be activated.");
    arrangement.status = "active";
    const next = this.save(arrangement, input.activatedBy);
    this.record(next, "activated", next.id, "Validated audio arrangement activated.", input.activatedBy);
    return next;
  }

  archive(input: { arrangementId: TimelineId; expectedHead: number; archivedBy: TimelineUserId }) {
    const arrangement = this.required(input.arrangementId);
    this.assertHead(arrangement, input.expectedHead);
    if (arrangement.status === "archived") throw new Error("Arrangement is already archived.");
    arrangement.status = "archived";
    const next = this.save(arrangement, input.archivedBy);
    this.record(next, "archived", next.id, "Arrangement archived with all clip history preserved.", input.archivedBy);
    return next;
  }

  getArrangement(id: TimelineId) {
    const value = this.arrangements.get(id);
    return value ? clone(value) : null;
  }

  listClips(arrangementId: TimelineId, filter: { trackId?: TimelineTrackId; lane?: number; startTick?: number; endTick?: number; includeArchived?: boolean } = {}) {
    return this.required(arrangementId).clips.filter((clip) => filter.includeArchived || !clip.archived)
      .filter((clip) => !filter.trackId || clip.trackId === filter.trackId)
      .filter((clip) => filter.lane === undefined || clip.lane === filter.lane)
      .filter((clip) => filter.startTick === undefined || clip.timelineEndTick > filter.startTick)
      .filter((clip) => filter.endTick === undefined || clip.timelineStartTick < filter.endTick)
      .sort((a, b) => a.timelineStartTick - b.timelineStartTick || a.lane - b.lane || a.id.localeCompare(b.id)).map(clone);
  }

  listEvents(arrangementId?: TimelineId) {
    return this.events.filter((event) => !arrangementId || event.arrangementId === arrangementId).map(clone);
  }

  exportArchive(): TimelineAudioArrangementArchive {
    return { arrangements: [...this.arrangements.values()].map(clone), events: this.listEvents() };
  }

  restoreArchive(archive: TimelineAudioArrangementArchive) {
    const arrangementIds = new Set<TimelineId>();
    const clipIds = new Set<TimelineId>();
    for (const arrangement of archive.arrangements) {
      if (arrangementIds.has(arrangement.id)) throw new Error("Duplicate audio arrangement identity.");
      arrangementIds.add(arrangement.id);
      for (const clip of arrangement.clips) {
        if (clipIds.has(clip.id)) throw new Error("Duplicate arrangement clip identity.");
        clipIds.add(clip.id);
      }
    }
    const eventIds = new Set<TimelineId>();
    for (const event of archive.events) {
      if (eventIds.has(event.id)) throw new Error("Duplicate arrangement event identity.");
      if (!arrangementIds.has(event.arrangementId)) throw new Error("Arrangement event refers to a missing arrangement.");
      eventIds.add(event.id);
    }
    this.arrangements.clear(); this.events.splice(0);
    this.arrangementSequence = this.clipSequence = this.eventSequence = 0;
    for (const arrangement of archive.arrangements) {
      this.arrangements.set(arrangement.id, clone(arrangement));
      this.arrangementSequence = Math.max(this.arrangementSequence, this.sequence(arrangement.id));
      arrangement.clips.forEach((clip) => { this.clipSequence = Math.max(this.clipSequence, this.sequence(clip.id)); });
    }
    archive.events.forEach((event) => { this.events.push(clone(event)); this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id)); });
  }

  private makeClip(input: Parameters<TimelineAudioClipAndArrangementEngine["addClip"]>[0]): TimelineArrangementClip {
    const clip: TimelineArrangementClip = {
      id: `timeline-arrangement-clip-${++this.clipSequence}`,
      trackId: text(input.trackId, "Track identity"), sourceArtifactId: text(input.sourceArtifactId, "Source artifact identity"), sourceFingerprint: text(input.sourceFingerprint, "Source fingerprint"),
      timelineStartTick: whole(input.timelineStartTick, 0, Number.MAX_SAFE_INTEGER, "Timeline start"), timelineEndTick: whole(input.timelineEndTick, 1, Number.MAX_SAFE_INTEGER, "Timeline end"),
      sourceStartSample: whole(input.sourceStartSample, 0, Number.MAX_SAFE_INTEGER, "Source start"), sourceEndSample: whole(input.sourceEndSample, 1, Number.MAX_SAFE_INTEGER, "Source end"),
      lane: whole(input.lane ?? 1, 1, 10_000, "Clip lane"), gainDb: 0, fadeInTicks: 0, fadeOutTicks: 0, muted: false, reversed: false, playbackRate: 1, loop: false,
      allowCrossfade: input.allowCrossfade ?? false, parentClipId: null, supersededBy: [], archived: false,
    };
    this.assertClipRanges(clip);
    return clip;
  }

  private inspect(arrangement: TimelineAudioArrangement) {
    const issues: TimelineArrangementIssue[] = [];
    const active = arrangement.clips.filter((clip) => !clip.archived);
    for (const clip of active) {
      if (!clip.sourceArtifactId.trim() || !clip.sourceFingerprint.trim()) issues.push({ code: "source-identity-missing", message: "Clip source identity is incomplete.", subjectId: clip.id });
      if (clip.timelineEndTick <= clip.timelineStartTick) issues.push({ code: "clip-range-invalid", message: "Clip timeline range is invalid.", subjectId: clip.id });
      if (clip.sourceEndSample <= clip.sourceStartSample) issues.push({ code: "source-range-invalid", message: "Clip source range is invalid.", subjectId: clip.id });
      if (clip.fadeInTicks + clip.fadeOutTicks > clip.timelineEndTick - clip.timelineStartTick) issues.push({ code: "fade-range-invalid", message: "Clip fades exceed its duration.", subjectId: clip.id });
      if (clip.playbackRate < 0.125 || clip.playbackRate > 8) issues.push({ code: "playback-rate-invalid", message: "Clip playback rate is invalid.", subjectId: clip.id });
      for (const other of active) {
        if (other.id <= clip.id || other.trackId !== clip.trackId || other.lane !== clip.lane) continue;
        if (clip.timelineStartTick < other.timelineEndTick && clip.timelineEndTick > other.timelineStartTick && !this.crossfadeValid(clip, other)) issues.push({ code: "clip-overlap", message: `Clips ${clip.id} and ${other.id} overlap without a valid crossfade.`, subjectId: clip.id });
      }
    }
    return issues;
  }

  private assertClipRanges(clip: TimelineArrangementClip) {
    if (clip.timelineEndTick <= clip.timelineStartTick) throw new Error("Clip timeline end must be after its start.");
    if (clip.sourceEndSample <= clip.sourceStartSample) throw new Error("Clip source end must be after its start.");
    if (clip.fadeInTicks + clip.fadeOutTicks > clip.timelineEndTick - clip.timelineStartTick) throw new Error("Combined clip fades cannot exceed clip duration.");
  }

  private assertNoInvalidOverlap(arrangement: TimelineAudioArrangement, candidate: TimelineArrangementClip) {
    const conflict = arrangement.clips.find((clip) => !clip.archived && clip.id !== candidate.id && clip.trackId === candidate.trackId && clip.lane === candidate.lane && candidate.timelineStartTick < clip.timelineEndTick && candidate.timelineEndTick > clip.timelineStartTick && !this.crossfadeValid(candidate, clip));
    if (conflict) throw new Error(`Clip overlaps ${conflict.id} on the same track lane.`);
  }

  private crossfadeValid(a: TimelineArrangementClip, b: TimelineArrangementClip) {
    if (!a.allowCrossfade || !b.allowCrossfade) return false;
    const earlier = a.timelineStartTick <= b.timelineStartTick ? a : b;
    const later = earlier === a ? b : a;
    const overlap = earlier.timelineEndTick - later.timelineStartTick;
    return overlap > 0 && earlier.fadeOutTicks >= overlap && later.fadeInTicks >= overlap;
  }

  private clip(arrangement: TimelineAudioArrangement, id: TimelineId) {
    const clip = arrangement.clips.find((item) => item.id === id);
    if (!clip || clip.archived) throw new Error("Active audio clip was not found.");
    return clip;
  }

  private editable(id: TimelineId, expectedHead: number) {
    const arrangement = this.required(id);
    this.assertHead(arrangement, expectedHead);
    if (!["draft", "held"].includes(arrangement.status)) throw new Error(`${arrangement.status} arrangements cannot be edited.`);
    return arrangement;
  }

  private required(id: TimelineId) {
    const value = this.arrangements.get(id);
    if (!value) throw new Error(`Audio arrangement ${id} was not found.`);
    return clone(value);
  }

  private assertHead(arrangement: TimelineAudioArrangement, expectedHead: number) {
    if (arrangement.head !== expectedHead) throw new Error(`Arrangement head conflict: expected ${expectedHead}, current ${arrangement.head}.`);
  }

  private save(arrangement: TimelineAudioArrangement, updatedBy: TimelineUserId) {
    const next = { ...clone(arrangement), head: arrangement.head + 1, updatedAt: this.now().toISOString(), updatedBy: text(updatedBy, "Editor identity") };
    this.arrangements.set(next.id, clone(next));
    return clone(next);
  }

  private record(arrangement: TimelineAudioArrangement, action: TimelineArrangementEvent["action"], subjectId: TimelineId, message: string, recordedBy: TimelineUserId) {
    this.events.push({ id: `timeline-arrangement-event-${++this.eventSequence}`, arrangementId: arrangement.id, action, subjectId, message, recordedAt: this.now().toISOString(), recordedBy });
  }

  private sequence(id: TimelineId) {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineAudioClipAndArrangementEngine = new TimelineAudioClipAndArrangementEngine();
