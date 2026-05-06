"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export async function deleteRecordAction(recordId: string) {
  const safeRecordId = String(recordId ?? "").trim();

  if (!safeRecordId) {
    throw new Error("Missing metadata record id.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase
    .from("metadata_records")
    .delete()
    .eq("id", safeRecordId);

  if (error) {
    throw new Error(error.message || "Failed to delete metadata record.");
  }

  revalidatePath("/metadata");
  revalidatePath(`/metadata/${safeRecordId}`);
  redirect("/metadata");
}