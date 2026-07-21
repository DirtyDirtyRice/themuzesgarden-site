import "server-only";

import type { BuildDiagnostic } from "./buildDiagnostics";
import type { ProjectContextBundle } from "./projectContext";
import type { SafePatchProposal } from "./safePatchExecutor";

export type ErrorPatchInvestigation = {
  diagnosis: string;
  evidence: string;
  risks: string;
  verification: string;
  proposal: SafePatchProposal | null;
  model: string;
};

type ApiResponse = { id?: string; output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };

function evidenceText(context: ProjectContextBundle): string {
  return context.excerpts.map((excerpt) => `FILE ${excerpt.path} LINES ${excerpt.startLine}-${excerpt.endLine}\n${excerpt.lines.map((line) => `${line.number}: ${line.text}`).join("\n")}`).join("\n\n");
}

function outputText(body: ApiResponse): string {
  const text = body.output_text || body.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) throw new Error("The model returned no structured patch investigation.");
  return text.trim();
}

export async function proposeErrorPatch(diagnostic: BuildDiagnostic, context: ProjectContextBundle, temporalEvidence = "No temporal history was supplied."): Promise<ErrorPatchInvestigation> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured on the server.");
  const model = process.env.OPENAI_DEVELOPER_WORKSPACE_MODEL?.trim() || "gpt-5.6";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: "Diagnose the compiler error only from supplied evidence. Propose at most one small file patch. Copy expectedLines exactly, without displayed line-number prefixes. Use null proposal when evidence is insufficient.",
      input: `ERROR ${diagnostic.code ?? ""} at ${diagnostic.file ?? "build"}:${diagnostic.line ?? "?"}:${diagnostic.column ?? "?"}\n${diagnostic.message}\n\nTEMPORAL HISTORY\n${temporalEvidence}\n\nCURRENT SOURCE EVIDENCE\n${evidenceText(context)}`,
      text: { format: { type: "json_schema", name: "safe_error_patch", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          diagnosis: { type: "string" }, evidence: { type: "string" }, risks: { type: "string" }, verification: { type: "string" },
          proposal: { anyOf: [
            { type: "null" },
            { type: "object", additionalProperties: false, properties: {
              file: { type: "string" }, startLine: { type: "integer" }, endLine: { type: "integer" },
              expectedLines: { type: "array", items: { type: "string" } }, replacementLines: { type: "array", items: { type: "string" } }, explanation: { type: "string" },
            }, required: ["file", "startLine", "endLine", "expectedLines", "replacementLines", "explanation"] },
          ] },
        }, required: ["diagnosis", "evidence", "risks", "verification", "proposal"],
      } } },
    }),
  });
  const body = await response.json() as ApiResponse;
  if (!response.ok) throw new Error(body.error?.message || `OpenAI request failed with status ${response.status}.`);
  const parsed = JSON.parse(outputText(body)) as Omit<ErrorPatchInvestigation, "model">;
  return { ...parsed, model };
}
