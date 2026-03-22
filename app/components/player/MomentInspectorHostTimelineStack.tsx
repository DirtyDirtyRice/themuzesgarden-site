"use client";

import MomentInspectorTimelinePanel from "./MomentInspectorTimelinePanel";
import MomentInspectorSelectedFamilyStack from "./MomentInspectorSelectedFamilyStack";
import MomentInspectorFamilySummaryColumns from "./MomentInspectorFamilySummaryColumns";
import MomentInspectorSectionRows from "./MomentInspectorSectionRows";
import type { MomentInspectorHostTimelineStackProps } from "./momentInspectorHostTimelineStack.types";

export default function MomentInspectorHostTimelineStack(
  props: MomentInspectorHostTimelineStackProps
) {
  const TimelinePanelAny = MomentInspectorTimelinePanel as any;
  const SelectedFamilyStackAny = MomentInspectorSelectedFamilyStack as any;
  const FamilySummaryColumnsAny = MomentInspectorFamilySummaryColumns as any;
  const SectionRowsAny = MomentInspectorSectionRows as any;

  return (
    <>
      <TimelinePanelAny {...(props.timelineProps ?? {})} />
      <SelectedFamilyStackAny {...(props.selectedProps ?? {})} />
      <FamilySummaryColumnsAny {...(props.columnsProps ?? {})} />
      <SectionRowsAny {...(props.sectionsProps ?? {})} />
    </>
  );
}
