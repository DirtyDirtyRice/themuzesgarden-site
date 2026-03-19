"use client";

import MomentInspectorHostClosedState from "./MomentInspectorHostClosedState";
import MomentInspectorHostControlStack from "./MomentInspectorHostControlStack";
import MomentInspectorHostEmptyState from "./MomentInspectorHostEmptyState";
import MomentInspectorHostHeader from "./MomentInspectorHostHeader";
import MomentInspectorHostIntelligenceStack from "./MomentInspectorHostIntelligenceStack";
import MomentInspectorHostSummaryStack from "./MomentInspectorHostSummaryStack";
import MomentInspectorHostTimelineStack from "./MomentInspectorHostTimelineStack";
import { useMomentInspectorHostShellState } from "./useMomentInspectorHostShellState";
import type { AnyTrack } from "./playerTypes";

export default function MomentInspector(props: { allTracks: AnyTrack[] }) {
  const { runtime, stackProps } = useMomentInspectorHostShellState({
    allTracks: props.allTracks,
  });

  const { open, setOpen, shellState } = runtime;

  return (
    <div className="rounded-xl border bg-zinc-50 px-3 py-2">
      <MomentInspectorHostHeader
        open={open}
        onToggleOpen={() => setOpen((v: boolean) => !v)}
      />

      {!open ? (
        <MomentInspectorHostClosedState />
      ) : (
        <div className="mt-3 space-y-3">
          <MomentInspectorHostControlStack
            {...stackProps.controlStackProps}
          />

          {shellState.selectedTrack ? (
            <>
              <MomentInspectorHostSummaryStack
                {...stackProps.summaryStackProps}
              />
              <MomentInspectorHostIntelligenceStack
                {...stackProps.intelligenceStackProps}
              />
              <MomentInspectorHostTimelineStack
                {...stackProps.timelineStackProps}
              />
            </>
          ) : (
            <MomentInspectorHostEmptyState />
          )}
        </div>
      )}
    </div>
  );
}