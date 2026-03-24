import type { ComponentProps } from "react";
import MomentInspectorTimelinePanel from "./MomentInspectorTimelinePanel";

type MomentInspectorHostTimelineStackProps = {
  timelineProps: ComponentProps<typeof MomentInspectorTimelinePanel>;
};

export default MomentInspectorHostTimelineStackProps;
export type { MomentInspectorHostTimelineStackProps };