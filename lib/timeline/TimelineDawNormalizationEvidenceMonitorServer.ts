import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { timelineDawNormalizationEvidenceCoverage, createTimelineDawNormalizationCoveragePlan, type CoverageSubject } from "./TimelineDawNormalizationSupportCoveragePolicy";
import { verifyTimelineDawNormalizationEvidenceChain, type EvidenceLink } from "./TimelineDawNormalizationSupportEvidenceSealPolicy";
import { classifyTimelineDawNormalizationEvidenceIssue, createTimelineDawNormalizationMonitoringCheckpoint } from "./TimelineDawNormalizationEvidenceMonitorPolicy";

export async function collectTimelineDawNormalizationEvidenceMonitoring(client: SupabaseClient, ownerId: string, sessionId: string) {
  const [{ data: exports }, { data: revocations }, { data: chain }, { data: repairs }] = await Promise.all([
    client.from("timeline_daw_normalization_support_audit_exports").select("id,checksum,created_at").eq("owner_id", ownerId).eq("session_id", sessionId),
    client.from("timeline_daw_normalization_support_audit_revocations").select("id,export_id,created_at").eq("owner_id", ownerId).eq("session_id", sessionId),
    client.from("timeline_daw_normalization_support_audit_chain").select("*").eq("owner_id", ownerId).eq("session_id", sessionId).order("created_at"),
    client.from("timeline_daw_normalization_support_audit_repairs").select("*").eq("owner_id", ownerId).eq("session_id", sessionId),
  ]);
  const subjects: CoverageSubject[] = [...(exports ?? []).map((x: any) => ({ type: "export" as const, id: x.id, checksum: x.checksum, createdAt: x.created_at })), ...(revocations ?? []).map((x: any) => ({ type: "revocation" as const, id: x.id, checksum: `revocation:${x.export_id}`, createdAt: x.created_at }))];
  const repairMap = new Map((repairs ?? []).map((x: any) => [x.id, x]));
  const links: EvidenceLink[] = (chain ?? []).map((x: any) => { const repair: any = repairMap.get(x.subject_id); const event = x.event_type === "repair" ? { type: "repair", id: x.subject_id, baseChecksum: repair?.base_checksum, planChecksum: repair?.plan_checksum, actions: repair?.actions } : { type: x.event_type, checksum: x.event_checksum }; return { id: x.id, previousHash: x.previous_hash, chainHash: x.chain_hash, eventChecksum: x.event_checksum, event, createdAt: x.created_at }; });
  const coverage = timelineDawNormalizationEvidenceCoverage(subjects, (chain ?? []).map((x: any) => ({ eventType: x.event_type, subjectId: x.subject_id })));
  const verification = verifyTimelineDawNormalizationEvidenceChain(links);
  const issue = classifyTimelineDawNormalizationEvidenceIssue({ complete: coverage.complete, valid: verification.valid, reason: verification.reason });
  const headHash = links.at(-1)?.chainHash ?? null;
  const coveragePlan = createTimelineDawNormalizationCoveragePlan({ headHash, subjects: coverage.unchained });
  const checkpoint = createTimelineDawNormalizationMonitoringCheckpoint({ sessionId, headHash, linkCount: links.length, coverage, verification, issue, observedAt: new Date().toISOString() });
  return { subjects, links, coverage, verification, issue, headHash, coveragePlan, checkpoint };
}

export async function persistTimelineDawNormalizationEvidenceMonitoring(client: SupabaseClient, ownerId: string, sessionId: string) {
  const state = await collectTimelineDawNormalizationEvidenceMonitoring(client, ownerId, sessionId), checkpointId = `timeline-daw-normalization-evidence-checkpoint-${crypto.randomUUID()}`;
  const { data: existing } = await client.from("timeline_daw_normalization_evidence_checkpoints").select("id").eq("owner_id", ownerId).eq("session_id", sessionId).eq("checkpoint_checksum", state.checkpoint.checksum).maybeSingle();
  const id = existing?.id ?? checkpointId;
  if (!existing) { const { error } = await client.from("timeline_daw_normalization_evidence_checkpoints").insert({ id, owner_id: ownerId, session_id: sessionId, head_hash: state.headHash, link_count: state.links.length, coverage: state.coverage, verification: state.verification, issue: state.issue, checkpoint_checksum: state.checkpoint.checksum, observed_at: state.checkpoint.observedAt }); if (error) throw new Error(error.message); }
  if (state.issue !== "healthy") { const { data: incident } = await client.from("timeline_daw_normalization_evidence_incidents").select("id").eq("owner_id", ownerId).eq("session_id", sessionId).eq("issue", state.issue).in("state", ["open", "acknowledged", "manual-review"]).maybeSingle(); if (!incident) await client.from("timeline_daw_normalization_evidence_incidents").insert({ id: `timeline-daw-normalization-evidence-incident-${crypto.randomUUID()}`, owner_id: ownerId, session_id: sessionId, checkpoint_id: id, issue: state.issue, state: state.issue === "coverage-gap" ? "open" : "manual-review", message: state.issue === "coverage-gap" ? `${state.coverage.unchained.length} audit subject(s) are not chained.` : `Immutable evidence integrity failure: ${state.verification.reason}`, updated_at: new Date().toISOString() }); }
  if (state.issue === "healthy") await client.from("timeline_daw_normalization_evidence_incidents").update({ state: "recovered", recovered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("owner_id", ownerId).eq("session_id", sessionId).in("state", ["open", "acknowledged"]);
  return { ...state, checkpointId: id };
}
