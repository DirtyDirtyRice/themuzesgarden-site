import type {
  TimelineId,
  TimelineProjectId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineSongTrackKind =
  "audio" | "midi" | "automation" | "prompt" | "reference" | "bus" | "folder";

export type TimelineSongTrackState = "active" | "archived" | "trash";

export type TimelineSongTrackRecord = {
  id: TimelineTrackId;
  projectId: TimelineProjectId;
  songId: TimelineId;
  parentTrackId: TimelineTrackId | null;
  title: string;
  kind: TimelineSongTrackKind;
  state: TimelineSongTrackState;
  order: number;
  color: string;
  muted: boolean;
  locked: boolean;
  sourceUri?: string;
  contentFingerprint?: string;
  tags: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  deletedAt?: string;
  deletedBy?: TimelineUserId;
};

export type TimelineSongTrackCreate = {
  id?: TimelineTrackId;
  projectId: TimelineProjectId;
  songId: TimelineId;
  parentTrackId?: TimelineTrackId | null;
  title: string;
  kind: TimelineSongTrackKind;
  order?: number;
  color?: string;
  muted?: boolean;
  locked?: boolean;
  sourceUri?: string;
  contentFingerprint?: string;
  tags?: string[];
};

export type TimelineSongTrackIssue = {
  code:
    | "track-not-found"
    | "track-id-required"
    | "track-id-duplicate"
    | "song-id-required"
    | "project-id-required"
    | "title-required"
    | "parent-not-found"
    | "parent-song-mismatch"
    | "parent-cycle"
    | "invalid-limit"
    | "invalid-cursor";
  message: string;
  trackId?: TimelineTrackId;
  index?: number;
};

export type TimelineSongTrackMutationResult = {
  accepted: boolean;
  tracks: TimelineSongTrackRecord[];
  issues: TimelineSongTrackIssue[];
};

export type TimelineSongTrackQuery = {
  songId: TimelineId;
  states?: TimelineSongTrackState[];
  kinds?: TimelineSongTrackKind[];
  parentTrackId?: TimelineTrackId | null;
  search?: string;
  tags?: string[];
  cursor?: string;
  limit?: number;
};

export type TimelineSongTrackPage = {
  tracks: TimelineSongTrackRecord[];
  total: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
};

export type TimelineSongTrackStatistics = {
  songId: TimelineId;
  total: number;
  active: number;
  archived: number;
  trash: number;
  byKind: Record<TimelineSongTrackKind, number>;
};

export type TimelineSongTrackArchive = {
  tracks: TimelineSongTrackRecord[];
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizeTags(tags: string[] = []): string[] {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ).sort();
}

function encodeCursor(offset: number): string {
  return `song-track-offset-${offset}`;
}

function decodeCursor(cursor?: string): number | null {
  if (!cursor) return 0;
  const match = /^song-track-offset-(\d+)$/.exec(cursor);
  return match ? Number(match[1]) : null;
}

export class TimelineSongTrackRepositoryEngine {
  private readonly tracks = new Map<TimelineTrackId, TimelineSongTrackRecord>();
  private readonly songTrackIds = new Map<TimelineId, Set<TimelineTrackId>>();
  private readonly orderedSongCache = new Map<
    TimelineId,
    TimelineTrackRecordCache
  >();
  private sequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createTrack(
    input: TimelineSongTrackCreate,
    createdBy: TimelineUserId,
  ): TimelineSongTrackMutationResult {
    return this.createTracks([input], createdBy);
  }

  createTracks(
    inputs: TimelineSongTrackCreate[],
    createdBy: TimelineUserId,
  ): TimelineSongTrackMutationResult {
    const issues: TimelineSongTrackIssue[] = [];
    const proposedIds = new Set<TimelineTrackId>();
    const resolved = inputs.map((input, index) => {
      const id = input.id?.trim() || this.nextId();
      const issue = (code: TimelineSongTrackIssue["code"], message: string) =>
        issues.push({ code, message, trackId: id, index });
      if (!id) issue("track-id-required", "Track ID is required.");
      if (this.tracks.has(id) || proposedIds.has(id)) {
        issue("track-id-duplicate", `Track ${id} already exists.`);
      }
      if (!input.projectId.trim()) {
        issue("project-id-required", "Project ID is required.");
      }
      if (!input.songId.trim()) {
        issue("song-id-required", "Song ID is required.");
      }
      if (!input.title.trim()) {
        issue("title-required", "Track title is required.");
      }
      proposedIds.add(id);
      return { input, id, index };
    });
    const proposed = new Map(
      resolved.map(({ input, id }) => [id, input] as const),
    );
    resolved.forEach(({ input, id, index }) => {
      const parentId = input.parentTrackId ?? null;
      const parent = parentId
        ? (this.tracks.get(parentId) ?? proposed.get(parentId))
        : null;
      if (parentId && !parent) {
        issues.push({
          code: "parent-not-found",
          message: `Parent track ${parentId} was not found.`,
          trackId: id,
          index,
        });
      }
      if (
        parentId &&
        parent &&
        (parent.songId !== input.songId || parent.projectId !== input.projectId)
      ) {
        issues.push({
          code: "parent-song-mismatch",
          message:
            "Parent and child tracks must belong to the same song and project.",
          trackId: id,
          index,
        });
      }
      if (parentId === id) {
        issues.push({
          code: "parent-cycle",
          message: "A track cannot be its own parent.",
          trackId: id,
          index,
        });
      }
    });
    if (issues.length > 0) {
      return { accepted: false, tracks: [], issues };
    }

    const now = this.now().toISOString();
    const created = resolved.map(({ input, id }, batchIndex) => {
      const track: TimelineSongTrackRecord = {
        id,
        projectId: input.projectId,
        songId: input.songId,
        parentTrackId: input.parentTrackId ?? null,
        title: input.title.trim(),
        kind: input.kind,
        state: "active",
        order: input.order ?? this.songSize(input.songId) + batchIndex,
        color: input.color?.trim() || "#7dd3fc",
        muted: input.muted ?? false,
        locked: input.locked ?? false,
        sourceUri: input.sourceUri?.trim(),
        contentFingerprint: input.contentFingerprint?.trim(),
        tags: normalizeTags(input.tags),
        createdAt: now,
        createdBy,
        updatedAt: now,
        updatedBy: createdBy,
      };
      this.tracks.set(id, clone(track));
      const songIds = this.songTrackIds.get(track.songId) ?? new Set();
      songIds.add(id);
      this.songTrackIds.set(track.songId, songIds);
      return track;
    });
    new Set(created.map((track) => track.songId)).forEach((songId) =>
      this.invalidateSong(songId),
    );
    return { accepted: true, tracks: clone(created), issues: [] };
  }

  updateTrack(input: {
    trackId: TimelineTrackId;
    patch: Partial<
      Pick<
        TimelineSongTrackRecord,
        | "title"
        | "kind"
        | "order"
        | "color"
        | "muted"
        | "locked"
        | "sourceUri"
        | "contentFingerprint"
        | "tags"
        | "parentTrackId"
      >
    >;
    updatedBy: TimelineUserId;
  }): TimelineSongTrackMutationResult {
    const track = this.tracks.get(input.trackId);
    if (!track) return this.notFound(input.trackId);
    const parentId =
      input.patch.parentTrackId === undefined
        ? track.parentTrackId
        : input.patch.parentTrackId;
    if (parentId && !this.tracks.has(parentId)) {
      return {
        accepted: false,
        tracks: [],
        issues: [
          {
            code: "parent-not-found",
            trackId: track.id,
            message: `Parent track ${parentId} was not found.`,
          },
        ],
      };
    }
    const parent = parentId ? this.tracks.get(parentId) : null;
    if (
      parent &&
      (parent.songId !== track.songId || parent.projectId !== track.projectId)
    ) {
      return {
        accepted: false,
        tracks: [],
        issues: [
          {
            code: "parent-song-mismatch",
            trackId: track.id,
            message:
              "Parent and child tracks must belong to the same song and project.",
          },
        ],
      };
    }
    if (parentId && this.wouldCreateCycle(track.id, parentId)) {
      return {
        accepted: false,
        tracks: [],
        issues: [
          {
            code: "parent-cycle",
            trackId: track.id,
            message: "The parent change would create a track hierarchy cycle.",
          },
        ],
      };
    }
    const next: TimelineSongTrackRecord = {
      ...clone(track),
      ...clone(input.patch),
      title:
        input.patch.title === undefined
          ? track.title
          : input.patch.title.trim(),
      color:
        input.patch.color === undefined
          ? track.color
          : input.patch.color.trim(),
      sourceUri: input.patch.sourceUri?.trim() ?? track.sourceUri,
      contentFingerprint:
        input.patch.contentFingerprint?.trim() ?? track.contentFingerprint,
      tags:
        input.patch.tags === undefined
          ? track.tags
          : normalizeTags(input.patch.tags),
      parentTrackId: parentId,
      updatedAt: this.now().toISOString(),
      updatedBy: input.updatedBy,
    };
    if (!next.title) {
      return {
        accepted: false,
        tracks: [],
        issues: [
          {
            code: "title-required",
            trackId: track.id,
            message: "Track title is required.",
          },
        ],
      };
    }
    this.tracks.set(next.id, clone(next));
    this.invalidateSong(next.songId);
    return { accepted: true, tracks: [clone(next)], issues: [] };
  }

  moveToTrash(input: {
    trackIds: TimelineTrackId[];
    deletedBy: TimelineUserId;
  }): TimelineSongTrackMutationResult {
    return this.changeState(input.trackIds, "trash", input.deletedBy);
  }

  restoreFromTrash(input: {
    trackIds: TimelineTrackId[];
    restoredBy: TimelineUserId;
  }): TimelineSongTrackMutationResult {
    return this.changeState(input.trackIds, "active", input.restoredBy);
  }

  archiveTracks(input: {
    trackIds: TimelineTrackId[];
    archivedBy: TimelineUserId;
  }): TimelineSongTrackMutationResult {
    return this.changeState(input.trackIds, "archived", input.archivedBy);
  }

  getTrack(trackId: TimelineTrackId): TimelineSongTrackRecord | null {
    const track = this.tracks.get(trackId);
    return track ? clone(track) : null;
  }

  query(input: TimelineSongTrackQuery): TimelineSongTrackPage {
    const limit = input.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new Error(`Track query limit must be between 1 and ${MAX_LIMIT}.`);
    }
    const offset = decodeCursor(input.cursor);
    if (offset === null) throw new Error("Track query cursor is invalid.");
    const states = new Set(input.states ?? ["active"]);
    const kinds = input.kinds ? new Set(input.kinds) : null;
    const tags = normalizeTags(input.tags);
    const search = input.search?.trim().toLowerCase() ?? "";
    const parentWasSpecified = Object.prototype.hasOwnProperty.call(
      input,
      "parentTrackId",
    );
    const matches = this.orderedTracks(input.songId).filter((track) => {
      if (!states.has(track.state)) return false;
      if (kinds && !kinds.has(track.kind)) return false;
      if (
        parentWasSpecified &&
        track.parentTrackId !== (input.parentTrackId ?? null)
      ) {
        return false;
      }
      if (
        search &&
        !track.title.toLowerCase().includes(search) &&
        !track.tags.some((tag) => tag.includes(search))
      ) {
        return false;
      }
      if (tags.length && !tags.every((tag) => track.tags.includes(tag))) {
        return false;
      }
      return true;
    });
    const tracks = matches.slice(offset, offset + limit).map(clone);
    const nextOffset = offset + tracks.length;
    const hasMore = nextOffset < matches.length;
    return {
      tracks,
      total: matches.length,
      cursor: input.cursor ?? null,
      nextCursor: hasMore ? encodeCursor(nextOffset) : null,
      hasMore,
    };
  }

  statistics(songId: TimelineId): TimelineSongTrackStatistics {
    const tracks = this.orderedTracks(songId);
    const byKind: Record<TimelineSongTrackKind, number> = {
      audio: 0,
      midi: 0,
      automation: 0,
      prompt: 0,
      reference: 0,
      bus: 0,
      folder: 0,
    };
    tracks.forEach((track) => {
      byKind[track.kind] += 1;
    });
    return {
      songId,
      total: tracks.length,
      active: tracks.filter((track) => track.state === "active").length,
      archived: tracks.filter((track) => track.state === "archived").length,
      trash: tracks.filter((track) => track.state === "trash").length,
      byKind,
    };
  }

  exportArchive(): TimelineSongTrackArchive {
    return {
      tracks: Array.from(this.tracks.values()).map(clone),
    };
  }

  restoreArchive(archive: TimelineSongTrackArchive): void {
    this.tracks.clear();
    this.songTrackIds.clear();
    this.orderedSongCache.clear();
    this.sequence = 0;
    archive.tracks.forEach((track) => {
      if (this.tracks.has(track.id)) {
        throw new Error(`Duplicate track ${track.id} in repository archive.`);
      }
      this.tracks.set(track.id, clone(track));
      const songIds = this.songTrackIds.get(track.songId) ?? new Set();
      songIds.add(track.id);
      this.songTrackIds.set(track.songId, songIds);
      this.sequence = Math.max(this.sequence, this.idSequence(track.id));
    });
  }

  private changeState(
    trackIds: TimelineTrackId[],
    state: TimelineSongTrackState,
    updatedBy: TimelineUserId,
  ): TimelineSongTrackMutationResult {
    const missing = trackIds.filter((id) => !this.tracks.has(id));
    if (missing.length) {
      return {
        accepted: false,
        tracks: [],
        issues: missing.map((trackId) => ({
          code: "track-not-found",
          trackId,
          message: `Track ${trackId} was not found.`,
        })),
      };
    }
    const now = this.now().toISOString();
    const changed = trackIds.map((trackId) => {
      const track = this.tracks.get(trackId)!;
      const next: TimelineSongTrackRecord = {
        ...clone(track),
        state,
        updatedAt: now,
        updatedBy,
        deletedAt: state === "trash" ? now : undefined,
        deletedBy: state === "trash" ? updatedBy : undefined,
      };
      this.tracks.set(trackId, clone(next));
      this.invalidateSong(next.songId);
      return next;
    });
    return { accepted: true, tracks: clone(changed), issues: [] };
  }

  private orderedTracks(songId: TimelineId): TimelineSongTrackRecord[] {
    const ids = this.songTrackIds.get(songId) ?? new Set();
    const cached = this.orderedSongCache.get(songId);
    if (cached && cached.size === ids.size) return cached.tracks;
    const tracks = Array.from(ids)
      .map((id) => this.tracks.get(id))
      .filter((track): track is TimelineSongTrackRecord => Boolean(track))
      .sort(
        (first, second) =>
          first.order - second.order || first.id.localeCompare(second.id),
      );
    this.orderedSongCache.set(songId, { size: ids.size, tracks });
    return tracks;
  }

  private wouldCreateCycle(
    trackId: TimelineTrackId,
    parentTrackId: TimelineTrackId,
  ): boolean {
    const visited = new Set<TimelineTrackId>([trackId]);
    let current: TimelineTrackId | null = parentTrackId;
    while (current) {
      if (visited.has(current)) return true;
      visited.add(current);
      current = this.tracks.get(current)?.parentTrackId ?? null;
    }
    return false;
  }

  private songSize(songId: TimelineId): number {
    return this.songTrackIds.get(songId)?.size ?? 0;
  }

  private invalidateSong(songId: TimelineId): void {
    this.orderedSongCache.delete(songId);
  }

  private nextId(): TimelineTrackId {
    return `timeline-song-track-${++this.sequence}`;
  }

  private idSequence(id: TimelineTrackId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }

  private notFound(trackId: TimelineTrackId): TimelineSongTrackMutationResult {
    return {
      accepted: false,
      tracks: [],
      issues: [
        {
          code: "track-not-found",
          trackId,
          message: `Track ${trackId} was not found.`,
        },
      ],
    };
  }
}

type TimelineTrackRecordCache = {
  size: number;
  tracks: TimelineSongTrackRecord[];
};

export const timelineSongTrackRepositoryEngine =
  new TimelineSongTrackRepositoryEngine();
