"use client";

import { formatKind, formatDate } from "./projectDetailsUtils";
import type { Project } from "./projectDetailsTypes";

type Props = {
  project: Project | null;
  rightSlot?: React.ReactNode;
};

export default function ProjectHeader({ project, rightSlot }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold">
          {project?.title ?? "Untitled Project"}
        </div>

        <div className="text-sm text-zinc-500 space-x-2">
          <span>{formatKind(project?.kind ?? "music")}</span>
          {project?.updated_at ? (
            <span>• Updated {formatDate(project.updated_at)}</span>
          ) : null}
        </div>
      </div>

      <div>{rightSlot}</div>
    </div>
  );
}