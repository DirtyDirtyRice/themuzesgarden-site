"use client";

import { useCallback, useState } from "react";
import type { Project } from "./projectDetailsTypes";
import { looksLikeUuid } from "./projectDetailsUtils";

type Args = {
  projectId: string;
  supabase: any;
};

function cleanSetlistOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeProject(row: any): Project {
  return {
    ...(row ?? {}),
    id: String(row?.id ?? ""),
    owner_id: String(row?.owner_id ?? ""),
    title: String(row?.title ?? "Untitled Project"),
    description: row?.description ?? null,
    kind: row?.kind ?? "music",
    visibility: row?.visibility ?? "private",
    created_at: String(row?.created_at ?? ""),
    updated_at: String(row?.updated_at ?? ""),
    setlist_order: cleanSetlistOrder(row?.setlist_order),
  };
}

export function useProjectOverview({ projectId, supabase }: Args) {
  const [project, setProject] = useState<Project | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState<string | null>(null);

  const saveProjectDescription = useCallback(async (description: string) => {
    setOverviewErr(null);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(projectId)) throw new Error("Invalid project id");

      const cleanDescription = String(description ?? "").trim();

      const { error } = await supabase
        .from("projects")
        .update({ description: cleanDescription || null })
        .eq("id", projectId);

      if (error) throw new Error(error.message);

      setProject((current) =>
        current
          ? {
              ...current,
              description: cleanDescription || null,
              updated_at: new Date().toISOString(),
            }
          : current
      );

      return true;
    } catch (e: any) {
      const message = e?.message ?? "Failed to save project contents";
      setOverviewErr(message);
      console.error("[Project contents save failed]", e);
      return false;
    }
  }, [projectId, supabase]);

  const loadProject = useCallback(async () => {
    setOverviewErr(null);
    setOverviewLoading(true);

    try {
      if (!supabase) throw new Error("Supabase client not found.");
      if (!looksLikeUuid(projectId)) throw new Error("Invalid project id");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw new Error(error.message);

      setProject(normalizeProject(data));
    } catch (e: any) {
      setOverviewErr(e?.message ?? "Failed to load project");
      setProject(null);
    } finally {
      setOverviewLoading(false);
    }
  }, [projectId, supabase]);

  return {
    project,
    setProject,
    overviewLoading,
    overviewErr,
    loadProject,
    saveProjectDescription,
  };
}
