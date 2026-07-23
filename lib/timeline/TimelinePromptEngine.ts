import type {
  TimelineEvent,
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelinePromptRole = "system" | "user" | "assistant";
export type TimelinePromptRequestStatus =
  | "draft"
  | "ready"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type TimelinePromptTemplate = {
  id: TimelineId;
  name: string;
  description: string;
  role: TimelinePromptRole;
  content: string;
  requiredVariables: string[];
  optionalVariables: string[];
  tags: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: TimelineUserId;
};

export type TimelinePromptContextOptions = {
  eventIds?: TimelineId[];
  trackIds?: TimelineId[];
  includeRelationships?: boolean;
  includeMetadata?: boolean;
  includeLyrics?: boolean;
  maxEvents?: number;
};

export type TimelinePromptMessage = {
  role: TimelinePromptRole;
  content: string;
};

export type TimelinePromptRequest = {
  id: TimelineId;
  projectId: TimelineProjectId;
  templateId: TimelineId;
  templateVersion: number;
  status: TimelinePromptRequestStatus;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  estimatedInputTokens: number;
  messages: TimelinePromptMessage[];
  variables: Record<string, string>;
  contextEventIds: TimelineId[];
  createdAt: string;
  createdBy: TimelineUserId;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  response?: string;
};

export type TimelinePromptBuildResult = {
  valid: boolean;
  request: TimelinePromptRequest | null;
  errors: string[];
  warnings: string[];
};

export type TimelinePromptResult = {
  requestId: TimelineId;
  response: string;
  inputTokens: number;
  outputTokens: number;
  completedAt: string;
};

function normalizeVariableName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_.-]/g, "");
}

function extractVariables(content: string): string[] {
  return Array.from(
    new Set(
      Array.from(content.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)).map(
        (match) => normalizeVariableName(match[1])
      )
    )
  );
}

function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.ceil(text.length / 4);
}

function interpolate(
  content: string,
  variables: Record<string, string>
): { content: string; missing: string[] } {
  const missing = new Set<string>();
  const rendered = content.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (_match, rawName: string) => {
      const name = normalizeVariableName(rawName);
      const value = variables[name];
      if (value === undefined || value.trim() === "") {
        missing.add(name);
        return `{{${name}}}`;
      }
      return value;
    }
  );
  return { content: rendered, missing: Array.from(missing) };
}

function eventContext(event: TimelineEvent, options: TimelinePromptContextOptions): string {
  const lines = [
    `Event: ${event.title}`,
    `ID: ${event.id}`,
    `Type: ${event.type}`,
    `Status: ${event.status}`,
    `Track: ${event.trackId}`,
    `Time: ${event.location.seconds}s`,
  ];
  if (event.summary) lines.push(`Summary: ${event.summary}`);
  if (event.content) lines.push(`Content: ${event.content}`);
  if (options.includeLyrics && event.lyric) lines.push(`Lyrics: ${event.lyric}`);
  if (event.prompt) lines.push(`Prompt: ${event.prompt}`);
  if (event.response) lines.push(`Response: ${event.response}`);
  if (event.notes) lines.push(`Notes: ${event.notes}`);
  if (options.includeMetadata) {
    lines.push(`Category: ${event.metadata.category}`);
    if (event.genre) lines.push(`Genre: ${event.genre}`);
    if (event.mood) lines.push(`Mood: ${event.mood}`);
    if (event.bpm) lines.push(`BPM: ${event.bpm}`);
  }
  if (options.includeRelationships && event.relationships.length) {
    lines.push(
      `Relationships: ${event.relationships
        .map(
          (relationship) =>
            `${relationship.type || relationship.relationship || "related"} -> ${
              relationship.targetId
            }`
        )
        .join(", ")}`
    );
  }
  return lines.join("\n");
}

export class TimelinePromptEngine {
  private readonly templates = new Map<TimelineId, TimelinePromptTemplate[]>();
  private readonly requests = new Map<TimelineId, TimelinePromptRequest>();
  private readonly queue: TimelineId[] = [];
  private requestSequence = 0;

  saveTemplate(
    input: Omit<
      TimelinePromptTemplate,
      "version" | "createdAt" | "updatedAt"
    >
  ): TimelinePromptTemplate {
    if (!input.id.trim() || !input.name.trim() || !input.content.trim()) {
      throw new Error("Prompt template requires an ID, name, and content.");
    }
    const declared = new Set([
      ...input.requiredVariables.map(normalizeVariableName),
      ...input.optionalVariables.map(normalizeVariableName),
    ]);
    const undeclared = extractVariables(input.content).filter(
      (variable) => !declared.has(variable)
    );
    if (undeclared.length) {
      throw new Error(`Template variables are not declared: ${undeclared.join(", ")}.`);
    }
    const versions = this.templates.get(input.id) ?? [];
    const now = new Date().toISOString();
    const template: TimelinePromptTemplate = {
      ...input,
      requiredVariables: Array.from(
        new Set(input.requiredVariables.map(normalizeVariableName))
      ),
      optionalVariables: Array.from(
        new Set(input.optionalVariables.map(normalizeVariableName))
      ),
      tags: Array.from(new Set(input.tags)),
      version: versions.length + 1,
      createdAt: versions[0]?.createdAt ?? now,
      updatedAt: now,
    };
    versions.push(template);
    this.templates.set(input.id, versions);
    return { ...template };
  }

  getTemplate(templateId: TimelineId, version?: number): TimelinePromptTemplate | null {
    const versions = this.templates.get(templateId) ?? [];
    const template =
      version === undefined
        ? versions.at(-1)
        : versions.find((candidate) => candidate.version === version);
    return template ? { ...template } : null;
  }

  buildContext(
    workspace: TimelineWorkspace,
    options: TimelinePromptContextOptions = {}
  ): { text: string; eventIds: TimelineId[]; warnings: string[] } {
    const warnings: string[] = [];
    const eventIds = new Set(options.eventIds ?? []);
    let events = workspace.events.filter((event) => {
      if (eventIds.size && !eventIds.has(event.id)) return false;
      if (options.trackIds?.length && !options.trackIds.includes(event.trackId)) {
        return false;
      }
      return !event.hidden && !event.archived;
    });
    const limit = Math.max(1, Math.min(500, options.maxEvents ?? 50));
    if (events.length > limit) {
      warnings.push(`Context was limited from ${events.length} to ${limit} events.`);
      events = events.slice(0, limit);
    }
    return {
      text: events.map((event) => eventContext(event, options)).join("\n\n---\n\n"),
      eventIds: events.map((event) => event.id),
      warnings,
    };
  }

  buildRequest(input: {
    templateId: TimelineId;
    templateVersion?: number;
    workspace: TimelineWorkspace;
    variables: Record<string, string>;
    context?: TimelinePromptContextOptions;
    model: string;
    temperature?: number;
    maxOutputTokens?: number;
    maxInputTokens?: number;
    createdBy: TimelineUserId;
  }): TimelinePromptBuildResult {
    const template = this.getTemplate(input.templateId, input.templateVersion);
    if (!template) {
      return { valid: false, request: null, errors: ["Prompt template does not exist."], warnings: [] };
    }
    const errors: string[] = [];
    const context = this.buildContext(input.workspace, input.context);
    const variables = { ...input.variables, timelineContext: context.text };
    const rendered = interpolate(template.content, variables);
    const missingRequired = rendered.missing.filter((name) =>
      template.requiredVariables.includes(name)
    );
    if (missingRequired.length) {
      errors.push(`Required variables are missing: ${missingRequired.join(", ")}.`);
    }
    if (!input.model.trim()) errors.push("Model is required.");
    const temperature = input.temperature ?? 0.3;
    if (temperature < 0 || temperature > 2) errors.push("Temperature must be between 0 and 2.");
    const estimatedInputTokens = estimateTokens(rendered.content);
    const maxInputTokens = input.maxInputTokens ?? 100_000;
    if (estimatedInputTokens > maxInputTokens) {
      errors.push(
        `Estimated input tokens ${estimatedInputTokens} exceed budget ${maxInputTokens}.`
      );
    }
    if (errors.length) {
      return { valid: false, request: null, errors, warnings: context.warnings };
    }
    this.requestSequence += 1;
    const request: TimelinePromptRequest = {
      id: `timeline-prompt-request-${this.requestSequence}`,
      projectId: input.workspace.projectId,
      templateId: template.id,
      templateVersion: template.version,
      status: "ready",
      model: input.model,
      temperature,
      maxOutputTokens: Math.max(1, input.maxOutputTokens ?? 2_000),
      estimatedInputTokens,
      messages: [{ role: template.role, content: rendered.content }],
      variables: { ...input.variables },
      contextEventIds: context.eventIds,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };
    this.requests.set(request.id, request);
    return { valid: true, request: { ...request }, errors: [], warnings: context.warnings };
  }

  enqueue(requestId: TimelineId): TimelinePromptRequest {
    const request = this.requireRequest(requestId);
    if (request.status !== "ready") throw new Error("Only ready requests can be queued.");
    request.status = "queued";
    this.queue.push(requestId);
    return { ...request };
  }

  startNext(): TimelinePromptRequest | null {
    const requestId = this.queue.shift();
    if (!requestId) return null;
    const request = this.requireRequest(requestId);
    request.status = "running";
    request.startedAt = new Date().toISOString();
    return { ...request };
  }

  complete(requestId: TimelineId, result: TimelinePromptResult): TimelinePromptRequest {
    const request = this.requireRequest(requestId);
    if (request.status !== "running") throw new Error("Only running requests can complete.");
    request.status = "completed";
    request.response = result.response;
    request.completedAt = result.completedAt;
    return { ...request };
  }

  fail(requestId: TimelineId, error: string): TimelinePromptRequest {
    const request = this.requireRequest(requestId);
    request.status = "failed";
    request.error = error;
    request.completedAt = new Date().toISOString();
    return { ...request };
  }

  cancel(requestId: TimelineId): TimelinePromptRequest {
    const request = this.requireRequest(requestId);
    if (request.status === "completed") throw new Error("Completed requests cannot be cancelled.");
    request.status = "cancelled";
    const index = this.queue.indexOf(requestId);
    if (index >= 0) this.queue.splice(index, 1);
    return { ...request };
  }

  private requireRequest(requestId: TimelineId): TimelinePromptRequest {
    const request = this.requests.get(requestId);
    if (!request) throw new Error(`Prompt request ${requestId} does not exist.`);
    return request;
  }

  getRequest(requestId: TimelineId): TimelinePromptRequest | null {
    const request = this.requests.get(requestId);
    return request ? { ...request, messages: request.messages.map((message) => ({ ...message })) } : null;
  }

  getQueueStatus() {
    return {
      queued: [...this.queue],
      requests: this.requests.size,
      completed: Array.from(this.requests.values()).filter(
        (request) => request.status === "completed"
      ).length,
      failed: Array.from(this.requests.values()).filter(
        (request) => request.status === "failed"
      ).length,
    };
  }

  reset(): void {
    this.templates.clear();
    this.requests.clear();
    this.queue.splice(0);
    this.requestSequence = 0;
  }
}

export const timelinePromptEngine = new TimelinePromptEngine();
