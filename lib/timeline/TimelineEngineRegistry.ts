import type { TimelineId } from "./TimelineTypes";

export type TimelineEngineDomain =
  | "core"
  | "ai"
  | "audio"
  | "editing"
  | "collaboration"
  | "production"
  | "release"
  | "recovery";

export type TimelineEngineDescriptor = {
  id: TimelineId;
  name: string;
  module: string;
  version: string;
  domain: TimelineEngineDomain;
  capabilities: string[];
  dependencies: TimelineId[];
  required: boolean;
};

export type TimelineEngineProbe = {
  engineId: TimelineId;
  healthy: boolean;
  checkedAt: string;
  version: string;
  message: string;
};

export type TimelineEngineReadinessReport = {
  ready: boolean;
  registered: number;
  healthy: number;
  required: number;
  startupOrder: TimelineId[];
  errors: string[];
  warnings: string[];
  generatedAt: string;
};

export type TimelineEngineRegistryArchive = {
  descriptors: TimelineEngineDescriptor[];
  probes: TimelineEngineProbe[];
};

const clone = <T>(value: T): T => structuredClone(value);

function descriptor(
  id: string,
  module: string,
  domain: TimelineEngineDomain,
  dependencies: string[] = [],
  capabilities: string[] = [],
): TimelineEngineDescriptor {
  return {
    id,
    name: module.replace(/^Timeline/, "").replace(/Engine$/, "").replace(/([a-z])([A-Z])/g, "$1 $2"),
    module: `./${module}`,
    version: "1.0.0",
    domain,
    capabilities: capabilities.length ? capabilities : [id],
    dependencies,
    required: true,
  };
}

export const TIMELINE_ENGINE_CATALOG: TimelineEngineDescriptor[] = [
  descriptor("validation", "TimelineValidationEngine", "core"),
  descriptor("diagnostics", "TimelineDiagnosticsEngine", "core", ["validation"]),
  descriptor("query", "TimelineQueryEngine", "core", ["validation"]),
  descriptor("history", "TimelineHistoryEngine", "core"),
  descriptor("version", "TimelineVersionEngine", "core", ["history"]),
  descriptor("trash", "TimelineTrashEngine", "core", ["history"]),
  descriptor("relationships", "TimelineRelationshipEngine", "core"),
  descriptor("actions", "TimelineActionEngine", "core", ["validation", "history"]),
  descriptor("event-dependencies", "TimelineEventDependencyEngine", "core", ["validation"]),
  descriptor("event-lifecycle", "TimelineEventLifecycleEngine", "core", ["event-dependencies"]),
  descriptor("event-lifecycle-service", "TimelineEventLifecycleService", "core", ["event-lifecycle"]),
  descriptor("workspace-store", "TimelineProjectWorkspaceStore", "core", ["validation"]),
  descriptor("workflow-ledger", "TimelineWorkflowLedger", "core", ["history"]),
  descriptor("workflow-policy", "TimelineWorkflowApiPolicy", "core", ["workflow-ledger"]),
  descriptor("orchestration", "TimelineOrchestrationEngine", "core", ["actions", "workflow-ledger"]),
  descriptor("recorded-orchestration", "TimelineRecordedOrchestrationEngine", "core", ["orchestration"]),
  descriptor("analytics", "TimelineAnalyticsEngine", "core", ["query"]),
  descriptor("ai", "TimelineAIEngine", "ai", ["validation"]),
  descriptor("openai-transport", "TimelineOpenAITransport", "ai", ["ai"]),
  descriptor("prompt", "TimelinePromptEngine", "ai", ["ai"]),
  descriptor("ai-event-intake", "TimelineAIEventIntakeEngine", "ai", ["prompt", "event-lifecycle"]),
  descriptor("prompt-track-generation", "TimelinePromptToTrackGenerationEngine", "ai", ["openai-transport", "ai-event-intake"]),
  descriptor("ai-mix-assistant", "AIMixAssistantEngine", "ai", ["ai", "mix-evaluation"]),
  descriptor("lyric-pronunciation", "TimelineLyricPronunciationEngine", "ai", ["ai", "validation"]),
  descriptor("audio-artifacts", "TimelineAudioArtifactRepositoryEngine", "audio", ["validation"]),
  descriptor("audio-decode", "TimelineAudioDecodeEngine", "audio", ["audio-artifacts"]),
  descriptor("transient-analysis", "TimelineTransientAnalysisEngine", "audio", ["audio-decode"]),
  descriptor("tempo-key-analysis", "TimelineTempoKeyAnalysisEngine", "audio", ["audio-decode", "transient-analysis"]),
  descriptor("slice-map", "TimelineSliceMapEngine", "audio", ["transient-analysis", "tempo-key-analysis"]),
  descriptor("groove-mapping", "TimelineGrooveMappingEngine", "audio", ["slice-map"]),
  descriptor("slice-playback", "TimelineSlicePlaybackEngine", "audio", ["slice-map"]),
  descriptor("loop-sequencing", "TimelineLoopSequencingEngine", "audio", ["slice-map", "groove-mapping"]),
  descriptor("slice-transformation", "TimelineSliceTransformationEngine", "audio", ["slice-map"]),
  descriptor("intelligent-loop-variation", "TimelineIntelligentLoopVariationEngine", "audio", ["loop-sequencing", "slice-transformation"]),
  descriptor("real-time-audio-graph", "TimelineRealTimeAudioGraphEngine", "audio", ["audio-integrity", "plugin-host"]),
  descriptor("multi-track-session", "TimelineMultiTrackSessionEngine", "audio", ["real-time-audio-graph", "song-tracks"]),
  descriptor("transport-synchronization", "TimelineTransportAndSynchronizationEngine", "audio", ["multi-track-session", "real-time-audio-graph"]),
  descriptor("recording-take-management", "TimelineRecordingAndTakeManagementEngine", "audio", ["transport-synchronization", "multi-track-session", "performance-capture"]),
  descriptor("audio-clip-arrangement", "TimelineAudioClipAndArrangementEngine", "editing", ["recording-take-management", "non-destructive-editing", "arrangement-branches"]),
  descriptor("midi-performance", "TimelineMidiPerformanceEngine", "editing", ["transport-synchronization", "multi-track-session", "midi-arrangement"]),
  descriptor("instrument-sampler", "TimelineInstrumentAndSamplerEngine", "audio", ["midi-performance", "slice-playback", "audio-integrity"]),
  descriptor("mixer-routing", "TimelineMixerAndRoutingEngine", "audio", ["multi-track-session", "real-time-audio-graph", "mix-session"]),
  descriptor("plugin-device-chain", "TimelinePluginAndDeviceChainEngine", "audio", ["mixer-routing", "instrument-sampler", "real-time-audio-graph"]),
  descriptor("automation-execution", "TimelineAutomationExecutionEngine", "audio", ["plugin-device-chain", "mix-automation", "transport-synchronization"]),
  descriptor("offline-render-export", "TimelineOfflineRenderAndExportEngine", "production", ["automation-execution", "mixer-routing", "audio-integrity"]),
  descriptor("session-recovery-performance", "TimelineSessionRecoveryAndPerformanceEngine", "recovery", ["offline-render-export", "workspace-recovery", "real-time-audio-graph"]),
  descriptor("audio-integrity", "TimelineAudioArtifactIntegrityEngine", "audio", ["audio-artifacts"]),
  descriptor("audio-processing", "TimelineAudioProcessingQueueEngine", "audio", ["audio-integrity"]),
  descriptor("performance-capture", "TimelinePerformanceCaptureEngine", "audio", ["audio-artifacts"]),
  descriptor("track-revisions", "TimelineTrackRevisionEngine", "editing", ["audio-artifacts", "version"]),
  descriptor("non-destructive-editing", "TimelineNonDestructiveEditingEngine", "editing", ["track-revisions"]),
  descriptor("hybrid-editing", "TimelineHybridEditingEngine", "editing", ["non-destructive-editing", "ai"]),
  descriptor("song-tracks", "TimelineSongTrackRepositoryEngine", "editing", ["track-revisions"]),
  descriptor("arrangement-branches", "TimelineSongArrangementBranchEngine", "editing", ["song-tracks", "version"]),
  descriptor("midi-arrangement", "TimelineMidiArrangementEngine", "editing", ["arrangement-branches"]),
  descriptor("stem-separation", "TimelineStemSeparationRecombinationEngine", "editing", ["audio-processing"]),
  descriptor("vocal-production", "TimelineVocalProductionEngine", "editing", ["lyric-pronunciation", "audio-processing"]),
  descriptor("reference-analysis", "TimelineReferenceTrackAnalysisEngine", "audio", ["audio-integrity"]),
  descriptor("sound-recipe", "TimelineSoundRecipeEngine", "audio", ["audio-processing"]),
  descriptor("sound-recipe-version", "TimelineSoundRecipeVersionEngine", "audio", ["sound-recipe", "version"]),
  descriptor("sound-lab", "TimelineSoundLabEngine", "audio", ["sound-recipe-version"]),
  descriptor("mix-session", "TimelineMixSessionEngine", "audio", ["song-tracks"]),
  descriptor("effect-rack", "TimelineEffectRackEngine", "audio", ["mix-session"]),
  descriptor("plugin-host", "TimelinePluginProcessingHostEngine", "audio", ["effect-rack"]),
  descriptor("mix-automation", "TimelineMixAutomationEngine", "audio", ["mix-session"]),
  descriptor("mix-evaluation", "TimelineMixEvaluationEngine", "audio", ["mix-session"]),
  descriptor("mastering", "TimelineMasteringEngine", "production", ["mix-evaluation"]),
  descriptor("collaboration-approval", "TimelineCollaborationApprovalEngine", "collaboration", ["workflow-ledger"]),
  descriptor("credits", "TimelineCreditsContributionEngine", "collaboration", ["collaboration-approval"]),
  descriptor("rights", "TimelineRightsProvenanceEngine", "release", ["credits"]),
  descriptor("release-publishing", "TimelineReleasePublishingEngine", "release", ["mastering", "rights"]),
  descriptor("release-monitoring", "TimelineReleaseMonitoringEngine", "release", ["release-publishing"]),
  descriptor("release-analytics", "TimelineReleaseAnalyticsEngine", "release", ["release-monitoring"]),
  descriptor("royalties", "TimelineRoyaltyRevenueEngine", "release", ["release-publishing", "rights"]),
  descriptor("album-sequencing", "TimelineAlbumSetSequencingEngine", "production", ["mastering"]),
  descriptor("interchange-export", "TimelineInterchangeExportEngine", "production", ["audio-integrity"]),
  descriptor("recovery-policy", "TimelineAudioRecoveryPolicyEngine", "recovery", ["audio-integrity"]),
  descriptor("workspace-recovery", "TimelineAudioWorkspaceRecoveryEngine", "recovery", ["recovery-policy", "workspace-store"]),
  descriptor("project-sync", "TimelineProjectSyncEngine", "recovery", ["workspace-recovery"]),
  descriptor("production-coordinator", "TimelineProductionCoordinatorEngine", "production", ["orchestration", "collaboration-approval", "mastering", "rights", "interchange-export", "project-sync"]),
  descriptor("activation-gate", "TimelineEngineActivationGate", "core", ["production-coordinator"]),
  descriptor("activation-ledger", "TimelineEngineActivationService", "core", ["activation-gate"]),
];

export class TimelineEngineRegistry {
  private readonly descriptors = new Map<TimelineId, TimelineEngineDescriptor>();
  private readonly probes = new Map<TimelineId, TimelineEngineProbe>();

  constructor(
    descriptors: TimelineEngineDescriptor[] = TIMELINE_ENGINE_CATALOG,
    private readonly now: () => Date = () => new Date(),
  ) {
    for (const value of descriptors) this.register(value);
  }

  register(input: TimelineEngineDescriptor): void {
    const value = clone(input);
    if (!value.id.trim() || !value.name.trim() || !value.module.trim() || !value.version.trim()) {
      throw new Error("Engine descriptor requires ID, name, module, and version.");
    }
    if (this.descriptors.has(value.id)) throw new Error(`Duplicate engine ID: ${value.id}`);
    if (!/^\d+\.\d+\.\d+$/.test(value.version)) throw new Error(`Engine ${value.id} has an invalid semantic version.`);
    value.capabilities = [...new Set(value.capabilities.map((item) => item.trim()).filter(Boolean))];
    value.dependencies = [...new Set(value.dependencies.map((item) => item.trim()).filter(Boolean))];
    if (value.dependencies.includes(value.id)) throw new Error(`Engine ${value.id} cannot depend on itself.`);
    this.descriptors.set(value.id, value);
  }

  recordProbe(input: TimelineEngineProbe): void {
    const engine = this.descriptors.get(input.engineId);
    if (!engine) throw new Error(`Unknown engine probe target: ${input.engineId}`);
    if (input.version !== engine.version) throw new Error(`Engine ${input.engineId} probe version does not match its descriptor.`);
    if (Number.isNaN(Date.parse(input.checkedAt))) throw new Error("Engine probe time is invalid.");
    this.probes.set(input.engineId, clone(input));
  }

  probeAll(health: (descriptor: TimelineEngineDescriptor) => { healthy: boolean; message: string }): void {
    for (const value of this.list()) {
      const result = health(value);
      this.recordProbe({ engineId: value.id, healthy: result.healthy, message: result.message, version: value.version, checkedAt: this.now().toISOString() });
    }
  }

  readiness(): TimelineEngineReadinessReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    let startupOrder: TimelineId[] = [];
    for (const value of this.descriptors.values()) {
      for (const dependency of value.dependencies) {
        if (!this.descriptors.has(dependency)) errors.push(`${value.id} requires missing engine ${dependency}.`);
      }
      const probe = this.probes.get(value.id);
      if (value.required && !probe) errors.push(`${value.id} has no health probe.`);
      else if (value.required && !probe?.healthy) errors.push(`${value.id} is unhealthy: ${probe?.message ?? "unknown"}`);
      else if (probe && !probe.healthy) warnings.push(`${value.id} is unhealthy: ${probe.message}`);
    }
    try {
      startupOrder = this.startupOrder();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    return {
      ready: errors.length === 0,
      registered: this.descriptors.size,
      healthy: [...this.probes.values()].filter((value) => value.healthy).length,
      required: [...this.descriptors.values()].filter((value) => value.required).length,
      startupOrder,
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)],
      generatedAt: this.now().toISOString(),
    };
  }

  startupOrder(): TimelineId[] {
    const order: TimelineId[] = [];
    const active = new Set<TimelineId>();
    const visited = new Set<TimelineId>();
    const visit = (id: TimelineId) => {
      if (active.has(id)) throw new Error(`Engine dependency cycle contains ${id}.`);
      if (visited.has(id)) return;
      const value = this.descriptors.get(id);
      if (!value) throw new Error(`Startup requires missing engine ${id}.`);
      active.add(id);
      for (const dependency of value.dependencies) visit(dependency);
      active.delete(id);
      visited.add(id);
      order.push(id);
    };
    for (const id of this.descriptors.keys()) visit(id);
    return order;
  }

  dependents(engineId: TimelineId): TimelineEngineDescriptor[] {
    if (!this.descriptors.has(engineId)) throw new Error(`Unknown engine: ${engineId}`);
    return this.list().filter((value) => value.dependencies.includes(engineId));
  }

  impact(engineId: TimelineId): TimelineId[] {
    const found = new Set<TimelineId>();
    const visit = (id: TimelineId) => {
      for (const dependent of this.dependents(id)) {
        if (!found.has(dependent.id)) {
          found.add(dependent.id);
          visit(dependent.id);
        }
      }
    };
    visit(engineId);
    return [...found];
  }

  list(): TimelineEngineDescriptor[] {
    return [...this.descriptors.values()].map(clone);
  }

  exportArchive(): TimelineEngineRegistryArchive {
    return { descriptors: this.list(), probes: [...this.probes.values()].map(clone) };
  }

  restoreArchive(archive: TimelineEngineRegistryArchive): void {
    this.descriptors.clear();
    this.probes.clear();
    for (const value of archive.descriptors) this.register(value);
    for (const value of archive.probes) this.recordProbe(value);
    this.startupOrder();
  }
}
