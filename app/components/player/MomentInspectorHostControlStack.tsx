"use client";

import type { ComponentProps } from "react";
import MomentInspectorTrackControls from "./MomentInspectorTrackControls";

type MomentInspectorHostControlStackProps = ComponentProps<
  typeof MomentInspectorTrackControls
>;

export default function MomentInspectorHostControlStack(
  props: MomentInspectorHostControlStackProps
) {
  return <MomentInspectorTrackControls {...props} />;
}
