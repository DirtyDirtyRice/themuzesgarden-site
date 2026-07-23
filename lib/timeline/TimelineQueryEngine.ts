import type {
  TimelineEvent,
  TimelineEventType,
  TimelineId,
  TimelinePriority,
  TimelineQuery,
  TimelineSearchResult,
  TimelineSource,
  TimelineStatus,
  TimelineTrackId,
  TimelineVisibility,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineQuerySort =
  | "time-ascending"
  | "time-descending"
  | "updated-descending"
  | "title-ascending"
  | "relevance";

export type TimelineQueryTagMode = "any" | "all";

export type TimelineAdvancedQuery = TimelineQuery & {
  statuses?: TimelineStatus[];
  sources?: TimelineSource[];
  visibility?: TimelineVisibility[];
  priorities?: TimelinePriority[];
  parentEventId?: TimelineId;
  conversationId?: TimelineId;
  relatedToEventId?: TimelineId;
  aiGenerated?: boolean;
  completed?: boolean;
  pinned?: boolean;
  favorite?: boolean;
  tagMode?: TimelineQueryTagMode;
  sort?: TimelineQuerySort;
  offset?: number;
  limit?: number;
};

export type TimelineQueryMatch = {
  event: TimelineEvent;
  score: number;
  matchedFields: string[];
  matchedTerms: string[];
};

export type TimelineQueryDiagnostics = {
  executionTimeMs: number;
  scannedEvents: number;
  candidateEvents: number;
  returnedEvents: number;
  usedIndexes: string[];
  normalizedTerms: string[];
};

export type TimelineAdvancedSearchResult = TimelineSearchResult & {
  matches: TimelineQueryMatch[];
  offset: number;
  limit: number;
  hasMore: boolean;
  diagnostics: TimelineQueryDiagnostics;
};

export type TimelineSavedQuery = {
  id: TimelineId;
  name: string;
  description: string;
  query: TimelineAdvancedQuery;
  createdAt: string;
  updatedAt: string;
};

type TimelineQueryIndex = {
  byId: Map<TimelineId, TimelineEvent>;
  byTrack: Map<TimelineTrackId, Set<TimelineId>>;
  byType: Map<TimelineEventType, Set<TimelineId>>;
  byStatus: Map<TimelineStatus, Set<TimelineId>>;
  byTag: Map<string, Set<TimelineId>>;
  related: Map<TimelineId, Set<TimelineId>>;
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1_000;

function addToIndex<K>(index: Map<K, Set<TimelineId>>, key: K, eventId: TimelineId) {
  const ids = index.get(key) ?? new Set<TimelineId>();
  ids.add(eventId);
  index.set(key, ids);
}

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    : "";
}

function normalizeTag(value: TimelineEvent["tags"][number]): string {
  return normalizeText(typeof value === "string" ? value : value.label).trim();
}

function getEventTime(event: TimelineEvent): number {
  return event.startTime ?? event.location.seconds;
}

function getSearchFields(event: TimelineEvent): Array<[string, string, number]> {
  return [
    ["title", event.title, 12],
    ["metadata.title", event.metadata?.title, 10],
    ["summary", event.summary, 8],
    ["content", event.content, 6],
    ["lyrics", event.lyric, 6],
    ["prompt", event.prompt, 5],
    ["response", event.response, 5],
    ["notes", event.notes, 4],
    ["metadata.description", event.metadata?.description, 4],
    ["artist", event.author, 3],
    ["genre", event.genre, 3],
    ["mood", event.mood, 3],
  ].map(([field, value, weight]) => [String(field), normalizeText(value), Number(weight)]);
}

function tokenize(search: string | undefined): string[] {
  return Array.from(
    new Set(
      normalizeText(search)
        .split(/[^\p{L}\p{N}]+/u)
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
}

function intersectSets(sets: Set<TimelineId>[]): Set<TimelineId> | null {
  if (sets.length === 0) return null;
  const [smallest, ...rest] = [...sets].sort((a, b) => a.size - b.size);
  return new Set(Array.from(smallest).filter((id) => rest.every((set) => set.has(id))));
}

export class TimelineQueryEngine {
  private workspace: TimelineWorkspace | null = null;
  private index: TimelineQueryIndex = this.createEmptyIndex();
  private readonly savedQueries = new Map<TimelineId, TimelineSavedQuery>();
  private indexedAt: string | null = null;

  private createEmptyIndex(): TimelineQueryIndex {
    return {
      byId: new Map(),
      byTrack: new Map(),
      byType: new Map(),
      byStatus: new Map(),
      byTag: new Map(),
      related: new Map(),
    };
  }

  load(workspace: TimelineWorkspace): void {
    this.workspace = workspace;
    this.rebuildIndex();
  }

  rebuildIndex(): void {
    this.index = this.createEmptyIndex();
    for (const event of this.workspace?.events ?? []) {
      this.index.byId.set(event.id, event);
      addToIndex(this.index.byTrack, event.trackId, event.id);
      addToIndex(this.index.byType, event.type, event.id);
      addToIndex(this.index.byStatus, event.status, event.id);
      event.tags.forEach((tag) => addToIndex(this.index.byTag, normalizeTag(tag), event.id));
      event.relationships.forEach((relationship) => {
        addToIndex(this.index.related, relationship.sourceId, relationship.targetId);
        addToIndex(this.index.related, relationship.targetId, relationship.sourceId);
      });
    }
    this.indexedAt = new Date().toISOString();
  }

  getEvent(eventId: TimelineId): TimelineEvent | null {
    return this.index.byId.get(eventId) ?? null;
  }

  execute(query: TimelineAdvancedQuery = {}): TimelineAdvancedSearchResult {
    const startedAt = performance.now();
    const workspace = this.workspace;
    const allEvents = workspace?.events ?? [];
    const usedIndexes: string[] = [];
    const candidateSets: Set<TimelineId>[] = [];

    if (query.eventIds?.length) {
      candidateSets.push(new Set(query.eventIds.filter((id) => this.index.byId.has(id))));
      usedIndexes.push("eventIds");
    }
    if (query.trackId) {
      candidateSets.push(this.index.byTrack.get(query.trackId) ?? new Set());
      usedIndexes.push("trackId");
    }
    if (query.eventTypes?.length) {
      const ids = new Set<TimelineId>();
      query.eventTypes.forEach((type) => this.index.byType.get(type)?.forEach((id) => ids.add(id)));
      candidateSets.push(ids);
      usedIndexes.push("eventTypes");
    }
    if (query.statuses?.length) {
      const ids = new Set<TimelineId>();
      query.statuses.forEach((status) => this.index.byStatus.get(status)?.forEach((id) => ids.add(id)));
      candidateSets.push(ids);
      usedIndexes.push("statuses");
    }
    if (query.tags?.length) {
      const tagSets = query.tags.map((tag) =>
        this.index.byTag.get(normalizeText(tag)) ?? new Set<TimelineId>()
      );
      const ids =
        query.tagMode === "all"
          ? intersectSets(tagSets) ?? new Set<TimelineId>()
          : new Set(tagSets.flatMap((set) => Array.from(set)));
      candidateSets.push(ids);
      usedIndexes.push(`tags:${query.tagMode ?? "any"}`);
    }
    if (query.relatedToEventId) {
      candidateSets.push(this.index.related.get(query.relatedToEventId) ?? new Set());
      usedIndexes.push("relationships");
    }

    const indexedCandidates = intersectSets(candidateSets);
    let candidates = indexedCandidates
      ? Array.from(indexedCandidates).flatMap((id) => {
          const event = this.index.byId.get(id);
          return event ? [event] : [];
        })
      : [...allEvents];
    const candidateEvents = candidates.length;

    candidates = candidates.filter((event) => {
      if (query.projectId && event.projectId !== query.projectId) return false;
      if (query.startTime !== undefined && getEventTime(event) < query.startTime) return false;
      if (query.endTime !== undefined && (event.endTime ?? getEventTime(event)) > query.endTime) return false;
      if (!query.includeHidden && event.hidden) return false;
      if (!query.includeArchived && event.archived) return false;
      if (query.sources?.length && !query.sources.includes(event.source)) return false;
      if (query.visibility?.length && !query.visibility.includes(event.visibility)) return false;
      if (query.priorities?.length && !query.priorities.includes(event.priority)) return false;
      if (query.parentEventId && event.parentEventId !== query.parentEventId) return false;
      if (query.conversationId && event.conversationId !== query.conversationId) return false;
      if (query.aiGenerated !== undefined && event.aiGenerated !== query.aiGenerated) return false;
      if (query.completed !== undefined && event.completed !== query.completed) return false;
      if (query.pinned !== undefined && event.pinned !== query.pinned) return false;
      if (query.favorite !== undefined && event.favorite !== query.favorite) return false;
      return true;
    });

    const terms = tokenize(query.search);
    let matches: TimelineQueryMatch[] = candidates.flatMap((event) => {
      if (terms.length === 0) return [{ event, score: 0, matchedFields: [], matchedTerms: [] }];
      const matchedFields = new Set<string>();
      const matchedTerms = new Set<string>();
      let score = 0;
      for (const [field, text, weight] of getSearchFields(event)) {
        for (const term of terms) {
          if (text.includes(term)) {
            matchedFields.add(field);
            matchedTerms.add(term);
            score += weight + (text === term ? weight : 0);
          }
        }
      }
      event.tags.forEach((tag) => {
        const text = normalizeTag(tag);
        terms.forEach((term) => {
          if (text.includes(term)) {
            matchedFields.add("tags");
            matchedTerms.add(term);
            score += 7;
          }
        });
      });
      return matchedTerms.size === terms.length
        ? [{ event, score, matchedFields: Array.from(matchedFields), matchedTerms: Array.from(matchedTerms) }]
        : [];
    });

    const sort = query.sort ?? (terms.length ? "relevance" : "time-ascending");
    matches = matches.sort((first, second) => {
      if (sort === "relevance") return second.score - first.score || getEventTime(first.event) - getEventTime(second.event);
      if (sort === "time-descending") return getEventTime(second.event) - getEventTime(first.event);
      if (sort === "updated-descending") {
        return Date.parse(second.event.audit.updatedAt) - Date.parse(first.event.audit.updatedAt);
      }
      if (sort === "title-ascending") return first.event.title.localeCompare(second.event.title);
      return getEventTime(first.event) - getEventTime(second.event);
    });

    const totalMatches = matches.length;
    const offset = Math.max(0, Math.floor(query.offset ?? 0));
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(query.limit ?? DEFAULT_LIMIT)));
    const page = matches.slice(offset, offset + limit);

    return {
      query,
      totalMatches,
      events: page.map((match) => match.event),
      matches: page,
      offset,
      limit,
      hasMore: offset + page.length < totalMatches,
      diagnostics: {
        executionTimeMs: performance.now() - startedAt,
        scannedEvents: allEvents.length,
        candidateEvents,
        returnedEvents: page.length,
        usedIndexes,
        normalizedTerms: terms,
      },
    };
  }

  getRelatedEvents(eventId: TimelineId, depth = 1): TimelineEvent[] {
    const visited = new Set<TimelineId>([eventId]);
    let frontier = new Set<TimelineId>([eventId]);
    for (let level = 0; level < Math.max(0, Math.floor(depth)); level += 1) {
      const next = new Set<TimelineId>();
      frontier.forEach((id) =>
        this.index.related.get(id)?.forEach((relatedId) => {
          if (!visited.has(relatedId)) {
            visited.add(relatedId);
            next.add(relatedId);
          }
        })
      );
      frontier = next;
    }
    visited.delete(eventId);
    return Array.from(visited).flatMap((id) => {
      const event = this.index.byId.get(id);
      return event ? [event] : [];
    });
  }

  saveQuery(input: Omit<TimelineSavedQuery, "createdAt" | "updatedAt">): TimelineSavedQuery {
    if (!input.id.trim() || !input.name.trim()) throw new Error("Saved query requires an ID and name.");
    const now = new Date().toISOString();
    const previous = this.savedQueries.get(input.id);
    const saved: TimelineSavedQuery = {
      ...input,
      query: { ...input.query },
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    this.savedQueries.set(saved.id, saved);
    return { ...saved, query: { ...saved.query } };
  }

  runSavedQuery(queryId: TimelineId): TimelineAdvancedSearchResult {
    const saved = this.savedQueries.get(queryId);
    if (!saved) throw new Error(`Saved query ${queryId} does not exist.`);
    return this.execute(saved.query);
  }

  listSavedQueries(): TimelineSavedQuery[] {
    return Array.from(this.savedQueries.values()).map((saved) => ({
      ...saved,
      query: { ...saved.query },
    }));
  }

  deleteSavedQuery(queryId: TimelineId): boolean {
    return this.savedQueries.delete(queryId);
  }

  getIndexStatus() {
    return {
      indexedAt: this.indexedAt,
      events: this.index.byId.size,
      tracks: this.index.byTrack.size,
      types: this.index.byType.size,
      statuses: this.index.byStatus.size,
      tags: this.index.byTag.size,
      relationshipNodes: this.index.related.size,
    };
  }

  reset(): void {
    this.workspace = null;
    this.index = this.createEmptyIndex();
    this.savedQueries.clear();
    this.indexedAt = null;
  }
}

export const timelineQueryEngine = new TimelineQueryEngine();
