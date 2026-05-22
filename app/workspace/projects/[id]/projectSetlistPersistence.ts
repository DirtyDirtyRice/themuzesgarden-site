"use client";

import type { Dispatch, SetStateAction } from "react";
import { looksLikeUuid } from "./projectDetailsUtils";

export type ProjectSetlistProjectLike = {
  setlist_order?: unknown;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ProjectSetlistSupabaseLike = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: { message?: string } | null }>;
    };
  };
};

export function cleanSetlistOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  );
}

export function getProjectSetlistOrder(project: unknown): string[] {
  const row = project as ProjectSetlistProjectLike | null | undefined;
  return cleanSetlistOrder(row?.setlist_order);
}

export function sameTrackOrder(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

export function applySetlistOrderToProjectState({
  cleanOrder,
  updatedAt,
  setProject,
}: {
  cleanOrder: string[];
  updatedAt: string;
  setProject: Dispatch<SetStateAction<any>>;
}) {
  setProject((currentProject: any) => {
    if (!currentProject) return currentProject;

    return {
      ...currentProject,
      setlist_order: cleanOrder,
      updated_at: updatedAt,
    };
  });
}

export function persistProjectSetlistOrder({
  projectId,
  nextOrder,
  setProject,
  supabase,
}: {
  projectId: string;
  nextOrder: string[];
  setProject: Dispatch<SetStateAction<any>>;
  supabase: ProjectSetlistSupabaseLike;
}) {
  const cleanOrder = cleanSetlistOrder(nextOrder);
  const updatedAt = new Date().toISOString();

  applySetlistOrderToProjectState({
    cleanOrder,
    updatedAt,
    setProject,
  });

  if (!looksLikeUuid(projectId)) return;

  void supabase
    .from("projects")
    .update({
      setlist_order: cleanOrder,
      updated_at: updatedAt,
    })
    .eq("id", projectId)
    .then(({ error }) => {
      if (error) {
        console.warn("Failed to save setlist order:", error.message);
      }
    });
}
