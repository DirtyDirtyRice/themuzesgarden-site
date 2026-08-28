import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawBetaInviteCode, createTimelineDawBetaOnboardingReceipt, evaluateTimelineDawBetaRelease, hashTimelineDawBetaInviteCode, parseTimelineDawBetaEnvironment, TIMELINE_DAW_BETA_ACKNOWLEDGEMENT_VERSION } from "@/lib/timeline/TimelineDawBetaOnboardingPolicy";
import { evaluateTimelineDawMusicianTrialReadiness } from "@/lib/timeline/TimelineDawMusicianTrialReadinessPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs", dynamic = "force-dynamic";
const env = (name: string) => { const value = process.env[name]?.trim(); if (!value) throw Error(`${name} is not configured.`); return value; };
const trialCapabilities = ["session:read", "transport:read", "recording:create", "arrangement:edit", "session:write", "export:create", "feedback:create"];

async function auth(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) throw Error("Authentication is required.");
  const token = header.slice(7).trim(), client = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw Error("Supabase session is invalid or expired.");
  return { id: data.user.id, token, client };
}

async function owner(request: NextRequest, sessionId: string) {
  const user = await auth(request), session = await createTimelineDawWorkspaceServer(user.id, user.token).get(user.id, sessionId);
  if (!session) throw Error("Only the verified session owner can manage this beta.");
  return { ...user, session };
}

async function ownerData(user: Awaited<ReturnType<typeof owner>>, sessionId: string) {
  const [{ data: invitations, error: invitationError }, { data: enrollments, error: enrollmentError }, { data: workflow, error: workflowError }, { data: feedback, error: feedbackError }, { data: incidents, error: incidentError }, { data: receipts, error: receiptError }] = await Promise.all([
    user.client.from("timeline_daw_beta_invitations").select("id,label,state,expires_at,created_at").eq("owner_id", user.id).eq("session_id", sessionId).order("created_at", { ascending: false }),
    user.client.from("timeline_daw_beta_enrollments").select("*").eq("owner_id", user.id).eq("session_id", sessionId).order("created_at", { ascending: false }),
    user.client.from("timeline_daw_beta_workflow_receipts").select("evaluation").eq("owner_id", user.id).eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(1).maybeSingle(),
    user.client.from("timeline_daw_beta_feedback").select("severity,state").eq("owner_id", user.id).eq("session_id", sessionId),
    user.client.from("timeline_daw_normalization_evidence_incidents").select("state").eq("owner_id", user.id).eq("session_id", sessionId).eq("state", "manual-review"),
    user.client.from("timeline_daw_beta_release_receipts").select("*").eq("owner_id", user.id).eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(12),
  ]);
  const error = invitationError || enrollmentError || workflowError || feedbackError || incidentError || receiptError;
  if (error) throw Error(error.message);
  const evaluation = (workflow?.evaluation ?? { percent: 0, complete: false, exportReady: false }) as { percent: number; complete: boolean; exportReady: boolean };
  return { invitations: invitations ?? [], enrollments: enrollments ?? [], workflow: evaluation, feedback: feedback ?? [], integrityBlockers: (incidents ?? []).length, releaseReceipts: receipts ?? [] };
}

const fail = (cause: unknown) => NextResponse.json({ error: cause instanceof Error ? cause.message : "Beta onboarding request failed." }, { status: 400 });

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim() ?? "", user = await owner(request, sessionId);
    return NextResponse.json(await ownerData(user, sessionId), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) { return fail(cause); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(), action = String(body.action ?? "");
    if (action === "redeem") {
      const user = await auth(request), code = String(body.code ?? "").trim();
      if (code.length < 20) throw Error("Invitation code is invalid.");
      const { data, error } = await user.client.rpc("redeem_timeline_daw_beta_invitation", { p_code_hash: hashTimelineDawBetaInviteCode(code) });
      if (error) throw Error(error.message);
      const { data: enrollment } = await user.client.from("timeline_daw_beta_enrollments").select("id,session_id,project_id,state").eq("id", String(data)).eq("tester_id", user.id).single();
      if (!enrollment) throw Error("Enrollment could not be loaded.");
      return NextResponse.json({ enrollmentId: enrollment.id, sessionId: enrollment.session_id, projectId: enrollment.project_id, state: enrollment.state });
    }
    if (action === "acknowledge" || action === "environment") {
      const user = await auth(request), environment = action === "environment" ? parseTimelineDawBetaEnvironment(body.environment) : null;
      const { data, error } = await user.client.rpc("save_timeline_daw_beta_tester_onboarding", { p_enrollment_id: String(body.enrollmentId ?? ""), p_action: action, p_acknowledgement_version: TIMELINE_DAW_BETA_ACKNOWLEDGEMENT_VERSION, p_environment: environment });
      if (error) throw Error(error.message);
      if (!data) throw Error("Active tester enrollment was not found.");
      return NextResponse.json({ updated: true });
    }
    const sessionId = String(body.sessionId ?? "").trim(), user = await owner(request, sessionId);
    if (action === "invite") {
      const label = String(body.label ?? "").trim();
      if (label.length < 2 || label.length > 100) throw Error("Tester label must contain 2-100 characters.");
      const code = createTimelineDawBetaInviteCode();
      const { data, error } = await user.client.from("timeline_daw_beta_invitations").insert({ id: `timeline-daw-beta-invite-${crypto.randomUUID()}`, owner_id: user.id, project_id: user.session.projectId, session_id: sessionId, label, invite_code_hash: hashTimelineDawBetaInviteCode(code), expires_at: null }).select("id,label,state,expires_at,created_at").single();
      if (error) throw Error(error.message);
      return NextResponse.json({ invitation: data, code });
    }
    if (action === "revoke") {
      const invitationId = String(body.invitationId ?? ""), { error } = await user.client.from("timeline_daw_beta_invitations").update({ state: "revoked", updated_at: new Date().toISOString() }).eq("id", invitationId).eq("owner_id", user.id).eq("session_id", sessionId);
      if (error) throw Error(error.message);
      await user.client.from("timeline_daw_beta_enrollments").update({ state: "revoked", updated_at: new Date().toISOString() }).eq("invitation_id", invitationId).eq("owner_id", user.id);
      return NextResponse.json(await ownerData(user, sessionId));
    }
    if (action === "release") {
      const snapshot = await ownerData(user, sessionId), enrollment = snapshot.enrollments.find((item) => item.id === String(body.enrollmentId ?? ""));
      if (!enrollment) throw Error("Beta enrollment was not found.");
      const open = snapshot.feedback.filter((item) => item.state !== "resolved"), isolatedTrial = evaluateTimelineDawMusicianTrialReadiness(trialCapabilities);
      const evaluation = evaluateTimelineDawBetaRelease({ enrolled: enrollment.state === "active", acknowledged: enrollment.acknowledgement_version === TIMELINE_DAW_BETA_ACKNOWLEDGEMENT_VERSION, environment: parseTimelineDawBetaEnvironment(enrollment.environment), workflowPercent: snapshot.workflow.percent, workflowComplete: snapshot.workflow.complete, exportReady: snapshot.workflow.exportReady, isolatedTrialReady: isolatedTrial.ready, blockingFeedback: open.filter((item) => item.severity === "blocking").length, unresolvedFeedback: open.length, integrityBlockers: snapshot.integrityBlockers });
      const observedAt = new Date().toISOString(), receipt = createTimelineDawBetaOnboardingReceipt({ sessionId, enrollmentId: enrollment.id, isolatedTrial, evaluation, observedAt });
      const { error } = await user.client.from("timeline_daw_beta_release_receipts").insert({ id: `timeline-daw-beta-release-${crypto.randomUUID()}`, owner_id: user.id, session_id: sessionId, enrollment_id: enrollment.id, ready: evaluation.ready, evaluation, receipt_checksum: receipt.checksum, observed_at: observedAt });
      if (error) throw Error(error.message);
      return NextResponse.json({ ...await ownerData(user, sessionId), release: evaluation });
    }
    throw Error("Beta onboarding action is invalid.");
  } catch (cause) { return fail(cause); }
}
