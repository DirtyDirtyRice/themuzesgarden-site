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
  const shell = useMomentInspectorHostShellState({
    allTracks: props.allTracks,
  }) as any;

  const runtime = (shell?.runtime ?? {}) as any;
  const stackProps = (shell?.stackProps ?? {}) as any;

  const open = Boolean(runtime?.open);
  const setOpen =
    typeof runtime?.setOpen === "function" ? runtime.setOpen : (() => {}) as any;
  const shellState = (runtime?.shellState ?? {}) as any;

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
            {...((stackProps?.controlStackProps ?? {}) as any)}
          />

          {shellState?.selectedTrack ? (
            <>
              <MomentInspectorHostSummaryStack
                {...((stackProps?.summaryStackProps ?? {}) as any)}
              />
              <MomentInspectorHostIntelligenceStack
                {...((stackProps?.intelligenceStackProps ?? {}) as any)}
              />
              <MomentInspectorHostTimelineStack
                {...((stackProps?.timelineStackProps ?? {}) as any)}
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
