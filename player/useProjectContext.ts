"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalize(path: string) {
  if (!path) return "";
  let p = path.split("#")[0] ?? "";
  p = p.split("?")[0] ?? "";
  p = p.trim();
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function useProjectContext() {
  const nextPathname = usePathname();

  const [resolvedPath, setResolvedPath] = useState("");

  // ✅ FIX: resolve from BOTH sources
  useEffect(() => {
    const fromNext = normalize(nextPathname ?? "");
    const fromWindow =
      typeof window !== "undefined"
        ? normalize(window.location.pathname)
        : "";

    // prefer window if mismatch (Vercel hydration fix)
    const finalPath =
      fromWindow && fromWindow !== fromNext ? fromWindow : fromNext;

    setResolvedPath(finalPath);
  }, [nextPathname]);

  const parts = useMemo(() => {
    return resolvedPath.split("/").filter(Boolean);
  }, [resolvedPath]);

  const projectId = useMemo(() => {
    const idx = parts.indexOf("projects");
    if (idx < 0) return "";
    return safeDecode(String(parts[idx + 1] ?? "").trim());
  }, [parts]);

  const onProjectPage = useMemo(() => {
    return parts.includes("projects") && projectId.length > 0;
  }, [parts, projectId]);

  return {
    pathname: resolvedPath,
    projectId,
    onProjectPage,
  };
}