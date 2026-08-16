import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { selectTimelineDawBetaEnrollmentToResume, timelineDawBetaEnrollmentProgress } from "@/lib/timeline/TimelineDawBetaEnrollmentResume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const env = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    if (!header.toLowerCase().startsWith("bearer ")) throw new Error("Authentication is required.");
    const token = header.slice(7).trim();
    const client = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) throw new Error("Supabase session is invalid or expired.");
    const { data, error } = await client.from("timeline_daw_beta_enrollments")
      .select("id,session_id,project_id,state,acknowledgement_version,environment,created_at")
      .eq("tester_id", authData.user.id).eq("state", "active").order("created_at", { ascending: false }).limit(12);
    if (error) throw new Error(error.message);
    const enrollment = selectTimelineDawBetaEnrollmentToResume(data ?? []);
    return NextResponse.json({ enrollment: enrollment ? {
      enrollmentId: enrollment.id, sessionId: enrollment.session_id, projectId: enrollment.project_id,
      state: enrollment.state, ...timelineDawBetaEnrollmentProgress(enrollment), environment: enrollment.environment,
    } : null }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Enrollment could not be resumed." }, { status: 400 });
  }
}
