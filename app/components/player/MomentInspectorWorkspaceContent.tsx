"use client";

import MomentInspectorWorkspaceEmptyState from "./MomentInspectorWorkspaceEmptyState";
import MomentInspectorWorkspaceGroupSection from "./MomentInspectorWorkspaceGroupSection";

type Props = {
  groups?: any[];
};

export default function MomentInspectorWorkspaceContent(props: Props) {
  const groups = props.groups ?? [];

  if (!groups.length) {
    return <MomentInspectorWorkspaceEmptyState />;
  }

  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <MomentInspectorWorkspaceGroupSection
          key={group?.lane ?? index}
          groups={[group]}
        />
      ))}
    </div>
  );
}