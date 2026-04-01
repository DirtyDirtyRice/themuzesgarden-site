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
    const idx = parts.indexOf("projects");
    if (idx < 0) return "";
    return safeDecode(String(parts[idx + 1] ?? "").trim());
  }, [parts]);

  const onProjectPage = useMemo(() => {
    return parts.includes("workspace") && parts.includes("projects") && projectId.length > 0;
  }, [parts, projectId]);

  return {
    pathname: normalizedPathname,
    projectId,
    onProjectPage,
  };
}