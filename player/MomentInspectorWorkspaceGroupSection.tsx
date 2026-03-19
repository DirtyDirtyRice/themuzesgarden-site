"use client";

import MomentInspectorWorkspaceFamilyCard from "./MomentInspectorWorkspaceFamilyCard";

type Props = {
  groups: any[];
};

export default function MomentInspectorWorkspaceGroupSection(props: Props) {
  const groups = props.groups ?? [];

  return (
    <div className="space-y-3">
      {groups.map((group, i) => (
        <div key={group?.lane ?? i}>
          <div className="text-xs font-medium text-zinc-500 mb-2">
            {group?.label ?? group?.lane}
          </div>

          <div className="space-y-2">
            {(group?.items ?? []).map((family: any) => (
              <MomentInspectorWorkspaceFamilyCard
                key={family?.familyId}
                family={family}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}