import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  bearerToken,
  parseTimelineWorkflowApiPayload,
} from "@/lib/timeline/TimelineWorkflowApiPolicy";
import {
  getTimelineWorkflowServer,
  getTimelineProjectWorkspaceStore,
  TIMELINE_ASSISTANT_TEMPLATE_ID,
} from "@/lib/timeline/TimelineWorkflowServer";
import type { TimelineProjectId, TimelineUserId } from "@/lib/timeline/TimelineTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class TimelineApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

type AuthorizedUser = {
  id: TimelineUserId;
  token: string;
};

function environment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new TimelineApiError(`${name} is not configured.`, 503);
  return value;
}

async function authorizedUser(request: NextRequest): Promise<AuthorizedUser> {
  let token: string;
  try {
    token = bearerToken(request.headers.get("authorization"));
  } catch (error) {
    throw new TimelineApiError(
      error instanceof Error ? error.message : "Authentication is required.",
      401
    );
  }
  const supabaseUrl = environment("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = environment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new TimelineApiError("Supabase session is invalid or expired.", 401);
  }
  return { id: data.user.id, token };
}

async function requireProjectOwner(
  user: AuthorizedUser,
  projectId: TimelineProjectId
): Promise<void> {
  const supabase = createClient(
    environment("NEXT_PUBLIC_SUPABASE_URL"),
    environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${user.token}` } },
    }
  );
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) {
    throw new TimelineApiError("Project ownership could not be verified.", 403);
  }
  if (!data || String(data.owner_id) !== user.id) {
    throw new TimelineApiError(
      "Only the verified project owner can use Timeline AI workflows.",
      403
    );
  }
}

function response(data: unknown, status = 200): NextResponse {
  const result = NextResponse.json(data, { status });
  result.headers.set("Cache-Control", "no-store, max-age=0");
  return result;
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof TimelineApiError) {
    return response({ error: error.message }, error.status);
  }
  const message =
    error instanceof Error ? error.message : "Timeline workflow request failed.";
  const status = message.includes("OPENAI_API_KEY") ? 503 : 400;
  return response({ error: message }, status);
}

async function requireOwnedWorkflow(
  user: AuthorizedUser,
  workflowId: string
) {
  const service = await getTimelineWorkflowServer();
  const workflow = service.getWorkflow(workflowId);
  if (!workflow) throw new TimelineApiError("Timeline workflow was not found.", 404);
  await requireProjectOwner(user, workflow.projectId);
  return { service, workflow };
}

export async function GET(request: NextRequest) {
  try {
    const user = await authorizedUser(request);
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    if (!projectId) {
      throw new TimelineApiError("A projectId query parameter is required.", 400);
    }
    await requireProjectOwner(user, projectId);
    const workspaceRecord = await getTimelineProjectWorkspaceStore().ensure(
      projectId,
      user.id
    );
    const service = await getTimelineWorkflowServer();
    const workflows = service.listWorkflows(projectId);
    const records = service.ledger.getProjectHistory(projectId).map((record) => ({
      id: record.id,
      sequence: record.sequence,
      workflowId: record.workflowId,
      status: record.workflow.status,
      recordedAt: record.recordedAt,
      recordedBy: record.recordedBy,
      usage: record.usage,
      cost: record.cost,
      proposalCount: record.proposals.length,
      actionCount: record.actionPlan?.changes.length ?? 0,
      receiptId: record.receipt?.id ?? null,
      hash: record.hash,
    }));
    return response({
      projectId,
      workflows,
      records,
      workspace: workspaceRecord,
      ledger: service.ledger.snapshot(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorizedUser(request);
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new TimelineApiError("Request body must contain valid JSON.", 400);
    }
    const payload = parseTimelineWorkflowApiPayload(raw);
    if (payload.action === "start") {
      await requireProjectOwner(user, payload.projectId!);
      const workspaceRecord = await getTimelineProjectWorkspaceStore().ensure(
        payload.projectId!,
        user.id
      );
      const workspace = workspaceRecord.workspace;
      const service = await getTimelineWorkflowServer();
      const started = await service.start({
        templateId: TIMELINE_ASSISTANT_TEMPLATE_ID,
        workspace,
        variables: { instruction: payload.instruction! },
        context: {
          eventIds: payload.eventIds,
          trackIds: payload.trackIds,
          includeRelationships: true,
          includeMetadata: true,
          includeLyrics: true,
          maxEvents: 200,
        },
        model:
          process.env.OPENAI_TIMELINE_MODEL?.trim() ||
          process.env.OPENAI_DEVELOPER_WORKSPACE_MODEL?.trim() ||
          "gpt-5.6",
        responseFormat: "json",
        createdBy: user.id,
      });
      return response(started, 201);
    }

    const { service } = await requireOwnedWorkflow(user, payload.workflowId!);
    switch (payload.action) {
      case "execute":
        return response(await service.execute(payload.workflowId!));
      case "approve":
        return response(await service.approve(payload.workflowId!, user.id));
      case "reject":
        return response(
          await service.reject(payload.workflowId!, user.id, payload.reason!)
        );
      case "apply": {
        const workflow = service.getWorkflow(payload.workflowId!)!;
        const store = getTimelineProjectWorkspaceStore();
        const current = await store.ensure(workflow.projectId, user.id);
        const applied = await service.apply(
          payload.workflowId!,
          current.workspace,
          user.id
        );
        const workspaceRecord = await store.save({
          workspace: applied.result.workspace,
          expectedRevision: current.revision,
          updatedBy: user.id,
        });
        return response({ ...applied, workspaceRecord });
      }
      case "revert": {
        const workflow = service.getWorkflow(payload.workflowId!)!;
        const receipt = workflow.receiptId
          ? service.orchestration.actionEngine.getReceipt(workflow.receiptId)
          : null;
        if (!receipt) throw new TimelineApiError("Applied receipt was not found.", 409);
        const store = getTimelineProjectWorkspaceStore();
        const current = await store.ensure(workflow.projectId, user.id);
        if (JSON.stringify(current.workspace) !== JSON.stringify(receipt.afterWorkspace)) {
          throw new TimelineApiError(
            "Timeline changed after application. Revert was refused to protect newer work.",
            409
          );
        }
        const reverted = await service.revert(payload.workflowId!, user.id);
        const workspaceRecord = await store.save({
          workspace: reverted.result.workspace,
          expectedRevision: current.revision,
          updatedBy: user.id,
        });
        return response({ ...reverted, workspaceRecord });
      }
      case "cancel":
        return response(await service.cancel(payload.workflowId!, user.id));
      default:
        throw new TimelineApiError("Timeline workflow action is invalid.", 400);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
