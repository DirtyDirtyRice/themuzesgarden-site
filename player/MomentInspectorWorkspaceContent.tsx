"use client";

import MomentInspectorWorkspaceEmptyState from "./MomentInspectorWorkspaceEmptyState";
import MomentInspectorWorkspaceGroupSection from "./MomentInspectorWorkspaceGroupSection";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

type Props = {
  groups?: any[];
  lane?: MomentInspectorWorkspaceLane;
  searchQuery?: string;
  derivedView?: unknown;
  selectedFamilyIds?: string[];
  onToggleSelected?: (familyId: string) => void;
};

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getGroupsFromDerivedView(derivedView: unknown): any[] {
  const record = getObject(derivedView);
  if (!record) return [];

  if (Array.isArray(record.groups)) {
    return record.groups;
  }

  if (Array.isArray(record.groupSections)) {
    return record.groupSections;
  }

  if (Array.isArray(record.lanes)) {
    return record.lanes;
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  return [];
}

export default function MomentInspectorWorkspaceContent(props: Props) {
  const groups =
    props.groups ?? getGroupsFromDerivedView(props.derivedView);

  if (!groups.length) {
    return <MomentInspectorWorkspaceEmptyState />;
  }

  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <MomentInspectorWorkspaceGroupSection
          key={String(group?.lane ?? group?.id ?? index)}
          groups={[group]}
        />
      ))}
    </div>
  );
}