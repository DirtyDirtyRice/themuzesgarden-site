"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { looksLikeUuid } from "./playerUtils";

export function useProjectContext() {
  const pathname = usePathname();

  const projectId = useMemo(() => {
    if (typeof pathname !== "string") return "";
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("projects");
    const id = idx >= 0 ? parts[idx + 1] ?? "" : "";
    return String(id);
  }, [pathname]);

  const onProjectPage =
    typeof pathname === "string" &&
    pathname.includes("/workspace/projects/") &&
    looksLikeUuid(projectId);

  return { pathname, projectId, onProjectPage };
}