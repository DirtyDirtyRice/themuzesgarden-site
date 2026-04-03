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

function getProjectIdFromPath(pathname: string): string {
  if (!pathname) return "";

  const parts = pathname.split("/").filter(Boolean);
  const projectsIndex = parts.indexOf("projects");

  if (projectsIndex === -1) return "";

  const nextPart = parts[projectsIndex + 1] ?? "";
  return safeDecode(String(nextPart).trim());
}

function isProjectPath(pathname: string): boolean {
  if (!pathname) return false;

  const parts = pathname.split("/").filter(Boolean);
  const workspaceIndex = parts.indexOf("workspace");
  const projectsIndex = parts.indexOf("projects");

  if (projectsIndex === -1) return false;
  if (workspaceIndex !== -1 && projectsIndex !== workspaceIndex + 1) {
    return false;
  }

  return Boolean(parts[projectsIndex + 1]);
}

export function useProjectContext() {
  const pathname = usePathname();
  const params = useParams();

  const normalizedPathname = useMemo(() => {
    return normalizePathname(pathname);
  }, [pathname]);

  const routeProjectId = useMemo(() => {
    return getProjectIdFromPath(normalizedPathname);
  }, [normalizedPathname]);

  const paramProjectId = useMemo(() => {
    const raw = firstParamValue((params as Record<string, unknown> | null)?.id);
    return safeDecode(String(raw ?? "").trim());
  }, [params]);

  const projectId = useMemo(() => {
    if (paramProjectId) return paramProjectId;
    if (routeProjectId) return routeProjectId;
    return "";
  }, [paramProjectId, routeProjectId]);

  const onProjectPage = useMemo(() => {
    if (isProjectPath(normalizedPathname)) return true;
    if (routeProjectId) return true;
    if (paramProjectId) return true;
    return false;
  }, [normalizedPathname, routeProjectId, paramProjectId]);

  return {
    pathname: normalizedPathname,
    projectId,
    onProjectPage,
  };
}