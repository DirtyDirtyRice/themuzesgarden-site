// lib/ai/workspace/AiWorkspaceTypes.ts

export type AiWorkspaceModule =
  | "songwriting"
  | "lyrics"
  | "metadata"
  | "projects"
  | "library"
  | "relationships"
  | "publishing"
  | "analysis"
  | "comparison"
  | "workflow";

export type AiWorkspaceStatus =
  | "idle"
  | "ready"
  | "running"
  | "complete"
  | "warning"
  | "error";

export type AiWorkspacePriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

export type AiWorkspaceView =
  | "dashboard"
  | "assistant"
  | "history"
  | "tasks"
  | "prompts"
  | "results"
  | "settings";

export type AiWorkspaceMetric = {
  id: string;
  label: string;
  value: number;
  description: string;
};

export type AiWorkspaceCounter = {
  songs: number;
  projects: number;
  lyrics: number;
  prompts: number;
  responses: number;
  analyses: number;
  relationships: number;
  metadataUpdates: number;
};

export type AiWorkspaceCapability = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  experimental: boolean;
};

export type AiWorkspaceTask = {
  id: string;
  module: AiWorkspaceModule;
  title: string;
  description: string;
  priority: AiWorkspacePriority;
  status: AiWorkspaceStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
};

export type AiWorkspacePrompt = {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  favorite: boolean;
  tags: string[];
};

export type AiWorkspaceConversationMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  createdAt: string;
  content: string;
};

export type AiWorkspaceConversation = {
  id: string;
  title: string;
  module: AiWorkspaceModule;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
  messages: AiWorkspaceConversationMessage[];
};

export type AiWorkspacePanel = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  visible: boolean;
};

export type AiWorkspaceSection = {
  id: string;
  title: string;
  icon: string;
  expanded: boolean;
  panels: AiWorkspacePanel[];
};

export type AiWorkspaceRecommendation = {
  id: string;
  title: string;
  description: string;
  module: AiWorkspaceModule;
  priority: AiWorkspacePriority;
};

export type AiWorkspaceQuickAction = {
  id: string;
  title: string;
  icon: string;
  module: AiWorkspaceModule;
};

export type AiWorkspaceState = {
  currentView: AiWorkspaceView;
  currentModule: AiWorkspaceModule;
  status: AiWorkspaceStatus;

  counters: AiWorkspaceCounter;

  metrics: AiWorkspaceMetric[];

  capabilities: AiWorkspaceCapability[];

  sections: AiWorkspaceSection[];

  tasks: AiWorkspaceTask[];

  prompts: AiWorkspacePrompt[];

  conversations: AiWorkspaceConversation[];

  recommendations: AiWorkspaceRecommendation[];

  quickActions: AiWorkspaceQuickAction[];
};

export type AiWorkspaceControllerResult = {
  state: AiWorkspaceState;
  initialized: boolean;
  lastUpdated: string;
};

export type AiWorkspaceInitializer = {
  createDefaultState(): AiWorkspaceState;
};

export type AiWorkspaceUpdater = {
  setModule(module: AiWorkspaceModule): void;
  setView(view: AiWorkspaceView): void;
  setStatus(status: AiWorkspaceStatus): void;
};

export type AiWorkspaceSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  module: AiWorkspaceModule;
};

export type AiWorkspaceHistoryEntry = {
  id: string;
  timestamp: string;
  action: string;
  module: AiWorkspaceModule;
  summary: string;
};

export type AiWorkspaceDashboardCard = {
  id: string;
  title: string;
  value: string;
  detail: string;
};

export type AiWorkspaceDashboard = {
  cards: AiWorkspaceDashboardCard[];
  history: AiWorkspaceHistoryEntry[];
  recommendations: AiWorkspaceRecommendation[];
};

export const AI_WORKSPACE_VERSION = "1.0.0";

export const AI_WORKSPACE_NAME = "The Muzes Garden AI Workspace";

export type AiWorkspaceSession = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  conversationIds: string[];
};

export type AiWorkspaceProjectSummary = {
  id: string;
  title: string;
  trackCount: number;
  selected: boolean;
  visibility: "private" | "shared" | "public";
};

export type AiWorkspaceLibrarySummary = {
  totalTracks: number;
  totalProjects: number;
  totalVersions: number;
  totalLyrics: number;
  totalRelationships: number;
};

export type AiWorkspaceEngine = {
  id: string;
  name: string;
  description: string;
  module: AiWorkspaceModule;
  enabled: boolean;
};

export type AiWorkspaceTool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  module: AiWorkspaceModule;
  enabled: boolean;
};

export type AiWorkspaceNotification = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "error";
  createdAt: string;
  dismissed: boolean;
};

export type AiWorkspaceInsight = {
  id: string;
  title: string;
  summary: string;
  module: AiWorkspaceModule;
  confidence: number;
};

export type AiWorkspaceRecentFile = {
  id: string;
  title: string;
  type: string;
  openedAt: string;
};

export type AiWorkspaceFavorite = {
  id: string;
  title: string;
  module: AiWorkspaceModule;
};

export type AiWorkspacePreference = {
  darkMode: boolean;
  autoSave: boolean;
  autoAnalyze: boolean;
  autoSuggest: boolean;
  showExperimental: boolean;
};

export type AiWorkspaceMemoryItem = {
  id: string;
  title: string;
  value: string;
  category: string;
};

export type AiWorkspaceQueueItem = {
  id: string;
  title: string;
  module: AiWorkspaceModule;
  status: AiWorkspaceStatus;
};

export type AiWorkspaceSnapshot = {
  version: string;
  createdAt: string;
  state: AiWorkspaceState;
};

export type AiWorkspaceHealth = {
  ready: boolean;
  warnings: string[];
  errors: string[];
};

export type AiWorkspaceContext = {
  session: AiWorkspaceSession;
  dashboard: AiWorkspaceDashboard;
  library: AiWorkspaceLibrarySummary;
  projects: AiWorkspaceProjectSummary[];
  notifications: AiWorkspaceNotification[];
  favorites: AiWorkspaceFavorite[];
  insights: AiWorkspaceInsight[];
  recentFiles: AiWorkspaceRecentFile[];
  preferences: AiWorkspacePreference;
  memory: AiWorkspaceMemoryItem[];
  queue: AiWorkspaceQueueItem[];
  health: AiWorkspaceHealth;
};

export type AiWorkspaceModuleInfo = {
  id: AiWorkspaceModule;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
};

export const AI_MODULES: AiWorkspaceModuleInfo[] = [
  {
    id: "songwriting",
    title: "Songwriting",
    subtitle: "Ideas and composition",
    icon: "🎼",
    color: "#ffffff",
    description: "Create, organize and expand songwriting ideas."
  },
  {
    id: "lyrics",
    title: "Lyrics",
    subtitle: "Writing assistant",
    icon: "📝",
    color: "#ffffff",
    description: "Generate, improve and organize lyric content."
  },
  {
    id: "metadata",
    title: "Metadata",
    subtitle: "Track intelligence",
    icon: "🏷️",
    color: "#ffffff",
    description: "Manage metadata, tags and relationships."
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Workspace management",
    icon: "📁",
    color: "#ffffff",
    description: "Manage project workspaces."
  },
  {
    id: "library",
    title: "Library",
    subtitle: "Track collection",
    icon: "🎵",
    color: "#ffffff",
    description: "Navigate the complete music library."
  },
  {
    id: "relationships",
    title: "Relationships",
    subtitle: "Connected ideas",
    icon: "🕸️",
    color: "#ffffff",
    description: "Visualize connected songs and concepts."
  },
  {
    id: "publishing",
    title: "Publishing",
    subtitle: "Release workflow",
    icon: "🚀",
    color: "#ffffff",
    description: "Prepare music for release."
  },
  {
    id: "analysis",
    title: "Analysis",
    subtitle: "AI insights",
    icon: "📊",
    color: "#ffffff",
    description: "Analyze songs and projects."
  },
  {
    id: "comparison",
    title: "Comparison",
    subtitle: "Version comparison",
    icon: "⚖️",
    color: "#ffffff",
    description: "Compare mixes and song versions."
  },
  {
    id: "workflow",
    title: "Workflow",
    subtitle: "Daily productivity",
    icon: "⚙️",
    color: "#ffffff",
    description: "Coordinate AI-assisted work."
  }
];

// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 3
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceSearchScope =
  | "library"
  | "projects"
  | "lyrics"
  | "metadata"
  | "relationships"
  | "notes"
  | "history"
  | "everywhere";

export type AiWorkspaceSearchRequest = {
  query: string;
  scope: AiWorkspaceSearchScope;
  limit: number;
};

export type AiWorkspaceSearchMatch = {
  id: string;
  title: string;
  subtitle: string;
  score: number;
  module: AiWorkspaceModule;
};

export type AiWorkspaceSearchResponse = {
  request: AiWorkspaceSearchRequest;
  results: AiWorkspaceSearchMatch[];
};

export type AiWorkspaceEngineStatistics = {
  totalModules: number;
  activeModules: number;
  runningTasks: number;
  completedTasks: number;
  queuedTasks: number;
  failedTasks: number;
};

export type AiWorkspaceWorkspaceStatistics = {
  totalProjects: number;
  totalTracks: number;
  totalVersions: number;
  totalLyrics: number;
  totalMetadataRecords: number;
};

export type AiWorkspacePromptCategory = {
  id: string;
  title: string;
  description: string;
};

export type AiWorkspacePromptGroup = {
  id: string;
  title: string;
  prompts: AiWorkspacePrompt[];
};

export type AiWorkspaceTimelineEvent = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  module: AiWorkspaceModule;
};

export type AiWorkspaceAssistant = {
  id: string;
  title: string;
  description: string;
  module: AiWorkspaceModule;
  enabled: boolean;
};

export type AiWorkspaceFeature = {
  id: string;
  title: string;
  description: string;
  available: boolean;
};

export type AiWorkspaceSystemState = {
  initialized: boolean;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
};

export type AiWorkspaceConfiguration = {
  workspaceName: string;
  version: string;
  build: string;
  author: string;
};

export const AI_WORKSPACE_CONFIGURATION: AiWorkspaceConfiguration = {
  workspaceName: AI_WORKSPACE_NAME,
  version: AI_WORKSPACE_VERSION,
  build: "alpha",
  author: "The Muzes Garden"
};

export const AI_WORKSPACE_FEATURES: AiWorkspaceFeature[] = [
  {
    id: "songwriting",
    title: "Songwriting Assistant",
    description: "Generate, organize and improve songwriting ideas.",
    available: true
  },
  {
    id: "lyrics",
    title: "Lyric Assistant",
    description: "Create and analyze lyrics.",
    available: true
  },
  {
    id: "metadata",
    title: "Metadata Assistant",
    description: "Manage metadata and intelligent tagging.",
    available: true
  },
  {
    id: "projects",
    title: "Project Assistant",
    description: "Coordinate project workspaces.",
    available: true
  },
  {
    id: "comparison",
    title: "Version Comparison",
    description: "Compare song versions with AI.",
    available: true
  },
  {
    id: "publishing",
    title: "Publishing Assistant",
    description: "Prepare tracks for release.",
    available: true
  },
  {
    id: "relationships",
    title: "Relationship Explorer",
    description: "Discover relationships across the library.",
    available: true
  },
  {
    id: "workflow",
    title: "Workflow Planner",
    description: "Guide creative work from idea to release.",
    available: true
  }
];

export const DEFAULT_AI_WORKSPACE_COUNTERS: AiWorkspaceCounter = {
  songs: 0,
  projects: 0,
  lyrics: 0,
  prompts: 0,
  responses: 0,
  analyses: 0,
  relationships: 0,
  metadataUpdates: 0
};

export const DEFAULT_AI_WORKSPACE_STATS: AiWorkspaceEngineStatistics = {
  totalModules: AI_MODULES.length,
  activeModules: AI_MODULES.length,
  runningTasks: 0,
  completedTasks: 0,
  queuedTasks: 0,
  failedTasks: 0
};

export const DEFAULT_AI_WORKSPACE_LIBRARY: AiWorkspaceWorkspaceStatistics = {
  totalProjects: 0,
  totalTracks: 0,
  totalVersions: 0,
  totalLyrics: 0,
  totalMetadataRecords: 0
};

// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 4
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceRoute =
  | "/ai"
  | "/ai/songwriting"
  | "/ai/lyrics"
  | "/ai/projects"
  | "/ai/library"
  | "/ai/metadata"
  | "/ai/relationships"
  | "/ai/publishing"
  | "/ai/settings";

export type AiWorkspaceNavigationItem = {
  id: string;
  title: string;
  route: AiWorkspaceRoute;
  icon: string;
  module: AiWorkspaceModule;
  enabled: boolean;
};

export type AiWorkspaceSidebarGroup = {
  id: string;
  title: string;
  items: AiWorkspaceNavigationItem[];
};

export type AiWorkspaceBanner = {
  id: string;
  title: string;
  message: string;
  visible: boolean;
};

export type AiWorkspaceWorkspaceCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  module: AiWorkspaceModule;
};

export type AiWorkspaceEngineSummary = {
  id: string;
  module: AiWorkspaceModule;
  title: string;
  status: AiWorkspaceStatus;
  description: string;
};

export type AiWorkspaceSystemSummary = {
  configuration: AiWorkspaceConfiguration;
  statistics: AiWorkspaceEngineStatistics;
  library: AiWorkspaceWorkspaceStatistics;
};

export type AiWorkspaceLayout = {
  sidebar: AiWorkspaceSidebarGroup[];
  dashboard: AiWorkspaceDashboardCard[];
  workspaceCards: AiWorkspaceWorkspaceCard[];
};

export const AI_WORKSPACE_NAVIGATION: AiWorkspaceNavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/ai",
    icon: "🏠",
    module: "workflow",
    enabled: true,
  },
  {
    id: "songwriting",
    title: "Songwriting",
    route: "/ai/songwriting",
    icon: "🎼",
    module: "songwriting",
    enabled: true,
  },
  {
    id: "lyrics",
    title: "Lyrics",
    route: "/ai/lyrics",
    icon: "📝",
    module: "lyrics",
    enabled: true,
  },
  {
    id: "projects",
    title: "Projects",
    route: "/ai/projects",
    icon: "📁",
    module: "projects",
    enabled: true,
  },
  {
    id: "library",
    title: "Library",
    route: "/ai/library",
    icon: "🎵",
    module: "library",
    enabled: true,
  },
  {
    id: "metadata",
    title: "Metadata",
    route: "/ai/metadata",
    icon: "🏷️",
    module: "metadata",
    enabled: true,
  },
  {
    id: "relationships",
    title: "Relationships",
    route: "/ai/relationships",
    icon: "🕸️",
    module: "relationships",
    enabled: true,
  },
  {
    id: "publishing",
    title: "Publishing",
    route: "/ai/publishing",
    icon: "🚀",
    module: "publishing",
    enabled: true,
  },
  {
    id: "settings",
    title: "Settings",
    route: "/ai/settings",
    icon: "⚙️",
    module: "workflow",
    enabled: true,
  },
];

export const AI_WORKSPACE_SIDEBAR: AiWorkspaceSidebarGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: AI_WORKSPACE_NAVIGATION.slice(0, 5),
  },
  {
    id: "intelligence",
    title: "Intelligence",
    items: AI_WORKSPACE_NAVIGATION.slice(5),
  },
];

export const AI_WORKSPACE_DEFAULT_BANNERS: AiWorkspaceBanner[] = [
  {
    id: "welcome",
    title: "Welcome to The Muzes Garden AI",
    message:
      "Your AI workspace is ready to help organize projects, songs, lyrics, metadata and publishing.",
    visible: true,
  },
];

export const AI_WORKSPACE_ENGINE_SUMMARY: AiWorkspaceEngineSummary[] =
  AI_MODULES.map((module) => ({
    id: module.id,
    module: module.id,
    title: module.title,
    status: "ready",
    description: module.description,
  }));

export const AI_WORKSPACE_LAYOUT: AiWorkspaceLayout = {
  sidebar: AI_WORKSPACE_SIDEBAR,
  dashboard: [],
  workspaceCards: AI_MODULES.map((module) => ({
    id: module.id,
    title: module.title,
    subtitle: module.subtitle,
    icon: module.icon,
    module: module.id,
  })),
};

// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 5
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceCommand =
  | "new-song"
  | "new-project"
  | "analyze-track"
  | "compare-versions"
  | "generate-lyrics"
  | "generate-metadata"
  | "publish-song"
  | "scan-library";

export type AiWorkspaceCommandDefinition = {
  id: AiWorkspaceCommand;
  title: string;
  description: string;
  module: AiWorkspaceModule;
  icon: string;
  enabled: boolean;
};

export type AiWorkspaceStartupChecklistItem = {
  id: string;
  title: string;
  complete: boolean;
};

export type AiWorkspaceStartupChecklist = {
  title: string;
  items: AiWorkspaceStartupChecklistItem[];
};

export type AiWorkspaceFavoritePrompt = {
  id: string;
  title: string;
  promptId: string;
};

export type AiWorkspaceRecentActivity = {
  id: string;
  title: string;
  module: AiWorkspaceModule;
  timestamp: string;
};

export type AiWorkspaceStatisticsPanel = {
  title: string;
  cards: AiWorkspaceDashboardCard[];
};

export const AI_WORKSPACE_COMMANDS: AiWorkspaceCommandDefinition[] = [
  {
    id: "new-song",
    title: "New Song",
    description: "Create a new songwriting workspace.",
    module: "songwriting",
    icon: "🎼",
    enabled: true,
  },
  {
    id: "new-project",
    title: "New Project",
    description: "Create a new project.",
    module: "projects",
    icon: "📁",
    enabled: true,
  },
  {
    id: "analyze-track",
    title: "Analyze Track",
    description: "Run AI analysis.",
    module: "analysis",
    icon: "📊",
    enabled: true,
  },
  {
    id: "compare-versions",
    title: "Compare Versions",
    description: "Compare multiple versions.",
    module: "comparison",
    icon: "⚖️",
    enabled: true,
  },
  {
    id: "generate-lyrics",
    title: "Generate Lyrics",
    description: "Create lyric ideas.",
    module: "lyrics",
    icon: "📝",
    enabled: true,
  },
  {
    id: "generate-metadata",
    title: "Generate Metadata",
    description: "Suggest metadata.",
    module: "metadata",
    icon: "🏷️",
    enabled: true,
  },
  {
    id: "publish-song",
    title: "Publishing",
    description: "Prepare a release.",
    module: "publishing",
    icon: "🚀",
    enabled: true,
  },
  {
    id: "scan-library",
    title: "Scan Library",
    description: "Analyze the music library.",
    module: "library",
    icon: "🎵",
    enabled: true,
  },
];

export const AI_WORKSPACE_STARTUP_CHECKLIST: AiWorkspaceStartupChecklist = {
  title: "AI Workspace Startup",
  items: [
    {
      id: "library",
      title: "Library Loaded",
      complete: false,
    },
    {
      id: "projects",
      title: "Projects Loaded",
      complete: false,
    },
    {
      id: "metadata",
      title: "Metadata Ready",
      complete: false,
    },
    {
      id: "relationships",
      title: "Relationships Ready",
      complete: false,
    },
    {
      id: "prompts",
      title: "Prompt Library Loaded",
      complete: false,
    },
    {
      id: "history",
      title: "History Loaded",
      complete: false,
    },
  ],
};

export const EMPTY_AI_WORKSPACE_DASHBOARD: AiWorkspaceDashboard = {
  cards: [],
  history: [],
  recommendations: [],
};

export const EMPTY_AI_WORKSPACE_CONTEXT: Partial<AiWorkspaceContext> = {
  notifications: [],
  favorites: [],
  insights: [],
  recentFiles: [],
  memory: [],
  queue: [],
};


// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 6
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceJobStatus =
  | "pending"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

export type AiWorkspaceJobType =
  | "analysis"
  | "generation"
  | "metadata"
  | "comparison"
  | "publishing"
  | "library-scan"
  | "relationship-build"
  | "workflow";

export type AiWorkspaceJob = {
  id: string;
  title: string;
  description: string;
  type: AiWorkspaceJobType;
  module: AiWorkspaceModule;
  status: AiWorkspaceJobStatus;
  progress: number;
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
};

export type AiWorkspaceActivityLevel =
  | "idle"
  | "light"
  | "moderate"
  | "heavy";

export type AiWorkspaceActivitySummary = {
  activeUsers: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  activity: AiWorkspaceActivityLevel;
};

export type AiWorkspaceEngineHealthMetric = {
  id: string;
  title: string;
  value: number;
  maximum: number;
  healthy: boolean;
};

export type AiWorkspaceEngineHealthReport = {
  generatedAt: string;
  metrics: AiWorkspaceEngineHealthMetric[];
};

export type AiWorkspacePromptHistory = {
  id: string;
  promptId: string;
  promptTitle: string;
  executedAt: string;
  module: AiWorkspaceModule;
};

export type AiWorkspacePromptTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  variables: string[];
};

export type AiWorkspaceRecentSearch = {
  id: string;
  query: string;
  scope: AiWorkspaceSearchScope;
  searchedAt: string;
};

export type AiWorkspaceSavedSearch = {
  id: string;
  title: string;
  request: AiWorkspaceSearchRequest;
};

export type AiWorkspaceNotificationSettings = {
  desktop: boolean;
  email: boolean;
  sounds: boolean;
  warnings: boolean;
  successes: boolean;
};

export type AiWorkspaceAppearanceSettings = {
  theme: "dark" | "light";
  compactMode: boolean;
  showIcons: boolean;
  showDescriptions: boolean;
};

export type AiWorkspaceAiSettings = {
  autoComplete: boolean;
  autoSuggest: boolean;
  autoAnalyze: boolean;
  autoRelationships: boolean;
};

export type AiWorkspaceSettings = {
  appearance: AiWorkspaceAppearanceSettings;
  notifications: AiWorkspaceNotificationSettings;
  ai: AiWorkspaceAiSettings;
};

export type AiWorkspaceProgressCard = {
  id: string;
  title: string;
  progress: number;
  detail: string;
};

export type AiWorkspaceModuleStatistics = {
  module: AiWorkspaceModule;
  projects: number;
  tasks: number;
  prompts: number;
  conversations: number;
};

export type AiWorkspaceDailySummary = {
  generatedAt: string;
  cards: AiWorkspaceDashboardCard[];
  activity: AiWorkspaceActivitySummary;
  modules: AiWorkspaceModuleStatistics[];
};

export const DEFAULT_AI_WORKSPACE_SETTINGS: AiWorkspaceSettings = {
  appearance: {
    theme: "dark",
    compactMode: false,
    showIcons: true,
    showDescriptions: true,
  },
  notifications: {
    desktop: true,
    email: false,
    sounds: false,
    warnings: true,
    successes: true,
  },
  ai: {
    autoComplete: true,
    autoSuggest: true,
    autoAnalyze: false,
    autoRelationships: false,
  },
};

export const EMPTY_AI_WORKSPACE_ACTIVITY: AiWorkspaceActivitySummary = {
  activeUsers: 0,
  activeJobs: 0,
  completedToday: 0,
  failedToday: 0,
  activity: "idle",
};

export const EMPTY_AI_WORKSPACE_HEALTH: AiWorkspaceEngineHealthReport = {
  generatedAt: "",
  metrics: [],
};

export const EMPTY_AI_WORKSPACE_DAILY_SUMMARY: AiWorkspaceDailySummary = {
  generatedAt: "",
  cards: [],
  activity: EMPTY_AI_WORKSPACE_ACTIVITY,
  modules: [],
};

export const EMPTY_AI_WORKSPACE_JOBS: AiWorkspaceJob[] = [];

export const EMPTY_AI_WORKSPACE_RECENT_SEARCHES: AiWorkspaceRecentSearch[] = [];

export const EMPTY_AI_WORKSPACE_SAVED_SEARCHES: AiWorkspaceSavedSearch[] = [];

export const EMPTY_AI_WORKSPACE_PROMPT_HISTORY: AiWorkspacePromptHistory[] = [];

export const EMPTY_AI_WORKSPACE_PROGRESS_CARDS: AiWorkspaceProgressCard[] = [];

// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 7
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceWorkspaceSnapshot = {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  version: string;
};

export type AiWorkspaceAuditEvent = {
  id: string;
  action: string;
  module: AiWorkspaceModule;
  user: string;
  timestamp: string;
};

export type AiWorkspaceAuditLog = {
  generatedAt: string;
  events: AiWorkspaceAuditEvent[];
};

export type AiWorkspacePerformanceMetric = {
  id: string;
  title: string;
  averageMs: number;
  maximumMs: number;
  minimumMs: number;
};

export type AiWorkspacePerformanceReport = {
  generatedAt: string;
  metrics: AiWorkspacePerformanceMetric[];
};

export type AiWorkspaceModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "local"
  | "custom";

export type AiWorkspaceModel = {
  id: string;
  provider: AiWorkspaceModelProvider;
  name: string;
  enabled: boolean;
  defaultModel: boolean;
};

export type AiWorkspaceProviderStatus = {
  provider: AiWorkspaceModelProvider;
  connected: boolean;
  latencyMs: number;
};

export type AiWorkspaceIntegration = {
  id: string;
  title: string;
  enabled: boolean;
  connected: boolean;
};

export type AiWorkspaceWorkspaceStatusCard = {
  id: string;
  title: string;
  value: string;
  healthy: boolean;
};

export type AiWorkspaceModuleHealth = {
  module: AiWorkspaceModule;
  ready: boolean;
  warnings: number;
  errors: number;
};

export type AiWorkspaceSystemHealth = {
  generatedAt: string;
  modules: AiWorkspaceModuleHealth[];
};

export type AiWorkspaceQueueStatistics = {
  queued: number;
  running: number;
  completed: number;
  failed: number;
};

export type AiWorkspaceSessionStatistics = {
  totalSessions: number;
  activeSessions: number;
  archivedSessions: number;
};

export const AI_WORKSPACE_MODELS: AiWorkspaceModel[] = [
  {
    id: "openai-default",
    provider: "openai",
    name: "OpenAI",
    enabled: true,
    defaultModel: true,
  },
  {
    id: "anthropic-default",
    provider: "anthropic",
    name: "Anthropic",
    enabled: false,
    defaultModel: false,
  },
  {
    id: "google-default",
    provider: "google",
    name: "Google",
    enabled: false,
    defaultModel: false,
  },
  {
    id: "local-default",
    provider: "local",
    name: "Local Model",
    enabled: false,
    defaultModel: false,
  },
];

export const EMPTY_AI_WORKSPACE_PROVIDER_STATUS: AiWorkspaceProviderStatus[] =
  [];

export const EMPTY_AI_WORKSPACE_INTEGRATIONS: AiWorkspaceIntegration[] = [];

export const EMPTY_AI_WORKSPACE_AUDIT_LOG: AiWorkspaceAuditLog = {
  generatedAt: "",
  events: [],
};

export const EMPTY_AI_WORKSPACE_PERFORMANCE: AiWorkspacePerformanceReport = {
  generatedAt: "",
  metrics: [],
};

export const EMPTY_AI_WORKSPACE_SYSTEM_HEALTH: AiWorkspaceSystemHealth = {
  generatedAt: "",
  modules: [],
};

export const EMPTY_AI_WORKSPACE_QUEUE_STATISTICS: AiWorkspaceQueueStatistics = {
  queued: 0,
  running: 0,
  completed: 0,
  failed: 0,
};

export const EMPTY_AI_WORKSPACE_SESSION_STATISTICS: AiWorkspaceSessionStatistics =
  {
    totalSessions: 0,
    activeSessions: 0,
    archivedSessions: 0,
  };

export const EMPTY_AI_WORKSPACE_SNAPSHOTS: AiWorkspaceWorkspaceSnapshot[] = [];

export const EMPTY_AI_WORKSPACE_STATUS_CARDS: AiWorkspaceWorkspaceStatusCard[] =
  [];

  // ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 8
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceWorkflowStage =
  | "idea"
  | "draft"
  | "analysis"
  | "revision"
  | "metadata"
  | "comparison"
  | "approval"
  | "publishing"
  | "complete";

export type AiWorkspaceWorkflowStep = {
  id: string;
  title: string;
  description: string;
  stage: AiWorkspaceWorkflowStage;
  completed: boolean;
  optional: boolean;
};

export type AiWorkspaceWorkflowTemplate = {
  id: string;
  title: string;
  description: string;
  steps: AiWorkspaceWorkflowStep[];
};

export type AiWorkspaceAutomationRule = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type AiWorkspaceAutomationExecution = {
  id: string;
  ruleId: string;
  startedAt: string;
  completedAt?: string;
  success: boolean;
};

export type AiWorkspaceLibraryCollection = {
  id: string;
  title: string;
  description: string;
  trackCount: number;
};

export type AiWorkspaceProjectCollection = {
  id: string;
  title: string;
  description: string;
  projectCount: number;
};

export type AiWorkspaceRelationshipGraph = {
  nodeCount: number;
  edgeCount: number;
  generatedAt: string;
};

export type AiWorkspaceMetadataProfile = {
  id: string;
  title: string;
  description: string;
  tagCount: number;
};

export type AiWorkspacePublishingTarget = {
  id: string;
  title: string;
  enabled: boolean;
};

export type AiWorkspacePublishingQueue = {
  pending: number;
  publishing: number;
  completed: number;
  failed: number;
};

export type AiWorkspaceAnalysisPreset = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type AiWorkspaceComparisonPreset = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type AiWorkspaceWorkspaceOverview = {
  modules: number;
  projects: number;
  tracks: number;
  prompts: number;
  sessions: number;
  conversations: number;
};

export const DEFAULT_AI_WORKSPACE_OVERVIEW: AiWorkspaceWorkspaceOverview = {
  modules: AI_MODULES.length,
  projects: 0,
  tracks: 0,
  prompts: 0,
  sessions: 0,
  conversations: 0,
};

export const EMPTY_AI_WORKSPACE_WORKFLOW: AiWorkspaceWorkflowTemplate = {
  id: "",
  title: "",
  description: "",
  steps: [],
};

export const EMPTY_AI_WORKSPACE_AUTOMATIONS: AiWorkspaceAutomationRule[] = [];

export const EMPTY_AI_WORKSPACE_AUTOMATION_HISTORY: AiWorkspaceAutomationExecution[] =
  [];

export const EMPTY_AI_WORKSPACE_LIBRARY_COLLECTIONS: AiWorkspaceLibraryCollection[] =
  [];

export const EMPTY_AI_WORKSPACE_PROJECT_COLLECTIONS: AiWorkspaceProjectCollection[] =
  [];

export const EMPTY_AI_WORKSPACE_ANALYSIS_PRESETS: AiWorkspaceAnalysisPreset[] =
  [];

export const EMPTY_AI_WORKSPACE_COMPARISON_PRESETS: AiWorkspaceComparisonPreset[] =
  [];

export const EMPTY_AI_WORKSPACE_PUBLISHING_QUEUE: AiWorkspacePublishingQueue = {
  pending: 0,
  publishing: 0,
  completed: 0,
  failed: 0,
};

export const EMPTY_AI_WORKSPACE_RELATIONSHIP_GRAPH: AiWorkspaceRelationshipGraph =
  {
    nodeCount: 0,
    edgeCount: 0,
    generatedAt: "",
  };

export const EMPTY_AI_WORKSPACE_METADATA_PROFILES: AiWorkspaceMetadataProfile[] =
  [];

export const EMPTY_AI_WORKSPACE_PUBLISHING_TARGETS: AiWorkspacePublishingTarget[] =
  [];

  // ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 9
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceWorkspaceMode =
  | "creative"
  | "analysis"
  | "editing"
  | "review"
  | "publishing";

export type AiWorkspaceWorkspaceStateSummary = {
  mode: AiWorkspaceWorkspaceMode;
  activeModule: AiWorkspaceModule;
  activeView: AiWorkspaceView;
  busy: boolean;
};

export type AiWorkspaceResourceUsage = {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
};

export type AiWorkspaceStorageStatistics = {
  prompts: number;
  conversations: number;
  analyses: number;
  metadata: number;
  projects: number;
  tracks: number;
};

export type AiWorkspaceSyncState =
  | "synced"
  | "pending"
  | "syncing"
  | "offline"
  | "conflict";

export type AiWorkspaceSyncItem = {
  id: string;
  title: string;
  state: AiWorkspaceSyncState;
  updatedAt: string;
};

export type AiWorkspaceSyncSummary = {
  state: AiWorkspaceSyncState;
  pendingItems: number;
  conflicts: number;
  lastSyncAt: string;
};

export type AiWorkspaceBackup = {
  id: string;
  createdAt: string;
  version: string;
  sizeBytes: number;
};

export type AiWorkspaceBackupHistory = {
  backups: AiWorkspaceBackup[];
};

export type AiWorkspaceReleaseChannel =
  | "stable"
  | "beta"
  | "alpha"
  | "development";

export type AiWorkspaceVersionInfo = {
  version: string;
  build: string;
  channel: AiWorkspaceReleaseChannel;
};

export type AiWorkspaceFeatureFlag = {
  id: string;
  title: string;
  enabled: boolean;
};

export type AiWorkspaceFeatureGroup = {
  id: string;
  title: string;
  features: AiWorkspaceFeatureFlag[];
};

export type AiWorkspaceDiagnosticMessage = {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export type AiWorkspaceDiagnosticReport = {
  generatedAt: string;
  messages: AiWorkspaceDiagnosticMessage[];
};

export type AiWorkspaceUsageTotals = {
  promptsExecuted: number;
  analysesCompleted: number;
  comparisonsCompleted: number;
  songsCreated: number;
  metadataGenerated: number;
};

export const AI_WORKSPACE_VERSION_INFO: AiWorkspaceVersionInfo = {
  version: AI_WORKSPACE_VERSION,
  build: "alpha",
  channel: "alpha",
};

export const EMPTY_AI_WORKSPACE_RESOURCE_USAGE: AiWorkspaceResourceUsage = {
  cpu: 0,
  memory: 0,
  storage: 0,
  network: 0,
};

export const EMPTY_AI_WORKSPACE_STORAGE: AiWorkspaceStorageStatistics = {
  prompts: 0,
  conversations: 0,
  analyses: 0,
  metadata: 0,
  projects: 0,
  tracks: 0,
};

export const EMPTY_AI_WORKSPACE_SYNC: AiWorkspaceSyncSummary = {
  state: "synced",
  pendingItems: 0,
  conflicts: 0,
  lastSyncAt: "",
};

export const EMPTY_AI_WORKSPACE_BACKUPS: AiWorkspaceBackupHistory = {
  backups: [],
};

export const EMPTY_AI_WORKSPACE_FEATURE_GROUPS: AiWorkspaceFeatureGroup[] = [];

export const EMPTY_AI_WORKSPACE_DIAGNOSTICS: AiWorkspaceDiagnosticReport = {
  generatedAt: "",
  messages: [],
};

export const EMPTY_AI_WORKSPACE_USAGE_TOTALS: AiWorkspaceUsageTotals = {
  promptsExecuted: 0,
  analysesCompleted: 0,
  comparisonsCompleted: 0,
  songsCreated: 0,
  metadataGenerated: 0,
};

export const DEFAULT_AI_WORKSPACE_STATE_SUMMARY: AiWorkspaceWorkspaceStateSummary =
  {
    mode: "creative",
    activeModule: "workflow",
    activeView: "dashboard",
    busy: false,
  };

  // ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 10
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspacePermission =
  | "read"
  | "write"
  | "admin"
  | "owner";

export type AiWorkspaceRole =
  | "viewer"
  | "editor"
  | "manager"
  | "administrator";

export type AiWorkspaceUserPermission = {
  module: AiWorkspaceModule;
  permission: AiWorkspacePermission;
};

export type AiWorkspaceUserProfile = {
  id: string;
  displayName: string;
  role: AiWorkspaceRole;
  permissions: AiWorkspaceUserPermission[];
};

export type AiWorkspaceRuntimeFlag = {
  id: string;
  enabled: boolean;
};

export type AiWorkspaceRuntimeEnvironment = {
  version: string;
  build: string;
  online: boolean;
  initialized: boolean;
  flags: AiWorkspaceRuntimeFlag[];
};

export type AiWorkspaceCacheEntry = {
  key: string;
  createdAt: string;
  expiresAt: string;
};

export type AiWorkspaceCacheStatistics = {
  entries: number;
  hits: number;
  misses: number;
  expired: number;
};

export type AiWorkspaceWorkerStatus =
  | "idle"
  | "running"
  | "sleeping"
  | "failed";

export type AiWorkspaceWorker = {
  id: string;
  title: string;
  status: AiWorkspaceWorkerStatus;
  module: AiWorkspaceModule;
};

export type AiWorkspaceEventSeverity =
  | "info"
  | "warning"
  | "error";

export type AiWorkspaceEvent = {
  id: string;
  title: string;
  severity: AiWorkspaceEventSeverity;
  module: AiWorkspaceModule;
  createdAt: string;
};

export type AiWorkspaceEventFeed = {
  events: AiWorkspaceEvent[];
};

export type AiWorkspaceImportSummary = {
  importedTracks: number;
  importedProjects: number;
  importedLyrics: number;
  importedMetadata: number;
};

export type AiWorkspaceExportSummary = {
  exportedTracks: number;
  exportedProjects: number;
  exportedLyrics: number;
  exportedMetadata: number;
};

export type AiWorkspaceControllerHealth = {
  controller: string;
  healthy: boolean;
};

export type AiWorkspaceControllerRegistry = {
  controllers: AiWorkspaceControllerHealth[];
};

export const EMPTY_AI_WORKSPACE_RUNTIME: AiWorkspaceRuntimeEnvironment = {
  version: AI_WORKSPACE_VERSION,
  build: "alpha",
  online: true,
  initialized: false,
  flags: [],
};

export const EMPTY_AI_WORKSPACE_CACHE: AiWorkspaceCacheStatistics = {
  entries: 0,
  hits: 0,
  misses: 0,
  expired: 0,
};

export const EMPTY_AI_WORKSPACE_WORKERS: AiWorkspaceWorker[] = [];

export const EMPTY_AI_WORKSPACE_EVENT_FEED: AiWorkspaceEventFeed = {
  events: [],
};

export const EMPTY_AI_WORKSPACE_IMPORT: AiWorkspaceImportSummary = {
  importedTracks: 0,
  importedProjects: 0,
  importedLyrics: 0,
  importedMetadata: 0,
};

export const EMPTY_AI_WORKSPACE_EXPORT: AiWorkspaceExportSummary = {
  exportedTracks: 0,
  exportedProjects: 0,
  exportedLyrics: 0,
  exportedMetadata: 0,
};

export const EMPTY_AI_WORKSPACE_CONTROLLER_REGISTRY: AiWorkspaceControllerRegistry =
  {
    controllers: [],
  };

export const DEFAULT_AI_WORKSPACE_USER: AiWorkspaceUserProfile = {
  id: "",
  displayName: "",
  role: "administrator",
  permissions: [],
};

// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 11
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceServiceState =
  | "starting"
  | "ready"
  | "stopped"
  | "degraded"
  | "failed";

export type AiWorkspaceService = {
  id: string;
  title: string;
  module: AiWorkspaceModule;
  state: AiWorkspaceServiceState;
  version: string;
};

export type AiWorkspaceProviderCapability = {
  id: string;
  title: string;
  supported: boolean;
};

export type AiWorkspaceProvider = {
  id: string;
  provider: AiWorkspaceModelProvider;
  title: string;
  connected: boolean;
  capabilities: AiWorkspaceProviderCapability[];
};

export type AiWorkspaceExecutionStage =
  | "queued"
  | "preparing"
  | "executing"
  | "finalizing"
  | "finished";

export type AiWorkspaceExecutionContext = {
  executionId: string;
  stage: AiWorkspaceExecutionStage;
  module: AiWorkspaceModule;
  startedAt: string;
};

export type AiWorkspaceExecutionSummary = {
  totalExecutions: number;
  runningExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
};

export type AiWorkspaceMessageLevel =
  | "debug"
  | "info"
  | "warning"
  | "error";

export type AiWorkspaceLogMessage = {
  id: string;
  timestamp: string;
  level: AiWorkspaceMessageLevel;
  module: AiWorkspaceModule;
  message: string;
};

export type AiWorkspaceLogSession = {
  sessionId: string;
  messages: AiWorkspaceLogMessage[];
};

export type AiWorkspaceExtension = {
  id: string;
  title: string;
  version: string;
  enabled: boolean;
};

export type AiWorkspaceExtensionRegistry = {
  extensions: AiWorkspaceExtension[];
};

export type AiWorkspaceApiEndpoint = {
  id: string;
  route: string;
  online: boolean;
};

export type AiWorkspaceApiRegistry = {
  endpoints: AiWorkspaceApiEndpoint[];
};

export type AiWorkspaceSchedulerJob = {
  id: string;
  title: string;
  enabled: boolean;
  interval: string;
};

export type AiWorkspaceScheduler = {
  jobs: AiWorkspaceSchedulerJob[];
};

export type AiWorkspaceLicense = {
  edition: string;
  expiresAt: string;
  active: boolean;
};

export const EMPTY_AI_WORKSPACE_SERVICES: AiWorkspaceService[] = [];

export const EMPTY_AI_WORKSPACE_PROVIDERS: AiWorkspaceProvider[] = [];

export const EMPTY_AI_WORKSPACE_EXECUTION: AiWorkspaceExecutionSummary = {
  totalExecutions: 0,
  runningExecutions: 0,
  completedExecutions: 0,
  failedExecutions: 0,
};

export const EMPTY_AI_WORKSPACE_LOG_SESSION: AiWorkspaceLogSession = {
  sessionId: "",
  messages: [],
};

export const EMPTY_AI_WORKSPACE_EXTENSION_REGISTRY: AiWorkspaceExtensionRegistry =
  {
    extensions: [],
  };

export const EMPTY_AI_WORKSPACE_API_REGISTRY: AiWorkspaceApiRegistry = {
  endpoints: [],
};

export const EMPTY_AI_WORKSPACE_SCHEDULER: AiWorkspaceScheduler = {
  jobs: [],
};

export const DEFAULT_AI_WORKSPACE_LICENSE: AiWorkspaceLicense = {
  edition: "Community",
  expiresAt: "",
  active: true,
};

// ============================================================================
// lib/ai/workspace/AiWorkspaceTypes.ts
// CONTINUATION 12 (FINAL)
// APPEND TO THE END OF THE FILE
// ============================================================================

export type AiWorkspaceWorkspaceLifecycle =
  | "booting"
  | "loading"
  | "ready"
  | "busy"
  | "saving"
  | "closing";

export type AiWorkspaceWorkspaceRuntime = {
  lifecycle: AiWorkspaceWorkspaceLifecycle;
  initialized: boolean;
  lastHeartbeat: string;
};

export type AiWorkspaceHeartbeat = {
  timestamp: string;
  module: AiWorkspaceModule;
  healthy: boolean;
};

export type AiWorkspaceRuntimeStatistics = {
  uptimeSeconds: number;
  restartCount: number;
  heartbeatCount: number;
};

export type AiWorkspaceValidationSeverity =
  | "info"
  | "warning"
  | "error";

export type AiWorkspaceValidationIssue = {
  id: string;
  module: AiWorkspaceModule;
  severity: AiWorkspaceValidationSeverity;
  title: string;
  description: string;
};

export type AiWorkspaceValidationReport = {
  generatedAt: string;
  issues: AiWorkspaceValidationIssue[];
};

export type AiWorkspaceInitializationStep = {
  id: string;
  title: string;
  completed: boolean;
};

export type AiWorkspaceInitializationState = {
  started: boolean;
  finished: boolean;
  steps: AiWorkspaceInitializationStep[];
};

export type AiWorkspaceRuntimeSnapshot = {
  runtime: AiWorkspaceWorkspaceRuntime;
  statistics: AiWorkspaceRuntimeStatistics;
  validation: AiWorkspaceValidationReport;
};

export const EMPTY_AI_WORKSPACE_RUNTIME_STATE: AiWorkspaceWorkspaceRuntime = {
  lifecycle: "booting",
  initialized: false,
  lastHeartbeat: "",
};

export const EMPTY_AI_WORKSPACE_RUNTIME_STATISTICS: AiWorkspaceRuntimeStatistics =
  {
    uptimeSeconds: 0,
    restartCount: 0,
    heartbeatCount: 0,
  };

export const EMPTY_AI_WORKSPACE_VALIDATION: AiWorkspaceValidationReport = {
  generatedAt: "",
  issues: [],
};

export const EMPTY_AI_WORKSPACE_INITIALIZATION: AiWorkspaceInitializationState =
  {
    started: false,
    finished: false,
    steps: [],
  };

export const EMPTY_AI_WORKSPACE_RUNTIME_SNAPSHOT: AiWorkspaceRuntimeSnapshot = {
  runtime: EMPTY_AI_WORKSPACE_RUNTIME_STATE,
  statistics: EMPTY_AI_WORKSPACE_RUNTIME_STATISTICS,
  validation: EMPTY_AI_WORKSPACE_VALIDATION,
};