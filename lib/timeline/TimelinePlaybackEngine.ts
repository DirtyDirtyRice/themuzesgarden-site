// ============================================================================
// lib/timeline/TimelinePlaybackEngine.ts
// TIMELINE ENGINE
// PLAYBACK ENGINE
// CONTINUATION 1
// FOUNDATION
// ============================================================================

export class TimelinePlaybackEngine {
  private playing = false;

  constructor() {}

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  initialize(): void {
    this.playing = false;
  }

  dispose(): void {
    this.stopPlayback();
  }

  reset(): void {
    this.stopPlayback();
  }

  // ==========================================================================
  // PLAYBACK
  // ==========================================================================

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  stopPlayback(): void {
    this.playing = false;
  }

  togglePlayback(): void {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  // ==========================================================================
  // STATUS
  // ==========================================================================

  isPlaying(): boolean {
    return this.playing;
  }

  isPaused(): boolean {
    return !this.playing;
  }

  isStopped(): boolean {
    return !this.playing;
  }

  // ==========================================================================
  // INFORMATION
  // ==========================================================================

  getInformation() {
    return {
      playing: this.playing,
    };
  }

  validate(): boolean {
    return true;
  }


  private playbackPosition = 0;

  private playbackDuration = 0;

  private playbackRate = 1;

  private loopEnabled = false;

  private loopStart = 0;

  private loopEnd = 0;

  private muted = false;

  private volume = 1;

  // ==========================================================================
  // TRANSPORT
  // ==========================================================================

  setPlaybackPosition(position: number): void {
    this.playbackPosition = Math.max(0, position);
  }

  getPlaybackPosition(): number {
    return this.playbackPosition;
  }

  seek(position: number): void {
    this.setPlaybackPosition(position);
  }

  rewind(): void {
    this.playbackPosition = 0;
  }

  fastForward(seconds: number): void {
    this.playbackPosition += Math.max(0, seconds);

    if (
      this.playbackDuration > 0 &&
      this.playbackPosition > this.playbackDuration
    ) {
      this.playbackPosition = this.playbackDuration;
    }
  }

  stepForward(): void {
    this.playbackPosition += 1;
  }

  stepBackward(): void {
    this.playbackPosition = Math.max(0, this.playbackPosition - 1);
  }

  // ==========================================================================
  // DURATION
  // ==========================================================================

  setPlaybackDuration(duration: number): void {
    this.playbackDuration = Math.max(0, duration);

    if (this.playbackPosition > this.playbackDuration) {
      this.playbackPosition = this.playbackDuration;
    }
  }

  getPlaybackDuration(): number {
    return this.playbackDuration;
  }

  // ==========================================================================
  // PLAYBACK RATE
  // ==========================================================================

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate > 0 ? rate : 1;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  // ==========================================================================
  // LOOPING
  // ==========================================================================

  enableLoop(start: number, end: number): void {
    this.loopEnabled = true;
    this.loopStart = Math.max(0, start);
    this.loopEnd = Math.max(this.loopStart, end);
  }

  disableLoop(): void {
    this.loopEnabled = false;
  }

  isLoopEnabled(): boolean {
    return this.loopEnabled;
  }

  getLoopRange() {
    return {
      enabled: this.loopEnabled,
      start: this.loopStart,
      end: this.loopEnd,
    };
  }

  // ==========================================================================
  // AUDIO
  // ==========================================================================

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
  }

  getVolume(): number {
    return this.volume;
  }


  // ==========================================================================
  // TIME ADVANCEMENT
  // ==========================================================================

  update(deltaSeconds: number): void {
    if (!this.playing) {
      return;
    }

    this.playbackPosition += deltaSeconds * this.playbackRate;

    if (this.loopEnabled && this.playbackPosition >= this.loopEnd) {
      this.playbackPosition = this.loopStart;
      return;
    }

    if (
      this.playbackDuration > 0 &&
      this.playbackPosition >= this.playbackDuration
    ) {
      this.playbackPosition = this.playbackDuration;
      this.stopPlayback();
    }
  }

  // ==========================================================================
  // SNAPSHOTS
  // ==========================================================================

  getTransportState() {
    return {
      playing: this.playing,
      playbackPosition: this.playbackPosition,
      playbackDuration: this.playbackDuration,
      playbackRate: this.playbackRate,
      loopEnabled: this.loopEnabled,
      loopStart: this.loopStart,
      loopEnd: this.loopEnd,
      muted: this.muted,
      volume: this.volume,
    };
  }

  restoreTransportState(
    state: ReturnType<TimelinePlaybackEngine["getTransportState"]>
  ): void {
    this.playing = state.playing;
    this.playbackPosition = state.playbackPosition;
    this.playbackDuration = state.playbackDuration;
    this.playbackRate = state.playbackRate;
    this.loopEnabled = state.loopEnabled;
    this.loopStart = state.loopStart;
    this.loopEnd = state.loopEnd;
    this.muted = state.muted;
    this.volume = state.volume;
  }

  // ==========================================================================
  // RESET
  // ==========================================================================

  clearPlaybackState(): void {
    this.playing = false;
    this.playbackPosition = 0;
    this.playbackDuration = 0;
    this.playbackRate = 1;
    this.loopEnabled = false;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.muted = false;
    this.volume = 1;
  }

    // ==========================================================================
  // PLAYBACK MARKERS
  // ==========================================================================

  private markers = new Map<string, number>();

  addMarker(name: string, position: number): void {
    this.markers.set(name, Math.max(0, position));
  }

  removeMarker(name: string): boolean {
    return this.markers.delete(name);
  }

  hasMarker(name: string): boolean {
    return this.markers.has(name);
  }

  clearMarkers(): void {
    this.markers.clear();
  }

  getMarker(name: string): number | undefined {
    return this.markers.get(name);
  }

  getMarkers() {
    return Array.from(this.markers.entries()).map(([name, position]) => ({
      name,
      position,
    }));
  }

  jumpToMarker(name: string): boolean {
    const marker = this.markers.get(name);

    if (marker === undefined) {
      return false;
    }

    this.playbackPosition = marker;

    return true;
  }

  // ==========================================================================
  // IN / OUT
  // ==========================================================================

  private inPoint = 0;

  private outPoint = 0;

  setInPoint(position: number): void {
    this.inPoint = Math.max(0, position);

    if (this.outPoint < this.inPoint) {
      this.outPoint = this.inPoint;
    }
  }

  setOutPoint(position: number): void {
    this.outPoint = Math.max(position, this.inPoint);
  }

  clearInOutPoints(): void {
    this.inPoint = 0;
    this.outPoint = this.playbackDuration;
  }

  getInPoint(): number {
    return this.inPoint;
  }

  getOutPoint(): number {
    return this.outPoint;
  }

  jumpToInPoint(): void {
    this.playbackPosition = this.inPoint;
  }

  jumpToOutPoint(): void {
    this.playbackPosition = this.outPoint;
  }

  // ==========================================================================
  // PLAYBACK DIRECTION
  // ==========================================================================

  private reversePlayback = false;

  setReversePlayback(enabled: boolean): void {
    this.reversePlayback = enabled;
  }

  isReversePlayback(): boolean {
    return this.reversePlayback;
  }

  reverse(): void {
    this.reversePlayback = !this.reversePlayback;
  }

  // ==========================================================================
  // FRAME STEPPING
  // ==========================================================================

  private frameRate = 30;

  setFrameRate(frameRate: number): void {
    if (frameRate > 0) {
      this.frameRate = frameRate;
    }
  }

  getFrameRate(): number {
    return this.frameRate;
  }

  getCurrentFrame(): number {
    return Math.floor(this.playbackPosition * this.frameRate);
  }

  stepFrameForward(): void {
    this.playbackPosition += 1 / this.frameRate;
  }

  stepFrameBackward(): void {
    this.playbackPosition = Math.max(
      0,
      this.playbackPosition - 1 / this.frameRate
    );
  }

  // ==========================================================================
  // PLAYBACK METRICS
  // ==========================================================================

  getElapsedTime(): number {
    return this.playbackPosition;
  }

  getRemainingTime(): number {
    return Math.max(0, this.playbackDuration - this.playbackPosition);
  }

  getPlaybackProgress(): number {
    if (this.playbackDuration <= 0) {
      return 0;
    }

    return this.playbackPosition / this.playbackDuration;
  }

  getPlaybackPercentage(): number {
    return Math.round(this.getPlaybackProgress() * 100);
  }

  isAtBeginning(): boolean {
    return this.playbackPosition <= 0;
  }

  isAtEnd(): boolean {
    if (this.playbackDuration <= 0) {
      return false;
    }

    return this.playbackPosition >= this.playbackDuration;
  }

    // ==========================================================================
  // PLAYBACK MODES
  // ==========================================================================

  private shuttleSpeed = 1;

  private transportLocked = false;

  private autoRewind = false;

  private playThroughSelection = false;

  setTransportLocked(locked: boolean): void {
    this.transportLocked = locked;
  }

  isTransportLocked(): boolean {
    return this.transportLocked;
  }

  setShuttleSpeed(speed: number): void {
    this.shuttleSpeed = Math.max(0.1, speed);
  }

  getShuttleSpeed(): number {
    return this.shuttleSpeed;
  }

  increaseShuttleSpeed(amount = 0.25): void {
    this.shuttleSpeed += amount;
  }

  decreaseShuttleSpeed(amount = 0.25): void {
    this.shuttleSpeed = Math.max(0.1, this.shuttleSpeed - amount);
  }

  enableAutoRewind(): void {
    this.autoRewind = true;
  }

  disableAutoRewind(): void {
    this.autoRewind = false;
  }

  isAutoRewindEnabled(): boolean {
    return this.autoRewind;
  }

  enablePlayThroughSelection(): void {
    this.playThroughSelection = true;
  }

  disablePlayThroughSelection(): void {
    this.playThroughSelection = false;
  }

  isPlayThroughSelection(): boolean {
    return this.playThroughSelection;
  }

  // ==========================================================================
  // PLAYBACK COUNTERS
  // ==========================================================================

  private playCount = 0;

  private pauseCount = 0;

  private stopCount = 0;

  private seekCount = 0;

  incrementPlayCount(): void {
    this.playCount++;
  }

  incrementPauseCount(): void {
    this.pauseCount++;
  }

  incrementStopCount(): void {
    this.stopCount++;
  }

  incrementSeekCount(): void {
    this.seekCount++;
  }

  getPlaybackCounters() {
    return {
      plays: this.playCount,
      pauses: this.pauseCount,
      stops: this.stopCount,
      seeks: this.seekCount,
    };
  }

  resetPlaybackCounters(): void {
    this.playCount = 0;
    this.pauseCount = 0;
    this.stopCount = 0;
    this.seekCount = 0;
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  jumpToStart(): void {
    this.playbackPosition = 0;
  }

  jumpToEnd(): void {
    this.playbackPosition = this.playbackDuration;
  }

  moveForward(seconds: number): void {
    this.playbackPosition = Math.min(
      this.playbackDuration,
      this.playbackPosition + Math.max(0, seconds)
    );
  }

  moveBackward(seconds: number): void {
    this.playbackPosition = Math.max(
      0,
      this.playbackPosition - Math.max(0, seconds)
    );
  }

  centerOn(position: number): void {
    this.playbackPosition = Math.max(
      0,
      Math.min(position, this.playbackDuration)
    );
  }

  // ==========================================================================
  // DIAGNOSTICS
  // ==========================================================================

  getDiagnostics() {
    return {
      transportLocked: this.transportLocked,
      reversePlayback: this.reversePlayback,
      shuttleSpeed: this.shuttleSpeed,
      frameRate: this.frameRate,
      markers: this.markers.size,
      playCount: this.playCount,
      pauseCount: this.pauseCount,
      stopCount: this.stopCount,
      seekCount: this.seekCount,
      autoRewind: this.autoRewind,
      playThroughSelection: this.playThroughSelection,
      currentFrame: this.getCurrentFrame(),
      progress: this.getPlaybackProgress(),
      percentage: this.getPlaybackPercentage(),
    };
  }

  resetDiagnostics(): void {
    this.resetPlaybackCounters();
    this.clearMarkers();
  }

    // ==========================================================================
  // PLAYBACK EVENTS
  // ==========================================================================

  private playbackStartedAt: string | null = null;

  private playbackStoppedAt: string | null = null;

  private playbackPausedAt: string | null = null;

  private lastSeekPosition = 0;

  markPlaybackStarted(): void {
    this.playbackStartedAt = new Date().toISOString();
    this.incrementPlayCount();
  }

  markPlaybackPaused(): void {
    this.playbackPausedAt = new Date().toISOString();
    this.incrementPauseCount();
  }

  markPlaybackStopped(): void {
    this.playbackStoppedAt = new Date().toISOString();
    this.incrementStopCount();
  }

  markSeek(position: number): void {
    this.lastSeekPosition = position;
    this.incrementSeekCount();
  }

  getPlaybackEventHistory() {
    return {
      startedAt: this.playbackStartedAt,
      pausedAt: this.playbackPausedAt,
      stoppedAt: this.playbackStoppedAt,
      lastSeekPosition: this.lastSeekPosition,
    };
  }

  clearPlaybackEventHistory(): void {
    this.playbackStartedAt = null;
    this.playbackPausedAt = null;
    this.playbackStoppedAt = null;
    this.lastSeekPosition = 0;
  }

  // ==========================================================================
  // PLAYBACK LIMITS
  // ==========================================================================

  private minimumPlaybackRate = 0.25;

  private maximumPlaybackRate = 4;

  setPlaybackRateLimits(minimum: number, maximum: number): void {
    this.minimumPlaybackRate = Math.max(0.01, minimum);
    this.maximumPlaybackRate = Math.max(
      this.minimumPlaybackRate,
      maximum
    );
  }

  getPlaybackRateLimits() {
    return {
      minimum: this.minimumPlaybackRate,
      maximum: this.maximumPlaybackRate,
    };
  }

  clampPlaybackRate(): void {
    if (this.playbackRate < this.minimumPlaybackRate) {
      this.playbackRate = this.minimumPlaybackRate;
    }

    if (this.playbackRate > this.maximumPlaybackRate) {
      this.playbackRate = this.maximumPlaybackRate;
    }
  }

  increasePlaybackRate(step = 0.25): void {
    this.playbackRate += step;
    this.clampPlaybackRate();
  }

  decreasePlaybackRate(step = 0.25): void {
    this.playbackRate -= step;
    this.clampPlaybackRate();
  }

  resetPlaybackRate(): void {
    this.playbackRate = 1;
  }

  // ==========================================================================
  // LOOP UTILITIES
  // ==========================================================================

  clearLoop(): void {
    this.loopEnabled = false;
    this.loopStart = 0;
    this.loopEnd = 0;
  }

  setLoopToEntirePlayback(): void {
    this.loopEnabled = true;
    this.loopStart = 0;
    this.loopEnd = this.playbackDuration;
  }

  isInsideLoop(): boolean {
    if (!this.loopEnabled) {
      return false;
    }

    return (
      this.playbackPosition >= this.loopStart &&
      this.playbackPosition <= this.loopEnd
    );
  }

  // ==========================================================================
  // VOLUME UTILITIES
  // ==========================================================================

  mute(): void {
    this.muted = true;
  }

  unmute(): void {
    this.muted = false;
  }

  increaseVolume(amount = 0.05): void {
    this.volume = Math.min(1, this.volume + amount);
  }

  decreaseVolume(amount = 0.05): void {
    this.volume = Math.max(0, this.volume - amount);
  }

  resetVolume(): void {
    this.volume = 1;
    this.muted = false;
  }

    // ==========================================================================
  // SESSION STATISTICS
  // ==========================================================================

  private sessionStartTime: string | null = null;

  private sessionEndTime: string | null = null;

  private totalPlaybackSeconds = 0;

  private updateCount = 0;

  startSession(): void {
    this.sessionStartTime = new Date().toISOString();
    this.sessionEndTime = null;
    this.totalPlaybackSeconds = 0;
    this.updateCount = 0;
  }

  endSession(): void {
    this.sessionEndTime = new Date().toISOString();
  }

  addPlaybackTime(seconds: number): void {
    if (seconds > 0) {
      this.totalPlaybackSeconds += seconds;
    }
  }

  incrementUpdateCount(): void {
    this.updateCount++;
  }

  getSessionStatistics() {
    return {
      startedAt: this.sessionStartTime,
      endedAt: this.sessionEndTime,
      totalPlaybackSeconds: this.totalPlaybackSeconds,
      updateCount: this.updateCount,
      playCount: this.playCount,
      pauseCount: this.pauseCount,
      stopCount: this.stopCount,
      seekCount: this.seekCount,
    };
  }

  resetSessionStatistics(): void {
    this.sessionStartTime = null;
    this.sessionEndTime = null;
    this.totalPlaybackSeconds = 0;
    this.updateCount = 0;
  }

  // ==========================================================================
  // BOOKMARKS
  // ==========================================================================

  private bookmarks: number[] = [];

  addBookmark(position: number): void {
    this.bookmarks.push(Math.max(0, position));
    this.bookmarks.sort((a, b) => a - b);
  }

  removeBookmark(index: number): void {
    if (index >= 0 && index < this.bookmarks.length) {
      this.bookmarks.splice(index, 1);
    }
  }

  clearBookmarks(): void {
    this.bookmarks = [];
  }

  getBookmarks(): number[] {
    return [...this.bookmarks];
  }

  jumpToBookmark(index: number): boolean {
    const bookmark = this.bookmarks[index];

    if (bookmark === undefined) {
      return false;
    }

    this.playbackPosition = bookmark;
    return true;
  }

  getNearestBookmark(): number | null {
    if (this.bookmarks.length === 0) {
      return null;
    }

    let nearest = this.bookmarks[0];

    for (const bookmark of this.bookmarks) {
      if (
        Math.abs(bookmark - this.playbackPosition) <
        Math.abs(nearest - this.playbackPosition)
      ) {
        nearest = bookmark;
      }
    }

    return nearest;
  }

  // ==========================================================================
  // SERIALIZATION
  // ==========================================================================

  serialize() {
    return {
      transport: this.getTransportState(),
      diagnostics: this.getDiagnostics(),
      session: this.getSessionStatistics(),
      markers: this.getMarkers(),
      bookmarks: this.getBookmarks(),
      playbackEvents: this.getPlaybackEventHistory(),
      playbackCounters: this.getPlaybackCounters(),
      loopRange: this.getLoopRange(),
    };
  }

  restore(data: ReturnType<TimelinePlaybackEngine["serialize"]>): void {
    this.restoreTransportState(data.transport);

    this.bookmarks = [...data.bookmarks];

    this.clearMarkers();

    for (const marker of data.markers) {
      this.addMarker(marker.name, marker.position);
    }
  }

    // ==========================================================================
  // PLAYBACK QUEUE
  // ==========================================================================

  private queue: number[] = [];

  enqueue(position: number): void {
    this.queue.push(Math.max(0, position));
  }

  dequeue(): number | undefined {
    return this.queue.shift();
  }

  peekQueue(): number | undefined {
    return this.queue[0];
  }

  clearQueue(): void {
    this.queue = [];
  }

  getQueue(): number[] {
    return [...this.queue];
  }

  hasQueuedPositions(): boolean {
    return this.queue.length > 0;
  }

  playNextQueuedPosition(): boolean {
    const next = this.dequeue();

    if (next === undefined) {
      return false;
    }

    this.seek(next);
    this.play();

    return true;
  }

  // ==========================================================================
  // PLAYBACK HISTORY
  // ==========================================================================

  private playbackHistory: number[] = [];

  rememberCurrentPosition(): void {
    this.playbackHistory.push(this.playbackPosition);

    if (this.playbackHistory.length > 250) {
      this.playbackHistory.shift();
    }
  }

  getPlaybackHistory(): number[] {
    return [...this.playbackHistory];
  }

  clearPlaybackHistory(): void {
    this.playbackHistory = [];
  }

  jumpToPreviousPosition(): boolean {
    const previous = this.playbackHistory.pop();

    if (previous === undefined) {
      return false;
    }

    this.seek(previous);

    return true;
  }

  // ==========================================================================
  // RANGE UTILITIES
  // ==========================================================================

  isWithinPlaybackRange(position: number): boolean {
    return (
      position >= 0 &&
      position <= this.playbackDuration
    );
  }

  clampPosition(position: number): number {
    return Math.max(
      0,
      Math.min(position, this.playbackDuration)
    );
  }

  normalizePosition(position: number): number {
    if (this.playbackDuration <= 0) {
      return 0;
    }

    return this.clampPosition(position) / this.playbackDuration;
  }

  // ==========================================================================
  // TRANSPORT SUMMARY
  // ==========================================================================

  getTransportSummary() {
    return {
      playing: this.playing,
      paused: this.isPaused(),
      stopped: this.isStopped(),
      currentTime: this.playbackPosition,
      duration: this.playbackDuration,
      remaining: this.getRemainingTime(),
      frame: this.getCurrentFrame(),
      percentage: this.getPlaybackPercentage(),
      playbackRate: this.playbackRate,
      shuttleSpeed: this.shuttleSpeed,
      volume: this.volume,
      muted: this.muted,
      markers: this.markers.size,
      bookmarks: this.bookmarks.length,
      queuedPositions: this.queue.length,
      historyEntries: this.playbackHistory.length,
      looping: this.loopEnabled,
      reverse: this.reversePlayback,
    };
  }

  // ==========================================================================
  // COMPLETE RESET
  // ==========================================================================

  resetEngine(): void {
    this.clearPlaybackState();
    this.resetPlaybackCounters();
    this.clearPlaybackEventHistory();
    this.resetSessionStatistics();
    this.clearPlaybackHistory();
    this.clearBookmarks();
    this.clearMarkers();
    this.clearQueue();
    this.clearLoop();
  }

    // ==========================================================================
  // PLAYBACK SELECTION
  // ==========================================================================

  private selectionEnabled = false;

  private selectionStart = 0;

  private selectionEnd = 0;

  enableSelection(start: number, end: number): void {
    this.selectionEnabled = true;
    this.selectionStart = Math.max(0, start);
    this.selectionEnd = Math.max(this.selectionStart, end);
  }

  disableSelection(): void {
    this.selectionEnabled = false;
  }

  clearSelection(): void {
    this.selectionEnabled = false;
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  hasSelection(): boolean {
    return this.selectionEnabled;
  }

  getSelection() {
    return {
      enabled: this.selectionEnabled,
      start: this.selectionStart,
      end: this.selectionEnd,
    };
  }

  getSelectionLength(): number {
    if (!this.selectionEnabled) {
      return 0;
    }

    return this.selectionEnd - this.selectionStart;
  }

  isInsideSelection(position = this.playbackPosition): boolean {
    if (!this.selectionEnabled) {
      return false;
    }

    return (
      position >= this.selectionStart &&
      position <= this.selectionEnd
    );
  }

  jumpToSelectionStart(): void {
    if (this.selectionEnabled) {
      this.seek(this.selectionStart);
    }
  }

  jumpToSelectionEnd(): void {
    if (this.selectionEnabled) {
      this.seek(this.selectionEnd);
    }
  }

  // ==========================================================================
  // TRANSPORT FLAGS
  // ==========================================================================

  private scrubbing = false;

  private buffering = false;

  private seeking = false;

  setScrubbing(enabled: boolean): void {
    this.scrubbing = enabled;
  }

  isScrubbing(): boolean {
    return this.scrubbing;
  }

  setBuffering(enabled: boolean): void {
    this.buffering = enabled;
  }

  isBuffering(): boolean {
    return this.buffering;
  }

  setSeeking(enabled: boolean): void {
    this.seeking = enabled;
  }

  isSeeking(): boolean {
    return this.seeking;
  }

  getTransportFlags() {
    return {
      playing: this.playing,
      scrubbing: this.scrubbing,
      buffering: this.buffering,
      seeking: this.seeking,
      transportLocked: this.transportLocked,
    };
  }

  // ==========================================================================
  // ENGINE HEALTH
  // ==========================================================================

  isReady(): boolean {
    return !this.buffering;
  }

  isIdle(): boolean {
    return (
      !this.playing &&
      !this.buffering &&
      !this.scrubbing &&
      !this.seeking
    );
  }

  getStatus(): string {
    if (this.playing) {
      return "playing";
    }

    if (this.buffering) {
      return "buffering";
    }

    if (this.scrubbing) {
      return "scrubbing";
    }

    if (this.seeking) {
      return "seeking";
    }

    return "idle";
  }

  resetTransportFlags(): void {
    this.scrubbing = false;
    this.buffering = false;
    this.seeking = false;
  }

    // ==========================================================================
  // PLAYBACK CALLBACKS
  // ==========================================================================

  private onPlayCallbacks: Array<() => void> = [];

  private onPauseCallbacks: Array<() => void> = [];

  private onStopCallbacks: Array<() => void> = [];

  private onSeekCallbacks: Array<(position: number) => void> = [];

  registerPlayCallback(callback: () => void): void {
    this.onPlayCallbacks.push(callback);
  }

  registerPauseCallback(callback: () => void): void {
    this.onPauseCallbacks.push(callback);
  }

  registerStopCallback(callback: () => void): void {
    this.onStopCallbacks.push(callback);
  }

  registerSeekCallback(callback: (position: number) => void): void {
    this.onSeekCallbacks.push(callback);
  }

  unregisterAllCallbacks(): void {
    this.onPlayCallbacks = [];
    this.onPauseCallbacks = [];
    this.onStopCallbacks = [];
    this.onSeekCallbacks = [];
  }

  notifyPlay(): void {
    for (const callback of this.onPlayCallbacks) {
      callback();
    }
  }

  notifyPause(): void {
    for (const callback of this.onPauseCallbacks) {
      callback();
    }
  }

  notifyStop(): void {
    for (const callback of this.onStopCallbacks) {
      callback();
    }
  }

  notifySeek(position = this.playbackPosition): void {
    for (const callback of this.onSeekCallbacks) {
      callback(position);
    }
  }

  // ==========================================================================
  // TIMELINE SYNCHRONIZATION
  // ==========================================================================

  private synchronized = false;

  private synchronizationOffset = 0;

  setSynchronized(enabled: boolean): void {
    this.synchronized = enabled;
  }

  isSynchronized(): boolean {
    return this.synchronized;
  }

  setSynchronizationOffset(offset: number): void {
    this.synchronizationOffset = offset;
  }

  getSynchronizationOffset(): number {
    return this.synchronizationOffset;
  }

  getSynchronizedPosition(): number {
    return this.playbackPosition + this.synchronizationOffset;
  }

  synchronize(position: number): void {
    this.playbackPosition =
      position - this.synchronizationOffset;
  }

  // ==========================================================================
  // TRANSPORT IDENTIFICATION
  // ==========================================================================

  private transportName = "Playback";

  private transportId = "playback";

  setTransportName(name: string): void {
    this.transportName = name;
  }

  getTransportName(): string {
    return this.transportName;
  }

  setTransportId(id: string): void {
    this.transportId = id;
  }

  getTransportId(): string {
    return this.transportId;
  }

  // ==========================================================================
  // DEBUG INFORMATION
  // ==========================================================================

  getDebugInformation() {
    return {
      id: this.transportId,
      name: this.transportName,
      status: this.getStatus(),
      transport: this.getTransportSummary(),
      session: this.getSessionStatistics(),
      flags: this.getTransportFlags(),
      diagnostics: this.getDiagnostics(),
      synchronized: this.synchronized,
      synchronizationOffset: this.synchronizationOffset,
      callbacks: {
        play: this.onPlayCallbacks.length,
        pause: this.onPauseCallbacks.length,
        stop: this.onStopCallbacks.length,
        seek: this.onSeekCallbacks.length,
      },
    };
  }

    // ==========================================================================
  // PLAYBACK PROFILE
  // ==========================================================================

  private profileName = "Default";

  private profileDescription = "";

  setProfileName(name: string): void {
    this.profileName = name.trim();
  }

  getProfileName(): string {
    return this.profileName;
  }

  setProfileDescription(description: string): void {
    this.profileDescription = description;
  }

  getProfileDescription(): string {
    return this.profileDescription;
  }

  resetProfile(): void {
    this.profileName = "Default";
    this.profileDescription = "";
  }

  // ==========================================================================
  // CUSTOM METADATA
  // ==========================================================================

  private metadata = new Map<string, unknown>();

  setMetadata(key: string, value: unknown): void {
    this.metadata.set(key, value);
  }

  getMetadata<T = unknown>(key: string): T | undefined {
    return this.metadata.get(key) as T | undefined;
  }

  hasMetadata(key: string): boolean {
    return this.metadata.has(key);
  }

  removeMetadata(key: string): boolean {
    return this.metadata.delete(key);
  }

  clearMetadata(): void {
    this.metadata.clear();
  }

  getMetadataEntries() {
    return Array.from(this.metadata.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  // ==========================================================================
  // PLAYBACK TAGS
  // ==========================================================================

  private tags = new Set<string>();

  addTag(tag: string): void {
    this.tags.add(tag.trim());
  }

  removeTag(tag: string): void {
    this.tags.delete(tag);
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  clearTags(): void {
    this.tags.clear();
  }

  getTags(): string[] {
    return Array.from(this.tags.values());
  }

  // ==========================================================================
  // ENGINE SUMMARY
  // ==========================================================================

  getEngineSummary() {
    return {
      id: this.transportId,
      name: this.transportName,
      profile: this.profileName,
      status: this.getStatus(),
      duration: this.playbackDuration,
      position: this.playbackPosition,
      playbackRate: this.playbackRate,
      volume: this.volume,
      muted: this.muted,
      synchronized: this.synchronized,
      selection: this.selectionEnabled,
      looping: this.loopEnabled,
      markers: this.markers.size,
      bookmarks: this.bookmarks.length,
      queue: this.queue.length,
      history: this.playbackHistory.length,
      tags: this.tags.size,
      metadata: this.metadata.size,
    };
  }

  // ==========================================================================
  // FINAL CLEANUP
  // ==========================================================================

  shutdown(): void {
    this.stopPlayback();
    this.unregisterAllCallbacks();
    this.resetEngine();
    this.resetProfile();
    this.clearMetadata();
    this.clearTags();
    this.synchronized = false;
    this.synchronizationOffset = 0;
  }

    // ==========================================================================
  // RUNTIME STATE
  // ==========================================================================

  private runtimeStarted = false;

  private runtimeInitializedAt: string | null = null;

  private runtimeUpdatedAt: string | null = null;

  initializeRuntime(): void {
    this.runtimeStarted = true;
    this.runtimeInitializedAt = new Date().toISOString();
    this.runtimeUpdatedAt = this.runtimeInitializedAt;
  }

  shutdownRuntime(): void {
    this.runtimeStarted = false;
    this.runtimeUpdatedAt = new Date().toISOString();
  }

  touchRuntime(): void {
    this.runtimeUpdatedAt = new Date().toISOString();
  }

  isRuntimeStarted(): boolean {
    return this.runtimeStarted;
  }

  getRuntimeInformation() {
    return {
      started: this.runtimeStarted,
      initializedAt: this.runtimeInitializedAt,
      updatedAt: this.runtimeUpdatedAt,
    };
  }

  // ==========================================================================
  // RUNTIME OPTIONS
  // ==========================================================================

  private options = new Map<string, unknown>();

  setOption(key: string, value: unknown): void {
    this.options.set(key, value);
  }

  getOption<T = unknown>(key: string): T | undefined {
    return this.options.get(key) as T | undefined;
  }

  hasOption(key: string): boolean {
    return this.options.has(key);
  }

  removeOption(key: string): boolean {
    return this.options.delete(key);
  }

  clearOptions(): void {
    this.options.clear();
  }

  getOptions() {
    return Array.from(this.options.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  // ==========================================================================
  // FLAGS
  // ==========================================================================

  private flags = new Set<string>();

  enableFlag(flag: string): void {
    this.flags.add(flag);
  }

  disableFlag(flag: string): void {
    this.flags.delete(flag);
  }

  toggleFlag(flag: string): void {
    if (this.flags.has(flag)) {
      this.flags.delete(flag);
    } else {
      this.flags.add(flag);
    }
  }

  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  clearFlags(): void {
    this.flags.clear();
  }

  getFlags(): string[] {
    return Array.from(this.flags);
  }

  // ==========================================================================
  // STATE EXPORT
  // ==========================================================================

  exportState() {
    return {
      runtime: this.getRuntimeInformation(),
      transport: this.getTransportState(),
      transportSummary: this.getTransportSummary(),
      diagnostics: this.getDiagnostics(),
      debug: this.getDebugInformation(),
      session: this.getSessionStatistics(),
      profile: {
        name: this.profileName,
        description: this.profileDescription,
      },
      metadata: this.getMetadataEntries(),
      options: this.getOptions(),
      flags: this.getFlags(),
      tags: this.getTags(),
      bookmarks: this.getBookmarks(),
      markers: this.getMarkers(),
      queue: this.getQueue(),
      history: this.getPlaybackHistory(),
      selection: this.getSelection(),
      playbackEvents: this.getPlaybackEventHistory(),
      playbackCounters: this.getPlaybackCounters(),
      engineSummary: this.getEngineSummary(),
    };
  }

  // ==========================================================================
  // STATE IMPORT
  // ==========================================================================

  importState(
    state: ReturnType<TimelinePlaybackEngine["exportState"]>
  ): void {
    this.restoreTransportState(state.transport);

    this.resetProfile();
    this.profileName = state.profile.name;
    this.profileDescription = state.profile.description;

    this.clearMetadata();

    for (const item of state.metadata) {
      this.metadata.set(item.key, item.value);
    }

    this.clearOptions();

    for (const item of state.options) {
      this.options.set(item.key, item.value);
    }

    this.clearFlags();

    for (const flag of state.flags) {
      this.flags.add(flag);
    }

    this.clearTags();

    for (const tag of state.tags) {
      this.tags.add(tag);
    }

        this.clearBookmarks();

    for (const bookmark of state.bookmarks) {
      this.addBookmark(bookmark);
    }

    this.clearMarkers();

    for (const marker of state.markers) {
      this.addMarker(marker.name, marker.position);
    }

    this.clearQueue();

    for (const position of state.queue) {
      this.enqueue(position);
    }

    this.clearPlaybackHistory();

    for (const position of state.history) {
      this.playbackHistory.push(position);
    }

    if (state.selection.enabled) {
      this.enableSelection(
        state.selection.start,
        state.selection.end
      );
    } else {
      this.clearSelection();
    }

    this.runtimeStarted = state.runtime.started;
    this.runtimeInitializedAt =
      state.runtime.initializedAt;
    this.runtimeUpdatedAt =
      state.runtime.updatedAt;
  }

  // ==========================================================================
  // ENGINE VALIDATION
  // ==========================================================================

  validateEngine(): boolean {
    return (
      this.playbackPosition >= 0 &&
      this.playbackDuration >= 0 &&
      this.playbackRate > 0 &&
      this.volume >= 0 &&
      this.volume <= 1 &&
      this.loopStart <= this.loopEnd
    );
  }

  repairEngine(): void {
    this.playbackPosition = this.clampPosition(
      this.playbackPosition
    );

    this.playbackRate = Math.max(
      this.minimumPlaybackRate,
      Math.min(
        this.playbackRate,
        this.maximumPlaybackRate
      )
    );

    this.volume = Math.max(
      0,
      Math.min(1, this.volume)
    );

    if (this.loopEnd < this.loopStart) {
      this.loopEnd = this.loopStart;
    }
  }

  // ==========================================================================
  // VERSION
  // ==========================================================================

  getVersion(): string {
    return "1.0.0";
  }

  getName(): string {
    return "TimelinePlaybackEngine";
  }

  getInformationSummary() {
    return {
      name: this.getName(),
      version: this.getVersion(),
      runtime: this.getRuntimeInformation(),
      summary: this.getEngineSummary(),
      diagnostics: this.getDiagnostics(),
      valid: this.validateEngine(),
    };
  }
}

