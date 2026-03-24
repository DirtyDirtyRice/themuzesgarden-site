"use client";

import MomentInspectorHostFilterBar from "./MomentInspectorHostFilterBar";
import MomentInspectorPinnedBar from "./MomentInspectorPinnedBar";
import MomentInspectorSelectedFamilyPinBar from "./MomentInspectorSelectedFamilyPinBar";
import MomentInspectorBookmarksBar from "./MomentInspectorBookmarksBar";
import MomentInspectorCompareBar from "./MomentInspectorCompareBar";
import MomentInspectorComparePanel from "./MomentInspectorComparePanel";
import MomentInspectorIntelligencePanel from "./MomentInspectorIntelligencePanel";
import type MomentInspectorHostIntelligenceStackProps from "./momentInspectorHostIntelligenceStack.types";

export default function MomentInspectorHostIntelligenceStack(
  props: MomentInspectorHostIntelligenceStackProps
) {
  return (
    <>
      <MomentInspectorHostFilterBar {...props.filterProps} />
      <MomentInspectorPinnedBar {...props.pinnedProps} />
      <MomentInspectorSelectedFamilyPinBar {...props.pinProps} />
      <MomentInspectorBookmarksBar {...props.bookmarkProps} />
      <MomentInspectorCompareBar {...props.compareBarProps} />
      <MomentInspectorComparePanel {...props.comparePanelProps} />
      <MomentInspectorIntelligencePanel {...props.intelligenceProps} />
    </>
  );
}