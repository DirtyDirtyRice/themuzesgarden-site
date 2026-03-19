"use client";

import {
  getMomentInspectorWorkspacePriorityBucket,
  getMomentInspectorWorkspacePriorityBucketLabel,
  getMomentInspectorWorkspacePriorityBucketTone,
} from "./momentInspectorWorkspacePriorityBuckets";
import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspacePriorityChipProps = {
  item: MomentInspectorWorkspaceFamilyItem;
};

export default function MomentInspectorWorkspacePriorityChip(
  props: MomentInspectorWorkspacePriorityChipProps
) {
  const bucket = getMomentInspectorWorkspacePriorityBucket(props.item);
  const label = getMomentInspectorWorkspacePriorityBucketLabel(bucket);
  const tone = getMomentInspectorWorkspacePriorityBucketTone(bucket);

  return (
    <span
      className={[
        "rounded-full border px-2 py-1 text-[11px] font-medium",
        tone,
      ].join(" ")}
    >
      {label}
    </span>
  );
}