import { NextRequest, NextResponse } from "next/server";

import type { CodeCapsuleRequirement, CreateCodeCapsuleInput } from "@/lib/developer-workspace/codeCapsule";
import { activateStoredCodeCapsule } from "@/lib/developer-workspace/codeCapsuleActivator";
import { validateStoredCodeCapsule } from "@/lib/developer-workspace/codeCapsuleValidator";
import {
  listCodeCapsules,
  readCodeCapsule,
  storeCodeCapsuleFragment,
  storeNewCodeCapsule,
} from "@/lib/developer-workspace/codeCapsuleStore";
import { resolveWorkspaceRequestContext } from "@/lib/developer-workspace/workspaceRequestContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function localDevelopment(request: NextRequest): boolean {
  const hostname = request.nextUrl.hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]");
}

function stringValue(value: unknown, name: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) throw new Error(`${name} is required.`);
  return value;
}

function integerValue(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(`${name} must be an integer.`);
  return value;
}

function requirementsValue(value: unknown): CodeCapsuleRequirement[] {
  if (!Array.isArray(value)) throw new Error("requirements must be an array.");
  const kinds = new Set(["text", "symbol", "import", "export"]);
  return value.map((item, index) => {
    if (typeof item !== "object" || item === null) throw new Error(`Requirement ${index + 1} is invalid.`);
    const candidate = item as Partial<CodeCapsuleRequirement>;
    const kind = stringValue(candidate.kind, `Requirement ${index + 1} kind`);
    if (!kinds.has(kind)) throw new Error(`Requirement ${index + 1} kind is unsupported.`);
    return {
      id: stringValue(candidate.id, `Requirement ${index + 1} id`),
      kind: kind as CodeCapsuleRequirement["kind"],
      value: stringValue(candidate.value, `Requirement ${index + 1} value`),
      description: stringValue(candidate.description, `Requirement ${index + 1} description`, true),
    };
  });
}

function createInput(value: unknown): CreateCodeCapsuleInput {
  if (typeof value !== "object" || value === null) throw new Error("Capsule input is required.");
  const candidate = value as Record<string, unknown>;
  const target = candidate.target;
  if (typeof target !== "object" || target === null) throw new Error("Capsule target is required.");
  const targetCandidate = target as Record<string, unknown>;
  if (!Array.isArray(targetCandidate.expectedLines) || !targetCandidate.expectedLines.every((line) => typeof line === "string")) {
    throw new Error("Capsule expectedLines must be an array of strings.");
  }
  return {
    title: stringValue(candidate.title, "Capsule title"),
    description: stringValue(candidate.description, "Capsule description", true),
    target: {
      file: stringValue(targetCandidate.file, "Capsule target file"),
      startLine: integerValue(targetCandidate.startLine, "Capsule startLine"),
      endLine: integerValue(targetCandidate.endLine, "Capsule endLine"),
      expectedLines: targetCandidate.expectedLines,
    },
    requirements: requirementsValue(candidate.requirements),
  };
}

export async function GET(request: NextRequest) {
  if (!localDevelopment(request)) return NextResponse.json({ error: "Code capsules are available only from the local development server." }, { status: 403 });
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const id = request.nextUrl.searchParams.get("id")?.trim();
    if (id) return NextResponse.json(await readCodeCapsule(id, context.root), { headers: { "Cache-Control": "no-store" } });
    const capsules = await listCodeCapsules(context.root);
    return NextResponse.json({ capsules, count: capsules.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Code capsules could not be read." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  if (!localDevelopment(request)) return NextResponse.json({ error: "Code capsules are available only from the local development server." }, { status: 403 });
  try {
    const context = await resolveWorkspaceRequestContext(request);
    const payload = await request.json() as Record<string, unknown>;
    if (payload.action === "create") return NextResponse.json(await storeNewCodeCapsule(createInput(payload.capsule), context.root));
    if (payload.action === "validate") {
      return NextResponse.json(
        await validateStoredCodeCapsule(
          stringValue(payload.id, "Capsule id"),
          integerValue(payload.expectedVersion, "expectedVersion"),
          context.root
        )
      );
    }
    if (payload.action === "activate") {
      return NextResponse.json(
        await activateStoredCodeCapsule(
          stringValue(payload.id, "Capsule id"),
          integerValue(payload.expectedVersion, "expectedVersion"),
          stringValue(payload.confirmationToken, "Activation confirmation token"),
          context.root
        )
      );
    }
    if (payload.action === "add-fragment") {
      return NextResponse.json(
        await storeCodeCapsuleFragment(
          stringValue(payload.id, "Capsule id"),
          stringValue(payload.content, "Fragment content"),
          stringValue(payload.note, "Fragment note", true),
          integerValue(payload.expectedVersion, "expectedVersion"),
          context.root
        )
      );
    }
    throw new Error("Capsule action must be create, add-fragment, validate, or activate.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Code capsule request failed." }, { status: 400 });
  }
}
