import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import {
  parseTimelineDawSessionCapability,
  verifyTimelineDawSessionAccessDecision,
  type TimelineDawSessionAccessDecision,
} from "./TimelineDawSessionAccessPolicy";
import { createTimelineDawWorkspaceServer } from "./TimelineDawWorkspaceServer";

const environment = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

export type TimelineDawAuthorizedSession = {
  client: SupabaseClient;
  token: string;
  actorId: string;
  ownerId: string;
  decision: TimelineDawSessionAccessDecision;
};

export async function authorizeTimelineDawSessionAccess(
  request: NextRequest,
  sessionId: string,
  capabilityValue: unknown,
  action: string,
): Promise<TimelineDawAuthorizedSession> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) throw new Error("Authentication is required.");
  const token = header.slice(7).trim();
  const client = createClient(environment("NEXT_PUBLIC_SUPABASE_URL"), environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Supabase session is invalid or expired.");
  const capability = parseTimelineDawSessionCapability(capabilityValue);
  const owned = await createTimelineDawWorkspaceServer(data.user.id, token).get(data.user.id, sessionId);
  const { data: raw, error: accessError } = await client.rpc("authorize_timeline_daw_beta_session", {
    p_session_id: sessionId,
    p_capability: capability,
    p_action: action,
    p_owner_id: owned ? data.user.id : null,
  });
  if (accessError) throw new Error(accessError.message);
  const decision = verifyTimelineDawSessionAccessDecision(raw as TimelineDawSessionAccessDecision);
  return { client, token, actorId: data.user.id, ownerId: decision.ownerId, decision };
}
