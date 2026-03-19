"use client";

import MomentInspectorTimelinePanel from "./MomentInspectorTimelinePanel";
import MomentInspectorSelectedFamilyStack from "./MomentInspectorSelectedFamilyStack";
import MomentInspectorFamilySummaryColumns from "./MomentInspectorFamilySummaryColumns";
import MomentInspectorSectionRows from "./MomentInspectorSectionRows";
import type { MomentInspectorHostTimelineStackProps } from "./momentInspectorHostTimelineStack.types";

export default function MomentInspectorHostTimelineStack(
  props: MomentInspectorHostTimelineStackProps
) {
  return (
    <>
      <MomentInspectorTimelinePanel {...props.timelineProps} />
      <MomentInspectorSelectedFamilyStack {...props.selectedProps} />
      <MomentInspectorFamilySummaryColumns {...props.columnsProps} />
      <MomentInspectorSectionRows {...props.sectionsProps} />
    </>
  );
}