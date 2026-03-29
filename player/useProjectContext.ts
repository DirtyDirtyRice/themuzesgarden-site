"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export function useProjectContext() {
  const pathname = usePathname();

  const projectId = useMemo(() => {
    if (typeof pathname !== "string") return "";
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("projects");
    const id = idx >= 0 ? parts[idx + 1] ?? "" : "";
    return String(id);
  }, [pathname]);

  // ✅ RELAXED + RELIABLE CHECK
  const onProjectPage =
    typeof pathname === "string" &&
    pathname.startsWith("/workspace/projects/") &&
    projectId.length > 0;

  return { pathname, projectId, onProjectPage };
}