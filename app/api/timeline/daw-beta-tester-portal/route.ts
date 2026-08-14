import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTimelineDawBetaCertificationChecksum, evaluateTimelineDawBetaReadiness } from "@/lib/timeline/TimelineDawBetaReadinessCertificationPolicy";
import { createTimelineDawWorkspaceServer } from "@/lib/timeline/TimelineDawWorkspaceServer";

export const runtime = "nodejs", dynamic = "force-dynamic";
const env = (name: string) => { const value = process.env[name]?.trim(); if (!value) throw Error(`${name} is not configured.`); return value; };
async function auth(request: NextRequest) { const header = request.headers.get("authorization") ?? ""; if (!header.toLowerCase().startsWith("bearer ")) throw Error("Authentication is required."); const token = header.slice(7).trim(), client = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } }), { data, error } = await client.auth.getUser(token); if (error || !data.user) throw Error("Supabase session is invalid or expired."); return { id: data.user.id, token, client }; }
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : "Beta portal request failed." }, { status: 400 });

export async function GET(request: NextRequest) { try { const user = await auth(request), { data, error } = await user.client.rpc("get_timeline_daw_beta_tester_portal"); if (error) throw Error(error.message); return NextResponse.json({ sessions: data ?? [] }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return fail(error); } }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>, sessionId = String(body.sessionId ?? "").trim(), enrollmentId = String(body.enrollmentId ?? "").trim(), user = await auth(request);
    if (!await createTimelineDawWorkspaceServer(user.id, user.token).get(user.id, sessionId)) throw Error("Only the verified session owner can certify beta readiness.");
    const [enrollmentResult, releaseResult, accessResult, auditionResult, workflowResult, feedbackResult, operationResult] = await Promise.all([
      user.client.from("timeline_daw_beta_enrollments").select("id,tester_id,state,acknowledged_at,environment_checked_at,environment").eq("id", enrollmentId).eq("owner_id", user.id).eq("session_id", sessionId).single(),
      user.client.from("timeline_daw_beta_release_receipts").select("id").eq("owner_id", user.id).eq("session_id", sessionId).eq("enrollment_id", enrollmentId).eq("ready", true).limit(1),
      user.client.from("timeline_daw_session_access_receipts").select("id").eq("owner_id", user.id).eq("session_id", sessionId).eq("enrollment_id", enrollmentId).eq("allowed", true).eq("capability", "session:read").limit(1),
      user.client.from("timeline_daw_beta_audition_sources").select("id").eq("owner_id", user.id).eq("session_id", sessionId).eq("state", "active").limit(1),
      user.client.from("timeline_daw_beta_workflow_receipts").select("evaluation").eq("owner_id", user.id).eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(1).maybeSingle(),
      user.client.from("timeline_daw_session_access_receipts").select("id").eq("owner_id", user.id).eq("session_id", sessionId).eq("enrollment_id", enrollmentId).eq("allowed", true).in("capability", ["feedback:create", "feedback:respond"]).limit(1),
      user.client.from("timeline_daw_beta_tester_operations").select("after_state").eq("owner_id", user.id).eq("session_id", sessionId).eq("enrollment_id", enrollmentId).order("observed_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const failure = [enrollmentResult, releaseResult, accessResult, auditionResult, workflowResult, feedbackResult, operationResult].find(result => result.error)?.error; if (failure) throw Error(failure.message);
    const enrollment = enrollmentResult.data; if (!enrollment) throw Error("Tester enrollment was not found.");
    const environment = enrollment.environment as Record<string, unknown> | null, environmentReady = Boolean(enrollment.environment_checked_at) && ["secureContext", "supportedBrowser", "audioInput", "audioOutput", "localStorage", "fileApi", "supportedAudioTypes"].every(key => environment?.[key] === true), latestOperation = operationResult.data?.after_state as string | undefined;
    const evidence = { enrollment: enrollment.state === "active" && Boolean(enrollment.acknowledged_at) && environmentReady, release: Boolean(releaseResult.data?.length), authorization: Boolean(accessResult.data?.length), audition: Boolean(auditionResult.data?.length), workflow: (workflowResult.data?.evaluation as Record<string, unknown> | undefined)?.complete === true, feedback: Boolean(feedbackResult.data?.length), operations: enrollment.state === "active" && (!latestOperation || latestOperation === "active") };
    const evaluation = evaluateTimelineDawBetaReadiness(evidence), observedAt = new Date().toISOString(), receipt = { schema: "the-muzes-garden/daw-beta-readiness-certification/v1", ownerId: user.id, testerId: enrollment.tester_id, sessionId, enrollmentId, evidence, evaluation, observedAt }, checksum = createTimelineDawBetaCertificationChecksum(receipt);
    const { error } = await user.client.from("timeline_daw_beta_readiness_certifications").insert({ id: `timeline-daw-beta-certification-${crypto.randomUUID()}`, owner_id: user.id, tester_id: enrollment.tester_id, session_id: sessionId, enrollment_id: enrollmentId, ready: evaluation.ready, checks: evaluation.checks, blockers: evaluation.blockers, receipt_checksum: checksum, observed_at: observedAt }); if (error) throw Error(error.message);
    return NextResponse.json({ ...receipt, receiptChecksum: checksum }, { status: 201 });
  } catch (error) { return fail(error); }
}
