"use client";

import { useCallback, useState } from "react";
import type { Project } from "./projectDetailsTypes";
import { looksLikeUuid } from "./projectDetailsUtils";

type Args = {
  projectId: string;
  supabase: any;
};

export function useProjectOverview({ projectId, supabase }: Args) {
  const [project, setProject] = useState<Project | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState<string | null>(null);

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

      setProject(data as Project);
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
  };
}