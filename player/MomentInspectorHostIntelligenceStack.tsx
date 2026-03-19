"use client";

import MomentInspectorBookmarksBar from "./MomentInspectorBookmarksBar";
import MomentInspectorCompareBar from "./MomentInspectorCompareBar";
import MomentInspectorComparePanel from "./MomentInspectorComparePanel";
import MomentInspectorHostFilterBar from "./MomentInspectorHostFilterBar";
import MomentInspectorHostWorkspaceStack from "./MomentInspectorHostWorkspaceStack";
import MomentInspectorIntelligencePanel from "./MomentInspectorIntelligencePanel";
import MomentInspectorPinnedBar from "./MomentInspectorPinnedBar";
import MomentInspectorSelectedFamilyPinBar from "./MomentInspectorSelectedFamilyPinBar";

export default function MomentInspectorHostIntelligenceStack(props: any) {
  return (
    <>
      <MomentInspectorHostFilterBar {...props.filterProps} />
      <MomentInspectorPinnedBar {...props.pinnedProps} />
      <MomentInspectorSelectedFamilyPinBar {...props.pinProps} />
      <MomentInspectorBookmarksBar {...props.bookmarkProps} />
      <MomentInspectorCompareBar {...props.compareBarProps} />
      <MomentInspectorComparePanel {...props.comparePanelProps} />
      <MomentInspectorHostWorkspaceStack {...props.workspaceProps} />
      <MomentInspectorIntelligencePanel {...props.intelligenceProps} />
    </>
  );
}