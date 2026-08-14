import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawBetaCandidateChecksum, deriveTimelineDawBetaCohortStatus, evaluateTimelineDawBetaCandidate } from "@/lib/timeline/TimelineDawBetaCohortPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const environmentKeys = ["secureContext", "supportedBrowser", "audioInput", "audioOutput", "localStorage", "fileApi", "supportedAudioTypes"];
const configured = (name: string) => { const value = process.env[name]?.trim(); if (!value) throw new Error(`${name} is not configured.`); return value; };

async function authorize(request: NextRequest, sessionId: string) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) throw new Error("Authentication is required.");
  const token = header.slice(7).trim();
  const client = createClient(configured("NEXT_PUBLIC_SUPABASE_URL"), configured("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Supabase session is invalid or expired.");
  const session = await createTimelineDawWorkspaceServer(data.user.id, token).get(data.user.id, sessionId);
  if (!session) throw new Error("Only the verified session owner can view this beta cohort.");
  return { ownerId: data.user.id, client };
}

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "");
const date = (value: unknown) => text(value);

async function loadCohort(owner: Awaited<ReturnType<typeof authorize>>, sessionId: string) {
  const queries = await Promise.all([
    owner.client.from("timeline_daw_beta_invitations").select("id,label,state,expires_at,created_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId),
    owner.client.from("timeline_daw_beta_enrollments").select("id,invitation_id,tester_id,state,acknowledgement_version,environment,created_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId),
    owner.client.from("timeline_daw_beta_release_receipts").select("id,enrollment_id,ready,observed_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId).order("observed_at", { ascending: false }),
    owner.client.from("timeline_daw_session_access_receipts").select("actor_id,enrollment_id,allowed,observed_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId),
    owner.client.from("timeline_daw_beta_feedback").select("id,severity,state,created_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId),
    owner.client.from("timeline_daw_beta_feedback_events").select("feedback_id,actor_id,event,after_state,created_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId).order("created_at", { ascending: true }),
    owner.client.from("timeline_daw_beta_workflow_receipts").select("evaluation,receipt_checksum,observed_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(1).maybeSingle(),
    owner.client.from("timeline_daw_normalization_evidence_incidents").select("id,state").eq("owner_id", owner.ownerId).eq("session_id", sessionId).in("state", ["open", "acknowledged", "manual-review"]),
    owner.client.from("timeline_daw_beta_candidate_receipts").select("id,ready,minimum_completed_testers,evaluation,evidence,receipt_checksum,observed_at").eq("owner_id", owner.ownerId).eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(10),
  ]);
  const failure = queries.find((query) => query.error)?.error;
  if (failure) throw new Error(failure.message);
  const invitations = (queries[0].data ?? []) as Row[];
  const enrollments = ((queries[1].data ?? []) as Row[]).filter((row) => row.state !== "revoked");
  const releases = (queries[2].data ?? []) as Row[];
  const accesses = (queries[3].data ?? []) as Row[];
  const feedback = (queries[4].data ?? []) as Row[];
  const events = (queries[5].data ?? []) as Row[];
  const workflowRow = queries[6].data as Row | null;
  const workflow = (workflowRow?.evaluation ?? { percent: 0, complete: false, exportReady: false, blockers: [] }) as Row;
  const integrityBlockers = (queries[7].data ?? []).length;

  const feedbackOwners = new Map<string, string>();
  for (const event of events) if (event.event === "created") feedbackOwners.set(text(event.feedback_id), text(event.actor_id));
  const testers = enrollments.map((enrollment) => {
    const testerId = text(enrollment.tester_id);
    const enrollmentId = text(enrollment.id);
    const ownedFeedback = feedback.filter((item) => feedbackOwners.get(text(item.id)) === testerId);
    const ownedIds = new Set(ownedFeedback.map((item) => text(item.id)));
    const ownedEvents = events.filter((event) => ownedIds.has(text(event.feedback_id)));
    const replyNeeded = ownedFeedback.filter((item) => {
      if (item.state === "resolved") return false;
      const responses = ownedEvents.filter((event) => event.feedback_id === item.id && event.event === "responded");
      const latest = responses.at(-1);
      return Boolean(latest && text(latest.actor_id) === testerId);
    }).length;
    const reopenEvents = ownedEvents.filter((event) => event.event === "state-changed" && event.after_state === "reopened");
    const completedTestAgain = reopenEvents.filter((reopen) => ownedEvents.some((event) => event.feedback_id === reopen.feedback_id && event.event === "state-changed" && event.after_state === "resolved" && date(event.created_at) > date(reopen.created_at))).length;
    const environment = (enrollment.environment ?? {}) as Row;
    const released = releases.some((receipt) => receipt.enrollment_id === enrollment.id && receipt.ready === true);
    const evidence = {
      enrollmentState: text(enrollment.state),
      acknowledged: Boolean(enrollment.acknowledgement_version),
      environmentReady: environmentKeys.every((key) => environment[key] === true),
      released,
      allowedAccessCount: accesses.filter((receipt) => receipt.enrollment_id === enrollment.id && receipt.allowed === true).length,
      reportCount: ownedFeedback.length,
      unresolvedMajorOrBlocking: ownedFeedback.filter((item) => item.state !== "resolved" && (item.severity === "major" || item.severity === "blocking")).length,
      replyNeededCount: replyNeeded,
      testAgainCount: reopenEvents.length,
      completedTestAgainCount: completedTestAgain,
      workflowComplete: workflow.complete === true,
      exportReady: workflow.exportReady === true,
    };
    return { enrollmentId, testerId, invitationId: text(enrollment.invitation_id), createdAt: date(enrollment.created_at), status: deriveTimelineDawBetaCohortStatus(evidence), ...evidence };
  });
  const activeInvitationCount = invitations.filter((invitation) => invitation.state === "active" && !enrollments.some((enrollment) => enrollment.invitation_id === invitation.id)).length;
  const statuses = { invited: activeInvitationCount, enrolled: 0, released: 0, "actively-testing": 0, blocked: 0, completed: 0 };
  for (const tester of testers) statuses[tester.status] += 1;
  const unresolvedMajorOrBlocking = feedback.filter((item) => item.state !== "resolved" && (item.severity === "major" || item.severity === "blocking")).length;
  return {
    invitations,
    testers,
    statuses,
    workflow: { percent: Number(workflow.percent ?? 0), complete: workflow.complete === true, exportReady: workflow.exportReady === true, blockers: Array.isArray(workflow.blockers) ? workflow.blockers : [], receiptChecksum: workflowRow?.receipt_checksum ?? null },
    unresolvedMajorOrBlocking,
    integrityBlockers,
    candidateReceipts: queries[8].data ?? [],
  };
}

const failure = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : "Beta cohort request failed." }, { status: 400 });

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "";
    const owner = await authorize(request, sessionId);
    return NextResponse.json(await loadCohort(owner, sessionId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action !== "evaluate") throw new Error("Beta cohort action is invalid.");
    const sessionId = text(body.sessionId).trim();
    const minimumCompletedTesters = Number(body.minimumCompletedTesters);
    const owner = await authorize(request, sessionId);
    const cohort = await loadCohort(owner, sessionId);
    const evaluation = evaluateTimelineDawBetaCandidate({ minimumCompletedTesters, completedTesterCount: cohort.statuses.completed, unresolvedMajorOrBlocking: cohort.unresolvedMajorOrBlocking, integrityBlockers: cohort.integrityBlockers, workflowComplete: cohort.workflow.complete, exportReady: cohort.workflow.exportReady });
    const observedAt = new Date().toISOString();
    const evidence = { statuses: cohort.statuses, testers: cohort.testers, workflow: cohort.workflow, unresolvedMajorOrBlocking: cohort.unresolvedMajorOrBlocking, integrityBlockers: cohort.integrityBlockers };
    const receiptPayload = { sessionId, ownerId: owner.ownerId, evaluation, evidence, observedAt };
    const receiptChecksum = createTimelineDawBetaCandidateChecksum(receiptPayload);
    const { error } = await owner.client.from("timeline_daw_beta_candidate_receipts").insert({ id: `timeline-daw-beta-candidate-${crypto.randomUUID()}`, owner_id: owner.ownerId, session_id: sessionId, ready: evaluation.ready, minimum_completed_testers: minimumCompletedTesters, evaluation, evidence, receipt_checksum: receiptChecksum, observed_at: observedAt });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ...await loadCohort(owner, sessionId), evaluation });
  } catch (error) { return failure(error); }
}
