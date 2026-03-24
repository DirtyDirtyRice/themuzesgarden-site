"use client";

import MomentInspectorTimelinePanel from "./MomentInspectorTimelinePanel";
import type MomentInspectorHostTimelineStackProps from "./momentInspectorHostTimelineStack.types";

export default function MomentInspectorHostTimelineStack(
  props: MomentInspectorHostTimelineStackProps
) {
  return <MomentInspectorTimelinePanel {...props.timelineProps} />;
}