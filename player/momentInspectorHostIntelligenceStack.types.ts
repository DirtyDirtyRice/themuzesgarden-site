import type { ComponentProps } from "react";
import MomentInspectorHostFilterBar from "./MomentInspectorHostFilterBar";
import MomentInspectorPinnedBar from "./MomentInspectorPinnedBar";
import MomentInspectorSelectedFamilyPinBar from "./MomentInspectorSelectedFamilyPinBar";
import MomentInspectorBookmarksBar from "./MomentInspectorBookmarksBar";
import MomentInspectorCompareBar from "./MomentInspectorCompareBar";
import MomentInspectorComparePanel from "./MomentInspectorComparePanel";
import MomentInspectorIntelligencePanel from "./MomentInspectorIntelligencePanel";

type MomentInspectorHostIntelligenceStackProps = {
  filterProps: ComponentProps<typeof MomentInspectorHostFilterBar>;
  pinnedProps: ComponentProps<typeof MomentInspectorPinnedBar>;
  pinProps: ComponentProps<typeof MomentInspectorSelectedFamilyPinBar>;
  bookmarkProps: ComponentProps<typeof MomentInspectorBookmarksBar>;
  compareBarProps: ComponentProps<typeof MomentInspectorCompareBar>;
  comparePanelProps: ComponentProps<typeof MomentInspectorComparePanel>;
  intelligenceProps: ComponentProps<typeof MomentInspectorIntelligencePanel>;
};

export default MomentInspectorHostIntelligenceStackProps;