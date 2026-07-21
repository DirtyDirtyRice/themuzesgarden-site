import "server-only";

import type { ProjectContextBundle } from "./projectContext";

export type AiAssistantCitation = {
  path: string;
  startLine: number;
  endLine: number;
  reason: string;
};

export type AiAssistantAnswer = {
  answer: string;
  model: string;
  responseId: string | null;
  citations: AiAssistantCitation[];
  contextCharacters: number;
};

type ResponsesApiOutput = {
  id?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { message?: string };
};

const DEFAULT_MODEL = "gpt-5.6";
const REQUEST_TIMEOUT_MS = 120_000;

export function aiAssistantConfiguration() {
  return {
    configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: process.env.OPENAI_DEVELOPER_WORKSPACE_MODEL?.trim() || DEFAULT_MODEL,
  };
}

function contextText(bundle: ProjectContextBundle): string {
  const symbols = bundle.symbols.map((symbol) =>
    `- ${symbol.kind} ${symbol.containerName ? `${symbol.containerName}.` : ""}${symbol.name} at ${symbol.path}:${symbol.line}:${symbol.column}`
  ).join("\n");
  const files = bundle.files.map((file) => `- ${file.path}`).join("\n");
  const excerpts = bundle.excerpts.map((excerpt) => {
    const lines = excerpt.lines.map((line) => `${line.number}: ${line.text}`).join("\n");
    return `FILE ${excerpt.path} LINES ${excerpt.startLine}-${excerpt.endLine} (${excerpt.reason})\n${lines}`;
  }).join("\n\n");

  return `MATCHED SYMBOLS\n${symbols || "None"}\n\nMATCHED FILES\n${files || "None"}\n\nSOURCE EXCERPTS\n${excerpts || "None"}`;
}

function extractOutputText(body: ResponsesApiOutput): string {
  if (body.output_text?.trim()) return body.output_text.trim();
  const text = body.output?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("The model returned no readable answer.");
  return text;
}

export async function answerProjectQuestion(question: string, context: ProjectContextBundle): Promise<AiAssistantAnswer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server.");
  const model = process.env.OPENAI_DEVELOPER_WORKSPACE_MODEL?.trim() || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: "You are the AI coding assistant inside a private Developer Workspace. Answer only from the supplied indexed project evidence. Be concise and actionable. Cite code locations inline as path:line. Clearly say when the evidence is insufficient. Never claim a file was changed or a command was run.",
        input: `DEVELOPER QUESTION\n${question}\n\nINDEXED PROJECT EVIDENCE\n${contextText(context)}`,
      }),
      signal: controller.signal,
    });
    const body = await response.json() as ResponsesApiOutput;
    if (!response.ok) throw new Error(body.error?.message || `OpenAI request failed with status ${response.status}.`);
    return {
      answer: extractOutputText(body),
      model,
      responseId: body.id ?? null,
      citations: context.excerpts.map(({ path, startLine, endLine, reason }) => ({ path, startLine, endLine, reason })),
      contextCharacters: context.characterCount,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("The AI request timed out after 120 seconds.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
