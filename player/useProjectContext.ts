"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

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

export function useProjectContext() {
  const pathname = usePathname();

  const normalizedPathname = useMemo(() => {
    return normalizePathname(pathname);
  }, [pathname]);

  const parts = useMemo(() => {
    return normalizedPathname.split("/").filter(Boolean);
  }, [normalizedPathname]);

  const projectId = useMemo(() => {
    const workspaceIdx = parts.indexOf("workspace");
    const projectsIdx = parts.indexOf("projects");

    if (workspaceIdx !== 0) return "";
    if (projectsIdx !== 1) return "";

    const rawId = parts[2] ?? "";
    return safeDecode(String(rawId).trim());
  }, [parts]);

  const onProjectPage = useMemo(() => {
    return parts[0] === "workspace" && parts[1] === "projects" && projectId.length > 0;
  }, [parts, projectId]);

  return {
    pathname: normalizedPathname,
    projectId,
    onProjectPage,
  };
}