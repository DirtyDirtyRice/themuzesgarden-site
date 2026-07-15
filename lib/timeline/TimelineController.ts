// ============================================================================
// lib/timeline/TimelineController.ts
// TIMELINE ENGINE
// CONTROLLER
// CONTINUATION 1
// FOUNDATION
// ============================================================================

import type {
  TimelineEngineState,
  TimelineWorkspace,
  TimelineEvent,
  TimelineTrack,
  TimelineSelection,
  TimelineFilter,
  TimelineId,
  TimelineTrackId,
  TimelineQuery,
  TimelineSearchResult,
} from "./TimelineTypes";

export class TimelineController {
  private state: TimelineEngineState;

  constructor(initialState: TimelineEngineState) {
    this.state = initialState;
  }

  // ==========================================================================
  // STATE
  // ==========================================================================

  getState(): TimelineEngineState {
    return this.state;
  }

  setState(state: TimelineEngineState): void {
    this.state = state;
  }

  // ==========================================================================
  // WORKSPACE
  // ==========================================================================

  getWorkspace(): TimelineWorkspace {
    return this.state.workspace;
  }

  getTracks(): TimelineTrack[] {
    return this.state.workspace.tracks;
  }

  getEvents(): TimelineEvent[] {
    return this.state.workspace.events;
  }

  getSelection(): TimelineSelection {
    return this.state.workspace.selection;
  }

  getFilter(): TimelineFilter {
    return this.state.filter;
  }

  // ==========================================================================
  // LOOKUPS
  // ==========================================================================

  getEvent(eventId: TimelineId): TimelineEvent | undefined {
    return this.state.workspace.events.find(
      (event) => event.id === eventId
    );
  }

  getTrack(trackId: TimelineTrackId): TimelineTrack | undefined {
    return this.state.workspace.tracks.find(
      (track) => track.id === trackId
    );
  }

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  search(query: TimelineQuery): TimelineSearchResult {
    let events = [...this.state.workspace.events];

    if (query.trackId) {
      events = events.filter(
        (event) => event.trackId === query.trackId
      );
    }

    if (query.eventTypes?.length) {
      events = events.filter((event) =>
        query.eventTypes!.includes(event.type)
      );
    }

    if (query.search) {
      const search = query.search.toLowerCase();

      events = events.filter((event) => {
        return (
          event.title.toLowerCase().includes(search) ||
          event.summary?.toLowerCase().includes(search) ||
          event.notes?.toLowerCase().includes(search)
        );
      });
    }

      return {
      query,
      totalMatches: events.length,
      events,
    };
  }

  // ==========================================================================
  // EVENT MANAGEMENT=========================================================================

  hasEvent(eventId: TimelineId): boolean {
    return this.state.workspace.events.some(
      (event) => event.id === eventId
    );
  }

  addEvent(event: TimelineEvent): void {
    this.state.workspace.events.push(event);
  }

  addEvents(events: TimelineEvent[]): void {
    this.state.workspace.events.push(...events);
  }

  updateEvent(
    eventId: TimelineId,
    updates: Partial<TimelineEvent>
  ): boolean {
    const index = this.state.workspace.events.findIndex(
      (event) => event.id === eventId
    );

    if (index < 0) {
      return false;
    }

    this.state.workspace.events[index] = {
      ...this.state.workspace.events[index],
      ...updates,
    };

    return true;
  }

  removeEvent(eventId: TimelineId): boolean {
    const before = this.state.workspace.events.length;

    this.state.workspace.events =
      this.state.workspace.events.filter(
        (event) => event.id !== eventId
      );

    return before !== this.state.workspace.events.length;
  }

  clearEvents(): void {
    this.state.workspace.events = [];
  }

  // ==========================================================================
  // TRACK MANAGEMENT
  // ==========================================================================

  hasTrack(trackId: TimelineTrackId): boolean {
    return this.state.workspace.tracks.some(
      (track) => track.id === trackId
    );
  }

  addTrack(track: TimelineTrack): void {
    this.state.workspace.tracks.push(track);
  }

  updateTrack(
    trackId: TimelineTrackId,
    updates: Partial<TimelineTrack>
  ): boolean {
    const index = this.state.workspace.tracks.findIndex(
      (track) => track.id === trackId
    );

    if (index < 0) {
      return false;
    }

    this.state.workspace.tracks[index] = {
      ...this.state.workspace.tracks[index],
      ...updates,
    };

    return true;
  }

  removeTrack(trackId: TimelineTrackId): boolean {
    const before = this.state.workspace.tracks.length;

    this.state.workspace.tracks =
      this.state.workspace.tracks.filter(
        (track) => track.id !== trackId
      );

    return before !== this.state.workspace.tracks.length;
  }

  clearTracks(): void {
    this.state.workspace.tracks = [];
  }

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  clearSelection(): void {
    this.state.workspace.selection.selectedEventIds = [];
    this.state.workspace.selection.activeEventId = undefined;
    this.state.workspace.selection.anchorEventId = undefined;
  }

  selectEvent(eventId: TimelineId): void {
    if (!this.hasEvent(eventId)) {
      return;
    }

    if (
      !this.state.workspace.selection.selectedEventIds.includes(
        eventId
      )
    ) {
      this.state.workspace.selection.selectedEventIds.push(
        eventId
      );
    }

    this.state.workspace.selection.activeEventId = eventId;
  }

  deselectEvent(eventId: TimelineId): void {
    this.state.workspace.selection.selectedEventIds =
      this.state.workspace.selection.selectedEventIds.filter(
        (id) => id !== eventId
      );

    if (
      this.state.workspace.selection.activeEventId === eventId
    ) {
      this.state.workspace.selection.activeEventId = undefined;
    }
  }

  isSelected(eventId: TimelineId): boolean {
    return this.state.workspace.selection.selectedEventIds.includes(
      eventId
    );
  }

    // ==========================================================================
  // FILTERS
  // ==========================================================================

  setFilter(filter: TimelineFilter): void {
    this.state.filter = filter;
  }

  updateFilter(updates: Partial<TimelineFilter>): void {
    this.state.filter = {
      ...this.state.filter,
      ...updates,
    };
  }

  clearFilter(): void {
    this.state.filter = {};
  }

  getFilteredEvents(): TimelineEvent[] {
    let events = [...this.state.workspace.events];

    const filter = this.state.filter;

    if (filter.eventTypes?.length) {
      events = events.filter((event) =>
        filter.eventTypes!.includes(event.type)
      );
    }

    if (filter.status?.length) {
      events = events.filter((event) =>
        filter.status!.includes(event.status)
      );
    }

    if (filter.visibility?.length) {
      events = events.filter((event) =>
        filter.visibility!.includes(event.visibility)
      );
    }

    if (filter.sources?.length) {
      events = events.filter((event) =>
        filter.sources!.includes(event.source)
      );
    }

    if (filter.priorities?.length) {
      events = events.filter((event) =>
        filter.priorities!.includes(event.priority)
      );
    }

    if (filter.tags?.length) {
      events = events.filter((event) =>
        event.tags.some((tag) => {
          const value =
            typeof tag === "string" ? tag : tag.label;

          return filter.tags!.includes(value);
        })
      );
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();

      events = events.filter((event) => {
        return (
          event.title.toLowerCase().includes(search) ||
          event.summary?.toLowerCase().includes(search) ||
          event.notes?.toLowerCase().includes(search) ||
          event.content?.toLowerCase().includes(search) ||
          event.prompt?.toLowerCase().includes(search) ||
          event.response?.toLowerCase().includes(search)
        );
      });
    }

    if (!filter.includeArchived) {
      events = events.filter((event) => !event.archived);
    }

    if (filter.startTime !== undefined) {
      events = events.filter(
        (event) =>
          (event.startTime ?? 0) >= filter.startTime!
      );
    }

    if (filter.endTime !== undefined) {
      events = events.filter(
        (event) =>
          (event.endTime ?? Number.MAX_SAFE_INTEGER) <=
          filter.endTime!
      );
    }

    return events;
  }

  // ==========================================================================
  // METRICS
  // ==========================================================================

  getEventCount(): number {
    return this.state.workspace.events.length;
  }

  getTrackCount(): number {
    return this.state.workspace.tracks.length;
  }

  getSelectedCount(): number {
    return this.state.workspace.selection.selectedEventIds.length;
  }

  hasEvents(): boolean {
    return this.getEventCount() > 0;
  }

  hasTracks(): boolean {
    return this.getTrackCount() > 0;
  }

    // ==========================================================================
  // SORTING
  // ==========================================================================

  getEventsSortedByTime(): TimelineEvent[] {
    return [...this.state.workspace.events].sort((a, b) => {
      const aTime = a.startTime ?? a.location.seconds;
      const bTime = b.startTime ?? b.location.seconds;

      return aTime - bTime;
    });
  }

  getEventsForTrack(
    trackId: TimelineTrackId
  ): TimelineEvent[] {
    return this.getEventsSortedByTime().filter(
      (event) => event.trackId === trackId
    );
  }

  getEventsByType(
    type: TimelineEvent["type"]
  ): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.type === type
    );
  }

  getEventsByStatus(
    status: TimelineEvent["status"]
  ): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.status === status
    );
  }

    getArchivedEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.archived
    );
  }

  getFavoriteEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.favorite
    );
  }

  getPinnedEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.pinned
    );
  }

  getCompletedEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.completed
    );
  }

  // ==========================================================================
  // PINNING
  // ==========================================================================

  pinEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      pinned: true,
    });
  }

  unpinEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      pinned: false,
    });
  }

  favoriteEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      favorite: true,
    });
  }

  unfavoriteEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      favorite: false,
    });
  }

  archiveEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      archived: true,
    });
  }

  restoreEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      archived: false,
    });
  }

  completeEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      completed: true,
    });
  }

  reopenEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      completed: false,
    });
  }

  lockEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      locked: true,
    });
  }

  unlockEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      locked: false,
    });
  }

  enableEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      enabled: true,
    });
  }

  disableEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      enabled: false,
    });
  }

  hideEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      hidden: true,
    });
  }

  showEvent(eventId: TimelineId): boolean {
    return this.updateEvent(eventId, {
      hidden: false,
    });
  }

  // ==========================================================================
  // CLIPBOARD
  // ==========================================================================

  copySelectedEvents(): TimelineEvent[] {
    const events = this.state.workspace.events.filter((event) =>
      this.state.workspace.selection.selectedEventIds.includes(
        event.id
      )
    );

   this.state.workspace.clipboard.events = [...events];

this.state.workspace.clipboard.copiedAt =
  new Date().toISOString();

this.state.workspace.clipboard.sourceTrackId =
  events[0]?.trackId ?? "";

return events;
  }

clearClipboard(): void {
  this.state.workspace.clipboard.events = [];
  this.state.workspace.clipboard.copiedAt = "";
  this.state.workspace.clipboard.sourceTrackId = "";
}

  getClipboardEvents(): TimelineEvent[] {
    return [...this.state.workspace.clipboard.events];
  }

  pasteClipboard(
    trackId?: TimelineTrackId
  ): TimelineEvent[] {
    const timestamp = Date.now();

    const cloned = this.state.workspace.clipboard.events.map(
      (event, index) => ({
        ...event,
        id: `${event.id}-copy-${timestamp}-${index}`,
        trackId: trackId ?? event.trackId,
        selected: false,
        pinned: false,
        favorite: false,
      })
    );

    this.addEvents(cloned);

this.refreshStatistics();

return cloned;
  }

  // ==========================================================================
  // HISTORY
  // ==========================================================================

  clearHistory(): void {
    this.state.workspace.history = [];
  }

  getHistoryCount(): number {
    return this.state.workspace.history.length;
  }

  getHistory() {
    return [...this.state.workspace.history];
  }

  // ==========================================================================
  // SNAPSHOTS
  // ==========================================================================

  createWorkspaceSnapshot(): TimelineWorkspace {
    return {
      ...this.state.workspace,
      tracks: [...this.state.workspace.tracks],
      events: [...this.state.workspace.events],
      history: [...this.state.workspace.history],
      selection: {
        ...this.state.workspace.selection,
        selectedEventIds: [
          ...this.state.workspace.selection.selectedEventIds,
        ],
      },
      clipboard: {
        ...this.state.workspace.clipboard,
        events: [
          ...this.state.workspace.clipboard.events,
        ],
      },
      viewport: {
        ...this.state.workspace.viewport,
      },
      statistics: {
        ...this.state.workspace.statistics,
      },
    };
  }

  resetWorkspace(
    workspace: TimelineWorkspace
  ): void {
    this.state.workspace = workspace;
  }
// ==========================================================================
// STATISTICS REFRESH
// ==========================================================================

refreshStatistics(): void {
  const stats = this.state.workspace.statistics;

  const events = this.state.workspace.events;

  stats.totalEvents = events.length;

  stats.promptEvents = events.filter(
    (event) => event.type === "prompt"
  ).length;

  stats.lyricEvents = events.filter(
    (event) => event.type === "lyric"
  ).length;

  stats.markerEvents = events.filter(
    (event) => event.type === "marker"
  ).length;

  stats.automationEvents = events.filter(
    (event) => event.type === "automation"
  ).length;

  stats.relationshipEvents = events.filter(
    (event) => event.type === "relationship"
  ).length;

  stats.audioEvents = events.filter(
    (event) => event.type === "audio"
  ).length;

  stats.videoEvents = events.filter(
    (event) => event.type === "video"
  ).length;

  stats.imageEvents = events.filter(
    (event) => event.type === "image"
  ).length;

  stats.aiEvents = events.filter(
    (event) => event.aiGenerated
  ).length;
}

// ==========================================================================
// RUNTIME
// ==========================================================================

initialize(): void {
  this.refreshStatistics();
}
  dispose(): void {
    this.clearSelection();
    this.clearClipboard();
  }

  reset(): void {
    this.clearSelection();
    this.clearFilter();
    this.clearClipboard();
    this.clearHistory();
    this.refreshStatistics();
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  addTrackWithEvents(
    track: TimelineTrack,
    events: TimelineEvent[]
  ): void {
    this.addTrack(track);
    this.addEvents(events);
    this.refreshStatistics();
  }

  removeTrackWithEvents(
    trackId: TimelineTrackId
  ): void {
    this.state.workspace.events =
      this.state.workspace.events.filter(
        (event) => event.trackId !== trackId
      );

    this.removeTrack(trackId);

    this.refreshStatistics();
  }

  replaceEvents(
    events: TimelineEvent[]
  ): void {
    this.state.workspace.events = [...events];
    this.refreshStatistics();
  }

  replaceTracks(
    tracks: TimelineTrack[]
  ): void {
    this.state.workspace.tracks = [...tracks];
    this.refreshStatistics();
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  validate(): boolean {
    for (const event of this.state.workspace.events) {
      if (!event.id) {
        return false;
      }

      if (!event.trackId) {
        return false;
      }

      if (!event.type) {
        return false;
      }
    }

    return true;
  }

  // ==========================================================================
  // EXPORT
  // ==========================================================================

  toJSON() {
    return JSON.parse(
      JSON.stringify(this.state.workspace)
    );
  }

  fromJSON(
    workspace: TimelineWorkspace
  ): void {
    this.resetWorkspace(workspace);
    this.refreshStatistics();
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

   getSummary() {
    return {
      tracks: this.getTrackCount(),
      events: this.getEventCount(),
      selected: this.getSelectedCount(),
      archived: this.getArchivedEvents().length,
      favorites: this.getFavoriteEvents().length,
      pinned: this.getPinnedEvents().length,
      completed: this.getCompletedEvents().length,
      valid: this.validate(),
    };
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  getNextEvent(
    eventId: TimelineId
  ): TimelineEvent | undefined {
    const events = this.getEventsSortedByTime();

    const index = events.findIndex(
      (event) => event.id === eventId
    );

    if (index < 0 || index === events.length - 1) {
      return undefined;
    }

    return events[index + 1];
  }

  getPreviousEvent(
    eventId: TimelineId
  ): TimelineEvent | undefined {
    const events = this.getEventsSortedByTime();

    const index = events.findIndex(
      (event) => event.id === eventId
    );

    if (index <= 0) {
      return undefined;
    }

    return events[index - 1];
  }

  // ==========================================================================
  // DUPLICATION
  // ==========================================================================

  duplicateEvent(
    eventId: TimelineId
  ): TimelineEvent | undefined {
    const event = this.getEvent(eventId);

    if (!event) {
      return undefined;
    }

    const duplicate: TimelineEvent = {
      ...event,
      id: `${event.id}-${Date.now()}`,
      title: `${event.title} Copy`,
      pinned: false,
      favorite: false,
      selected: false,
    };

    this.addEvent(duplicate);

    return duplicate;
  }

  // ==========================================================================
  // COUNTERS
  // ==========================================================================

  countEventsByType(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const event of this.state.workspace.events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }

    return counts;
  }

  countEventsByTrack(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const event of this.state.workspace.events) {
      counts[event.trackId] =
        (counts[event.trackId] ?? 0) + 1;
    }

    return counts;
  }

  // ==========================================================================
  // MAINTENANCE
  // ==========================================================================

  refresh(): void {
    this.refreshStatistics();
  }

  clear(): void {
    this.clearSelection();
    this.clearEvents();
    this.clearTracks();
    this.clearClipboard();
    this.clearHistory();
    this.clearFilter();
    this.refreshStatistics();
  }

  destroy(): void {
    this.clear();
  }

  // ==========================================================================
  // RELATIONSHIPS
  // ==========================================================================

  getRelationships(eventId: TimelineId) {
    const event = this.getEvent(eventId);

    return event?.relationships ?? [];
  }

  getRelatedEvents(
    eventId: TimelineId
  ): TimelineEvent[] {
    const relationships = this.getRelationships(eventId);

    return relationships
      .map((relationship) =>
        this.getEvent(relationship.targetId)
      )
      .filter(
        (event): event is TimelineEvent =>
          event !== undefined
      );
  }

  linkEvents(
    sourceId: TimelineId,
    targetId: TimelineId,
    type: string
  ): boolean {
    const source = this.getEvent(sourceId);

    if (!source) {
      return false;
    }

    source.relationships.push({
      sourceId,
      targetId,
      type,
    });

    return true;
  }

  unlinkEvents(
    sourceId: TimelineId,
    targetId: TimelineId
  ): boolean {
    const source = this.getEvent(sourceId);

    if (!source) {
      return false;
    }

    const before = source.relationships.length;

    source.relationships =
      source.relationships.filter(
        (relationship) =>
          relationship.targetId !== targetId
      );

    return before !== source.relationships.length;
  }

  // ==========================================================================
  // TAGS
  // ==========================================================================

  addTag(
    eventId: TimelineId,
    tag: string
  ): boolean {
    const event = this.getEvent(eventId);

    if (!event) {
      return false;
    }

    if (
      event.tags.some((value) =>
        typeof value === "string"
          ? value === tag
          : value.label === tag
      )
    ) {
      return true;
    }

    event.tags.push(tag as any);

    return true;
  }

  removeTag(
    eventId: TimelineId,
    tag: string
  ): boolean {
    const event = this.getEvent(eventId);

    if (!event) {
      return false;
    }

    const before = event.tags.length;

    event.tags = event.tags.filter((value) =>
      typeof value === "string"
        ? value !== tag
        : value.label !== tag
    );

    return before !== event.tags.length;
  }

  getEventsWithTag(
    tag: string
  ): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) =>
        event.tags.some((value) =>
          typeof value === "string"
            ? value === tag
            : value.label === tag
        )
    );
  }

  // ==========================================================================
  // BOOKMARKS
  // ==========================================================================

  bookmarkEvent(
    eventId: TimelineId
  ): boolean {
    return this.updateEvent(eventId, {
      favorite: true,
      pinned: true,
    });
  }

  unbookmarkEvent(
    eventId: TimelineId
  ): boolean {
    return this.updateEvent(eventId, {
      favorite: false,
      pinned: false,
    });
  }

  // ==========================================================================
  // QUICK STATS
  // ==========================================================================

  getTrackDuration(
    trackId: TimelineTrackId
  ): number {
    const events = this.getEventsForTrack(trackId);

    if (events.length === 0) {
      return 0;
    }

    const first = events[0].location.seconds;

    const last =
      events[events.length - 1].location.seconds;

    return last - first;
  }

  getAverageEventsPerTrack(): number {
    if (this.getTrackCount() === 0) {
      return 0;
    }

    return (
      this.getEventCount() /
      this.getTrackCount()
    );
  }

  getPinnedCount(): number {
    return this.getPinnedEvents().length;
  }

  getFavoriteCount(): number {
    return this.getFavoriteEvents().length;
  }

  getArchivedCount(): number {
    return this.getArchivedEvents().length;
  }

  getCompletedCount(): number {
    return this.getCompletedEvents().length;
  }

    // ==========================================================================
  // IMPORT / EXPORT
  // ==========================================================================

  exportEvents(): TimelineEvent[] {
    return this.state.workspace.events.map((event) => ({
      ...event,
      tags: [...event.tags],
      attachments: [...event.attachments],
      relationships: [...event.relationships],
    }));
  }

  importEvents(events: TimelineEvent[]): void {
    this.state.workspace.events = events.map((event) => ({
      ...event,
      tags: [...event.tags],
      attachments: [...event.attachments],
      relationships: [...event.relationships],
    }));

    this.refreshStatistics();
  }

  exportTracks(): TimelineTrack[] {
    return this.state.workspace.tracks.map((track) => ({
      ...track,
    }));
  }

  importTracks(tracks: TimelineTrack[]): void {
    this.state.workspace.tracks = tracks.map((track) => ({
      ...track,
    }));

    this.refreshStatistics();
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  archiveSelectedEvents(): void {
    for (const id of this.state.workspace.selection.selectedEventIds) {
      this.archiveEvent(id);
    }
  }

  restoreSelectedEvents(): void {
    for (const id of this.state.workspace.selection.selectedEventIds) {
      this.restoreEvent(id);
    }
  }

  deleteSelectedEvents(): void {
    const ids = new Set(
      this.state.workspace.selection.selectedEventIds
    );

    this.state.workspace.events =
      this.state.workspace.events.filter(
        (event) => !ids.has(event.id)
      );

    this.clearSelection();

    this.refreshStatistics();
  }

  duplicateSelectedEvents(): TimelineEvent[] {
    const duplicates: TimelineEvent[] = [];

    for (const id of this.state.workspace.selection.selectedEventIds) {
      const copy = this.duplicateEvent(id);

      if (copy) {
        duplicates.push(copy);
      }
    }

    return duplicates;
  }

  // ==========================================================================
  // TRACK UTILITIES
  // ==========================================================================

  renameTrack(
    trackId: TimelineTrackId,
    title: string
  ): boolean {
    return this.updateTrack(trackId, {
      title,
    });
  }

  getTrackEventCount(
    trackId: TimelineTrackId
  ): number {
    return this.getEventsForTrack(trackId).length;
  }

  getEmptyTracks(): TimelineTrack[] {
    return this.state.workspace.tracks.filter(
      (track) =>
        this.getTrackEventCount(track.id) === 0
    );
  }

  removeEmptyTracks(): number {
    const empty = new Set(
      this.getEmptyTracks().map((track) => track.id)
    );

    const removed = empty.size;

    this.state.workspace.tracks =
      this.state.workspace.tracks.filter(
        (track) => !empty.has(track.id)
      );

    return removed;
  }

  // ==========================================================================
  // RUNTIME INFORMATION
  // ==========================================================================

  getRuntimeInformation() {
    return {
      eventCount: this.getEventCount(),
      trackCount: this.getTrackCount(),
      selectedCount: this.getSelectedCount(),
      archivedCount: this.getArchivedCount(),
      pinnedCount: this.getPinnedCount(),
      favoriteCount: this.getFavoriteCount(),
      completedCount: this.getCompletedCount(),
      averageEventsPerTrack:
        this.getAverageEventsPerTrack(),
      timestamp: new Date().toISOString(),
    };
  }

    // ==========================================================================
  // PLAYBACK
  // ==========================================================================

  getPlaybackQueue(): TimelineEvent[] {
    return this.getEventsSortedByTime().filter(
      (event) => event.enabled && !event.archived
    );
  }

  getPlaybackEvent(
    index: number
  ): TimelineEvent | undefined {
    return this.getPlaybackQueue()[index];
  }

  getPlaybackLength(): number {
    return this.getPlaybackQueue().length;
  }

  getPlaybackIndex(
    eventId: TimelineId
  ): number {
    return this.getPlaybackQueue().findIndex(
      (event) => event.id === eventId
    );
  }

  // ==========================================================================
  // AI HELPERS
  // ==========================================================================

  getAiEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.aiGenerated
    );
  }

  getUserEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => !event.aiGenerated
    );
  }

  getPromptEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.type === "prompt"
    );
  }

  getConversationEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.type === "conversation"
    );
  }

  getAnalysisEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.type === "analysis"
    );
  }

  getAutomationEvents(): TimelineEvent[] {
    return this.state.workspace.events.filter(
      (event) => event.type === "automation"
    );
  }

  // ==========================================================================
  // LOOKUP TABLES
  // ==========================================================================

  getEventMap(): Record<string, TimelineEvent> {
    const map: Record<string, TimelineEvent> = {};

    for (const event of this.state.workspace.events) {
      map[event.id] = event;
    }

    return map;
  }

  getTrackMap(): Record<string, TimelineTrack> {
    const map: Record<string, TimelineTrack> = {};

    for (const track of this.state.workspace.tracks) {
      map[track.id] = track;
    }

    return map;
  }

  // ==========================================================================
  // QUICK LOOKUPS
  // ==========================================================================

  hasArchivedEvents(): boolean {
    return this.getArchivedCount() > 0;
  }

  hasFavoriteEvents(): boolean {
    return this.getFavoriteCount() > 0;
  }

  hasPinnedEvents(): boolean {
    return this.getPinnedCount() > 0;
  }

  hasCompletedEvents(): boolean {
    return this.getCompletedCount() > 0;
  }

  hasAiEvents(): boolean {
    return this.getAiEvents().length > 0;
  }

  // ==========================================================================
  // TIMELINE RANGE
  // ==========================================================================

  getTimelineStart(): number {
    const events = this.getEventsSortedByTime();

    if (events.length === 0) {
      return 0;
    }

    return events[0].location.seconds;
  }

  getTimelineEnd(): number {
    const events = this.getEventsSortedByTime();

    if (events.length === 0) {
      return 0;
    }

    return events[events.length - 1].location.seconds;
  }

  getTimelineDuration(): number {
    return this.getTimelineEnd() - this.getTimelineStart();
  }

    // ==========================================================================
  // ENGINE HEALTH
  // ==========================================================================

  isEmpty(): boolean {
    return (
      this.getTrackCount() === 0 &&
      this.getEventCount() === 0
    );
  }

  isReady(): boolean {
    return !this.isEmpty() && this.validate();
  }

  getHealthReport() {
    return {
      ready: this.isReady(),
      valid: this.validate(),
      tracks: this.getTrackCount(),
      events: this.getEventCount(),
      archived: this.getArchivedCount(),
      completed: this.getCompletedCount(),
      aiEvents: this.getAiEvents().length,
      playbackEvents: this.getPlaybackLength(),
      duration: this.getTimelineDuration(),
    };
  }

  // ==========================================================================
  // ENGINE COMMANDS
  // ==========================================================================

  executeCommand(
    command: string,
    payload?: unknown
  ): boolean {
    switch (command) {
      case "refresh":
        this.refresh();
        return true;

      case "reset":
        this.reset();
        return true;

      case "clear":
        this.clear();
        return true;

      case "validate":
        return this.validate();

      case "initialize":
        this.initialize();
        return true;

      case "dispose":
        this.dispose();
        return true;

      default:
        console.warn(
          `[TimelineController] Unknown command: ${command}`,
          payload
        );
        return false;
    }
  }

  // ==========================================================================
  // SESSION
  // ==========================================================================

  beginSession(): string {
    const sessionId = `timeline-${Date.now()}`;

    this.refreshStatistics();

    return sessionId;
  }

  endSession(): void {
    this.refreshStatistics();
  }

  // ==========================================================================
  // EVENT FLAGS
  // ==========================================================================

  markAiGenerated(
    eventId: TimelineId
  ): boolean {
    return this.updateEvent(eventId, {
      aiGenerated: true,
    });
  }

  markUserGenerated(
    eventId: TimelineId
  ): boolean {
    return this.updateEvent(eventId, {
      aiGenerated: false,
    });
  }

  // ==========================================================================
  // DEBUG
  // ==========================================================================

  dumpEvents(): TimelineEvent[] {
    return [...this.state.workspace.events];
  }

  dumpTracks(): TimelineTrack[] {
    return [...this.state.workspace.tracks];
  }

  dumpWorkspace(): TimelineWorkspace {
    return this.createWorkspaceSnapshot();
  }

  dumpState(): TimelineEngineState {
    return {
      ...this.state,
      workspace: this.createWorkspaceSnapshot(),
    };
  }

  // ==========================================================================
  // ENGINE VERSION
  // ==========================================================================

  getVersion(): string {
    return "1.0.0";
  }

  getControllerName(): string {
    return "TimelineController";
  }

  getControllerInformation() {
    return {
      controller: this.getControllerName(),
      version: this.getVersion(),
      runtime: this.getRuntimeInformation(),
      health: this.getHealthReport(),
    };
  }

    // ==========================================================================
  // DIAGNOSTICS
  // ==========================================================================

  getDuplicateEventIds(): TimelineId[] {
    const seen = new Set<TimelineId>();
    const duplicates = new Set<TimelineId>();

    for (const event of this.state.workspace.events) {
      if (seen.has(event.id)) {
        duplicates.add(event.id);
      }

      seen.add(event.id);
    }

    return [...duplicates];
  }

  getDuplicateTrackIds(): TimelineTrackId[] {
    const seen = new Set<TimelineTrackId>();
    const duplicates = new Set<TimelineTrackId>();

    for (const track of this.state.workspace.tracks) {
      if (seen.has(track.id)) {
        duplicates.add(track.id);
      }

      seen.add(track.id);
    }

    return [...duplicates];
  }

  getOrphanEvents(): TimelineEvent[] {
    const trackIds = new Set(
      this.state.workspace.tracks.map(
        (track) => track.id
      )
    );

    return this.state.workspace.events.filter(
      (event) => !trackIds.has(event.trackId)
    );
  }

  getUnusedTracks(): TimelineTrack[] {
    return this.state.workspace.tracks.filter(
      (track) =>
        !this.state.workspace.events.some(
          (event) => event.trackId === track.id
        )
    );
  }

  getDiagnostics() {
    return {
      duplicateEvents:
        this.getDuplicateEventIds(),

      duplicateTracks:
        this.getDuplicateTrackIds(),

      orphanEvents:
        this.getOrphanEvents(),

      unusedTracks:
        this.getUnusedTracks(),

      valid: this.validate(),

      ready: this.isReady(),
    };
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  getEventTypeStatistics(): Record<
    string,
    number
  > {
    const stats: Record<string, number> = {};

    for (const event of this.state.workspace.events) {
      stats[event.type] =
        (stats[event.type] ?? 0) + 1;
    }

    return stats;
  }

  getStatusStatistics(): Record<
    string,
    number
  > {
    const stats: Record<string, number> = {};

    for (const event of this.state.workspace.events) {
      stats[event.status] =
        (stats[event.status] ?? 0) + 1;
    }

    return stats;
  }

  getPriorityStatistics(): Record<
    string,
    number
  > {
    const stats: Record<string, number> = {};

    for (const event of this.state.workspace.events) {
      stats[event.priority] =
        (stats[event.priority] ?? 0) + 1;
    }

    return stats;
  }

  // ==========================================================================
  // TIMELINE UTILITIES
  // ==========================================================================

  getFirstEvent():
    | TimelineEvent
    | undefined {
    return this.getEventsSortedByTime()[0];
  }

  getLastEvent():
    | TimelineEvent
    | undefined {
    const events =
      this.getEventsSortedByTime();

    return events[events.length - 1];
  }

  jumpToFirstEvent():
    | TimelineEvent
    | undefined {
    const event = this.getFirstEvent();

    if (event) {
      this.selectEvent(event.id);
    }

    return event;
  }

  jumpToLastEvent():
    | TimelineEvent
    | undefined {
    const event = this.getLastEvent();

    if (event) {
      this.selectEvent(event.id);
    }

    return event;
  }

  // ==========================================================================
  // BULK FLAGS
  // ==========================================================================

  enableAllEvents(): void {
    for (const event of this.state.workspace.events) {
      event.enabled = true;
    }
  }

  disableAllEvents(): void {
    for (const event of this.state.workspace.events) {
      event.enabled = false;
    }
  }

  unhideAllEvents(): void {
    for (const event of this.state.workspace.events) {
      event.hidden = false;
    }
  }

  unlockAllEvents(): void {
    for (const event of this.state.workspace.events) {
      event.locked = false;
    }
  }

  unarchiveAllEvents(): void {
    for (const event of this.state.workspace.events) {
      event.archived = false;
    }
  }
}

