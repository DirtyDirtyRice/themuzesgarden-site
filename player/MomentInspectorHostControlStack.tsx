"use client";

import MomentInspectorTrackControls from "./MomentInspectorTrackControls";

type MomentInspectorHostControlStackProps = Record<string, any>;

export default function MomentInspectorHostControlStack(
  props: MomentInspectorHostControlStackProps
) {
  return <MomentInspectorTrackControls {...(props as any)} />;
}
