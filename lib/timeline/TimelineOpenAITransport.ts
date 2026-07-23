import type {
  TimelineAIResponseFormat,
  TimelineAITransport,
  TimelineAITransportRequest,
  TimelineAITransportResponse,
} from "./TimelineAIEngine";

export type TimelineOpenAITransportConfiguration = {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  project?: string;
  fetchImplementation?: typeof fetch;
};

export type TimelineOpenAIConfigurationStatus = {
  configured: boolean;
  baseUrl: string;
  organizationConfigured: boolean;
  projectConfigured: boolean;
};

type OpenAIErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
    param?: string | null;
  };
};

type OpenAIResponseBody = OpenAIErrorBody & {
  id?: string;
  model?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  incomplete_details?: {
    reason?: string;
  } | null;
};

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function configuredValue(explicit: string | undefined, environmentName: string): string {
  return explicit?.trim() || process.env[environmentName]?.trim() || "";
}

function responseEndpoint(baseUrl: string): string {
  return `${trimTrailingSlash(baseUrl || DEFAULT_BASE_URL)}/responses`;
}

function extractResponseText(body: OpenAIResponseBody): string {
  if (body.output_text?.trim()) return body.output_text.trim();
  const text = (body.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
  if (!text) {
    if (body.status === "incomplete") {
      const reason = body.incomplete_details?.reason?.trim();
      throw new Error(
        `OpenAI response was incomplete${reason ? `: ${reason}` : "."}`
      );
    }
    throw new Error("OpenAI returned no readable response text.");
  }
  return text;
}

function providerError(status: number, body: OpenAIErrorBody): Error {
  const providerMessage = body.error?.message?.trim();
  const providerCode = body.error?.code?.trim();
  const detail = providerMessage || `OpenAI request failed with status ${status}.`;
  let prefix = "OpenAI request failed";
  if (status === 401 || status === 403) prefix = "OpenAI authentication failed";
  else if (status === 429) prefix = "OpenAI rate limit or quota was reached";
  else if (status >= 500) prefix = "OpenAI service is temporarily unavailable";
  const suffix = providerCode ? ` (${providerCode})` : "";
  return new Error(`${prefix}: ${detail}${suffix}`);
}

async function readResponseBody(response: Response): Promise<OpenAIResponseBody> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as OpenAIResponseBody;
  } catch {
    throw new Error(
      `OpenAI returned an unreadable response with status ${response.status}.`
    );
  }
}

function instructionsFor(format: TimelineAIResponseFormat): string {
  const safety =
    "Use only the supplied Timeline context. Never claim a timeline change was applied. " +
    "Any proposed change is held for validation and human review.";
  if (format === "json") {
    return (
      `${safety} Return one JSON object with an answer string and a proposals array. ` +
      "Each proposal must contain kind, targetId (or null), and a non-empty payload object. " +
      "Do not wrap JSON in Markdown fences."
    );
  }
  return `${safety} Return a concise plain-text answer.`;
}

function inputMessages(request: TimelineAITransportRequest) {
  return request.messages.map((message) => ({
    role: message.role,
    content: [{ type: "input_text", text: message.content }],
  }));
}

function requestBody(request: TimelineAITransportRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: request.model,
    instructions: instructionsFor(request.responseFormat),
    input: inputMessages(request),
    max_output_tokens: request.maxOutputTokens,
  };
  if (request.temperature !== 1) body.temperature = request.temperature;
  if (request.responseFormat === "json") {
    body.text = {
      format: {
        type: "json_schema",
        name: "timeline_ai_response",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            answer: { type: "string" },
            proposals: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  kind: { type: "string" },
                  targetId: { type: ["string", "null"] },
                  payload: { type: "object", additionalProperties: true },
                },
                required: ["kind", "targetId", "payload"],
              },
            },
          },
          required: ["answer", "proposals"],
        },
      },
    };
  }
  return body;
}

export function timelineOpenAIConfigurationStatus(
  configuration: TimelineOpenAITransportConfiguration = {}
): TimelineOpenAIConfigurationStatus {
  const apiKey = configuredValue(configuration.apiKey, "OPENAI_API_KEY");
  const baseUrl =
    configuration.baseUrl?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    DEFAULT_BASE_URL;
  return {
    configured: Boolean(apiKey),
    baseUrl: trimTrailingSlash(baseUrl),
    organizationConfigured: Boolean(
      configuredValue(configuration.organization, "OPENAI_ORGANIZATION")
    ),
    projectConfigured: Boolean(
      configuredValue(configuration.project, "OPENAI_PROJECT")
    ),
  };
}

export function createTimelineOpenAITransport(
  configuration: TimelineOpenAITransportConfiguration = {}
): TimelineAITransport {
  return async (
    request: TimelineAITransportRequest
  ): Promise<TimelineAITransportResponse> => {
    const apiKey = configuredValue(configuration.apiKey, "OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured on the server.");
    }
    if (!request.model.trim()) throw new Error("OpenAI model is required.");
    if (!request.messages.length) throw new Error("OpenAI input messages are required.");
    if (request.signal.aborted) {
      throw new DOMException("OpenAI request was cancelled.", "AbortError");
    }

    const baseUrl =
      configuration.baseUrl?.trim() ||
      process.env.OPENAI_BASE_URL?.trim() ||
      DEFAULT_BASE_URL;
    const organization = configuredValue(
      configuration.organization,
      "OPENAI_ORGANIZATION"
    );
    const project = configuredValue(configuration.project, "OPENAI_PROJECT");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (organization) headers["OpenAI-Organization"] = organization;
    if (project) headers["OpenAI-Project"] = project;

    const fetchImplementation = configuration.fetchImplementation ?? fetch;
    let response: Response;
    try {
      response = await fetchImplementation(responseEndpoint(baseUrl), {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody(request)),
        signal: request.signal,
      });
    } catch (error) {
      if (
        request.signal.aborted ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        throw new DOMException("OpenAI request was cancelled.", "AbortError");
      }
      throw new Error(
        `OpenAI network request failed: ${
          error instanceof Error ? error.message : "unknown network error"
        }`
      );
    }

    const body = await readResponseBody(response);
    if (!response.ok) throw providerError(response.status, body);
    const text = extractResponseText(body);
    return {
      id: body.id ?? null,
      model: body.model?.trim() || request.model,
      text,
      usage: {
        inputTokens: body.usage?.input_tokens,
        outputTokens: body.usage?.output_tokens,
        totalTokens: body.usage?.total_tokens,
      },
    };
  };
}

