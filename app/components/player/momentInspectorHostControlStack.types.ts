"use client";

import MomentInspectorTrackControls from "./MomentInspectorTrackControls";
import type { MomentInspectorHostControlStackProps } from "./momentInspectorHostControlStack.types";

export default function MomentInspectorHostControlStack(
  props: MomentInspectorHostControlStackProps
) {
  return <MomentInspectorTrackControls {...props} />;
}