"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePathname(pathname: string | null): string {
  if (typeof pathname !== "string") return "";

  const noHash = pathname.split("#")[0] ?? "";
  const noQuery = noHash.split("?")[0] ?? "";
  const trimmed = noQuery.trim();

  if (!trimmed) return "";

  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

function firstParamValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export function useProjectContext() {
  const pathname = usePathname();
  const params = useParams();

  const normalizedPathname = useMemo(() => {
    return normalizePathname(pathname);
  }, [pathname]);

  const projectId = useMemo(() => {
    const raw = firstParamValue((params as Record<string, unknown> | null)?.id);
    return safeDecode(String(raw ?? "").trim());
  }, [params]);

  const onProjectPage = useMemo(() => {
    if (!projectId) return false;
    return normalizedPathname.includes("/projects/");
  }, [normalizedPathname, projectId]);

  return {
    pathname: normalizedPathname,
    projectId,
    onProjectPage,
  };
}