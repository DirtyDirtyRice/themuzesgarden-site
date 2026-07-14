// ============================================================================
// lib/timeline/TimelineTypes.ts
// TIMELINE ENGINE
// CONTINUATION 1
// FOUNDATION TYPES
// ============================================================================

export type TimelineId = string;

export type TimelineTrackId = string;

export type TimelineProjectId = string;

export type TimelineUserId = string;

export type TimelineTimestamp = number;

export type TimelineMilliseconds = number;

export type TimelineSeconds = number;

export type TimelineBars = number;

export type TimelineBeats = number;

export type TimelineTicks = number;

export type TimelinePriority =
  | "lowest"
  | "low"
  | "normal"
  | "high"
  | "highest";

export type TimelineVisibility =
  | "private"
  | "project"
  | "shared"
  | "public";

export type TimelineSource =
  | "user"
  | "ai"
  | "system"
  | "import"
  | "automation"
  | "workspace";

export type TimelineStatus =
  | "draft"
  | "active"
  | "completed"
  | "archived"
  | "deleted";

export type TimelineEventType =
  | "prompt"
  | "conversation"
  | "response"
  | "lyric"
  | "marker"
  | "measure"
  | "beat"
  | "tempo"
  | "time-signature"
  | "key-signature"
  | "key-change"
  | "chord"
  | "melody"
  | "harmony"
  | "instrument"
  | "arrangement"
  | "automation"
  | "waveform"
  | "stem"
  | "audio"
  | "video"
  | "image"
  | "note"
  | "comment"
  | "idea"
  | "task"
  | "analysis"
  | "relationship"
  | "reference"
  | "version"
  | "mix"
  | "master"
  | "publish"
  | "custom";

export type TimelineLocation = {
  seconds: TimelineSeconds;
  milliseconds: TimelineMilliseconds;
  bar: TimelineBars;
  beat: TimelineBeats;
  tick: TimelineTicks;
};

export type TimelineAudit = {
  createdAt: string;
  updatedAt: string;
  createdBy: TimelineUserId;
  updatedBy: TimelineUserId;
};

export type TimelineTag = {
  id: TimelineId;
  label: string;
  color: string;
};

export type TimelineRelationship = {
  id: TimelineId;
  sourceId: TimelineId;
  targetId: TimelineId;
  relationship: string;
};

export type TimelineAttachment = {
  id: TimelineId;
  type: string;
  name: string;
  path: string;
};

export type TimelineRating = {
  score: number;
  votes: number;
};

export type TimelineMetadata = {
  title: string;
  description: string;
  category: string;
  color: string;
  icon: string;
};

export type TimelineEvent = {
  id: TimelineId;

  trackId: TimelineTrackId;

  projectId?: TimelineProjectId;

  type: TimelineEventType;

  status: TimelineStatus;

  source: TimelineSource;

  visibility: TimelineVisibility;

  priority: TimelinePriority;

  location: TimelineLocation;

  metadata: TimelineMetadata;

  tags: TimelineTag[];

  attachments: TimelineAttachment[];

  relationships: TimelineRelationship[];

  rating?: TimelineRating;

  audit: TimelineAudit;


  parentEventId?: TimelineId;

  previousEventId?: TimelineId;

  nextEventId?: TimelineId;

  conversationId?: TimelineId;

  versionId?: TimelineId;

  workspaceId?: string;

  engineId?: string;

  title: string;

  summary?: string;

  content?: string;

  prompt?: string;

  response?: string;

  notes?: string;

  confidence?: number;

  importance?: number;

  duration?: number;

  startTime?: TimelineTimestamp;

  endTime?: TimelineTimestamp;

  locked: boolean;

  pinned: boolean;

  favorite: boolean;

  archived: boolean;

  selected: boolean;

  enabled: boolean;

  hidden: boolean;

  completed: boolean;

  aiGenerated: boolean;

  aiModel?: string;

  aiProvider?: string;

  aiTemperature?: number;

  aiTokens?: number;

  language?: string;

  genre?: string;

  mood?: string;

  energy?: number;

  valence?: number;

  bpm?: number;

  keySignature?: string;

  timeSignature?: string;

  customData?: Record<string, unknown>;
};

export type TimelinePromptEvent = TimelineEvent & {
  type: "prompt";

  prompt: string;

  conversationId: TimelineId;
};

export type TimelineResponseEvent = TimelineEvent & {
  type: "response";

  response: string;

  conversationId: TimelineId;
};

export type TimelineConversationEvent = TimelineEvent & {
  type: "conversation";

  promptCount: number;

  responseCount: number;
};

export type TimelineLyricEvent = TimelineEvent & {
  type: "lyric";

  lyric: string;

  section?: string;

  lineNumber?: number;
};

export type TimelineChordEvent = TimelineEvent & {
  type: "chord";

  chord: string;

  inversion?: string;
};

export type TimelineMarkerEvent = TimelineEvent & {
  type: "marker";

  marker: string;

  color?: string;
};

export type TimelineIdeaEvent = TimelineEvent & {
  type: "idea";

  idea: string;
};

export type TimelineCommentEvent = TimelineEvent & {
  type: "comment";

  comment: string;

  author?: string;
};

export type TimelineTaskEvent = TimelineEvent & {
  type: "task";

  task: string;

  completedAt?: string;

  assignedTo?: TimelineUserId;
};

export type TimelineAnalysisEvent = TimelineEvent & {
  type: "analysis";

  analysis: string;

  confidence?: number;

  summary?: string;
};

export type TimelineAutomationEvent = TimelineEvent & {
  type: "automation";

  automation: string;

  enabled: boolean;

  target?: string;
};

export type TimelineTempoEvent = TimelineEvent & {
  type: "tempo";

  bpm: number;
};

export type TimelineTimeSignatureEvent = TimelineEvent & {
  type: "time-signature";

  numerator: number;

  denominator: number;
};

export type TimelineKeySignatureEvent = TimelineEvent & {
  type: "key-signature";

  key: string;

  mode?: string;
};

export type TimelineBeatEvent = TimelineEvent & {
  type: "beat";

  beat: number;

  bar: number;

  tick: number;
};

export type TimelineMeasureEvent = TimelineEvent & {
  type: "measure";

  measure: number;

  firstBeat: number;

  lastBeat: number;
};

export type TimelineMelodyEvent = TimelineEvent & {
  type: "melody";

  notes: string[];

  octave?: number;
};

export type TimelineHarmonyEvent = TimelineEvent & {
  type: "harmony";

  harmony: string;

  voices?: number;
};

export type TimelineInstrumentEvent = TimelineEvent & {
  type: "instrument";

  instrument: string;

  preset?: string;
};

export type TimelineArrangementEvent = TimelineEvent & {
  type: "arrangement";

  section: string;

  order: number;
};

export type TimelineMixEvent = TimelineEvent & {
  type: "mix";

  mixName: string;

  revision?: number;
};

export type TimelineWaveformEvent = TimelineEvent & {
  type: "waveform";

  waveformPath: string;

  sampleRate?: number;

  channels?: number;
};

export type TimelineStemEvent = TimelineEvent & {
  type: "stem";

  stemName: string;

  stemPath: string;
};

export type TimelineAudioEvent = TimelineEvent & {
  type: "audio";

  audioPath: string;

  durationSeconds?: number;
};

export type TimelineVideoEvent = TimelineEvent & {
  type: "video";

  videoPath: string;

  frameRate?: number;
};

export type TimelineImageEvent = TimelineEvent & {
  type: "image";

  imagePath: string;

  caption?: string;
};

export type TimelineReferenceEvent = TimelineEvent & {
  type: "reference";

  referenceType: string;

  referenceId: TimelineId;

  description?: string;
};

export type TimelineRelationshipEvent = TimelineEvent & {
  type: "relationship";

  relationshipType: string;

  targetEventId: TimelineId;
};

export type TimelineVersionEvent = TimelineEvent & {
  type: "version";

  versionName: string;

  parentVersionId?: TimelineId;
};

export type TimelinePublishEvent = TimelineEvent & {
  type: "publish";

  destination: string;

  publishedAt?: string;
};

export type TimelineMasterEvent = TimelineEvent & {
  type: "master";

  masterName: string;

  loudness?: number;
};

export type TimelineNoteEvent = TimelineEvent & {
  type: "note";

  note: string;
};

export type TimelineCustomEvent = TimelineEvent & {
  type: "custom";

  customType: string;

  payload?: Record<string, unknown>;
};

export type TimelineEventMap = {
  prompt: TimelinePromptEvent;
  conversation: TimelineConversationEvent;
  response: TimelineResponseEvent;
  lyric: TimelineLyricEvent;
  chord: TimelineChordEvent;
  marker: TimelineMarkerEvent;
  idea: TimelineIdeaEvent;
  comment: TimelineCommentEvent;
  task: TimelineTaskEvent;
  analysis: TimelineAnalysisEvent;
  automation: TimelineAutomationEvent;
  tempo: TimelineTempoEvent;
  "time-signature": TimelineTimeSignatureEvent;
  "key-signature": TimelineKeySignatureEvent;
  beat: TimelineBeatEvent;
  measure: TimelineMeasureEvent;
  melody: TimelineMelodyEvent;
  harmony: TimelineHarmonyEvent;
  instrument: TimelineInstrumentEvent;
  arrangement: TimelineArrangementEvent;
  mix: TimelineMixEvent;
  waveform: TimelineWaveformEvent;
  stem: TimelineStemEvent;
  audio: TimelineAudioEvent;
  video: TimelineVideoEvent;
  image: TimelineImageEvent;
  relationship: TimelineRelationshipEvent;
  reference: TimelineReferenceEvent;
  version: TimelineVersionEvent;
  publish: TimelinePublishEvent;
  master: TimelineMasterEvent;
  note: TimelineNoteEvent;
  custom: TimelineCustomEvent;
};

export type TimelineFilter = {
  eventTypes?: TimelineEventType[];

  tags?: string[];

  visibility?: TimelineVisibility[];

  status?: TimelineStatus[];

  sources?: TimelineSource[];

  priorities?: TimelinePriority[];

  search?: string;

  startTime?: TimelineTimestamp;

  endTime?: TimelineTimestamp;

  includeArchived?: boolean;
};

export type TimelineSelection = {
  selectedEventIds: TimelineId[];

  activeEventId?: TimelineId;

  anchorEventId?: TimelineId;
};

export type TimelineClipboard = {
  events: TimelineEvent[];

  copiedAt: string;

  sourceTrackId: TimelineTrackId;
};

export type TimelineHistoryEntry = {
  id: TimelineId;

  action: string;

  timestamp: string;

  userId: TimelineUserId;

  eventIds: TimelineId[];
};

export type TimelineStatistics = {
  totalEvents: number;

  promptEvents: number;

  lyricEvents: number;

  markerEvents: number;

  automationEvents: number;

  relationshipEvents: number;

  audioEvents: number;

  videoEvents: number;

  imageEvents: number;

  aiEvents: number;
};

export type TimelineViewport = {
  zoom: number;

  scrollPosition: number;

  visibleStart: TimelineTimestamp;

  visibleEnd: TimelineTimestamp;

  snapToGrid: boolean;

  showMilliseconds: boolean;

  showBars: boolean;

  showBeats: boolean;
};

export type TimelineTrack = {
  id: TimelineTrackId;

  title: string;

  color: string;

  visible: boolean;

  locked: boolean;

  muted: boolean;

  height: number;
};

export type TimelineWorkspace = {
  projectId: TimelineProjectId;

  tracks: TimelineTrack[];

  events: TimelineEvent[];

  statistics: TimelineStatistics;

  selection: TimelineSelection;

  clipboard: TimelineClipboard;

  viewport: TimelineViewport;

  history: TimelineHistoryEntry[];
};

export type TimelineQuery = {
  trackId?: TimelineTrackId;

  projectId?: TimelineProjectId;

  eventIds?: TimelineId[];

  eventTypes?: TimelineEventType[];

  startTime?: TimelineTimestamp;

  endTime?: TimelineTimestamp;

  tags?: string[];

  search?: string;

  includeHidden?: boolean;

  includeArchived?: boolean;
};

export type TimelineSearchResult = {
  query: TimelineQuery;

  totalMatches: number;

  events: TimelineEvent[];
};

export type TimelineImportResult = {
  importedEvents: number;

  skippedEvents: number;

  failedEvents: number;

  warnings: string[];
};

export type TimelineExportResult = {
  exportedEvents: number;

  exportedTracks: number;

  generatedAt: string;
};

export type TimelineValidationIssue = {
  id: TimelineId;

  severity: "info" | "warning" | "error";

  message: string;
};

export type TimelineValidationReport = {
  valid: boolean;

  issueCount: number;

  issues: TimelineValidationIssue[];
};

export type TimelineDiagnostics = {
  runtimeVersion: string;

  engineVersion: string;

  generatedAt: string;

  statistics: TimelineStatistics;

  validation: TimelineValidationReport;
};

export type TimelineEngineConfiguration = {
  autoSave: boolean;

  autoValidate: boolean;

  autoRelationships: boolean;

  autoHistory: boolean;

  autoStatistics: boolean;

  autoDiagnostics: boolean;
};

export type TimelineEngineState = {
  workspace: TimelineWorkspace;

  filter: TimelineFilter;

  configuration: TimelineEngineConfiguration;

  diagnostics: TimelineDiagnostics;
};

export type TimelineCommand =
  | "create"
  | "update"
  | "delete"
  | "duplicate"
  | "move"
  | "copy"
  | "paste"
  | "group"
  | "ungroup"
  | "lock"
  | "unlock"
  | "pin"
  | "unpin"
  | "archive"
  | "restore"
  | "analyze"
  | "generate"
  | "validate"
  | "import"
  | "export";

export type TimelineCommandRequest = {
  id: TimelineId;

  command: TimelineCommand;

  eventIds: TimelineId[];

  payload?: Record<string, unknown>;

  issuedAt: string;

  issuedBy: TimelineUserId;
};

export type TimelineCommandResult = {
  success: boolean;

  command: TimelineCommand;

  affectedEvents: TimelineId[];

  warnings: string[];

  errors: string[];
};

export type TimelineEngineMetrics = {
  loadedTracks: number;

  loadedEvents: number;

  visibleEvents: number;

  selectedEvents: number;

  queuedCommands: number;

  completedCommands: number;

  failedCommands: number;

  memoryUsage: number;

  renderTimeMs: number;

  updateTimeMs: number;
};

export type TimelineSnapshot = {
  id: TimelineId;

  createdAt: string;

  workspace: TimelineWorkspace;
};

export type TimelineSession = {
  id: TimelineId;

  userId: TimelineUserId;

  startedAt: string;

  lastActivityAt: string;

  snapshots: TimelineSnapshot[];
};

export type TimelineEngineRuntime = {
  configuration: TimelineEngineConfiguration;

  metrics: TimelineEngineMetrics;

  session: TimelineSession;

  state: TimelineEngineState;
};

export type TimelineEngineCapabilities = {
  prompts: boolean;

  conversations: boolean;

  lyrics: boolean;

  chords: boolean;

  melody: boolean;

  harmony: boolean;

  arrangement: boolean;

  automation: boolean;

  waveform: boolean;

  stems: boolean;

  audio: boolean;

  video: boolean;

  images: boolean;

  analysis: boolean;

  relationships: boolean;

  versioning: boolean;

  publishing: boolean;

  diagnostics: boolean;
};

export type TimelineRuntimeInformation = {
  engineName: string;

  engineVersion: string;

  buildNumber: string;

  initializedAt: string;

  lastUpdatedAt: string;
};

export type TimelineEngineManifest = {
  runtime: TimelineRuntimeInformation;

  capabilities: TimelineEngineCapabilities;

  configuration: TimelineEngineConfiguration;
};

export type TimelineEngineHealth = {
  healthy: boolean;

  warnings: string[];

  errors: string[];

  metrics: TimelineEngineMetrics;
};

export type TimelineEngine = {
  manifest: TimelineEngineManifest;

  runtime: TimelineEngineRuntime;

  health: TimelineEngineHealth;
};

