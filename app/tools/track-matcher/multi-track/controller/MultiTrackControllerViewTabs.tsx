import { MULTI_TRACK_CONTROLLER_VIEWS } from "./multiTrackControllerConstants";
import type {
  MultiTrackControllerSnapshot,
  MultiTrackControllerView,
} from "./multiTrackControllerTypes";
import {
  getMultiTrackControllerViewLabel,
  getMultiTrackViewPanelCountLabel,
} from "./multiTrackControllerViewHelpers";

export function MultiTrackControllerViewTabs({
  snapshot,
}: {
  snapshot: MultiTrackControllerSnapshot;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-2">
      {MULTI_TRACK_CONTROLLER_VIEWS.map((view) => (
        <ViewTab
          key={view}
          isActive={snapshot.activeView === view}
          panelCountLabel={getMultiTrackViewPanelCountLabel(
            snapshot.panelSummaries,
            view,
          )}
          view={view}
        />
      ))}
    </nav>
  );
}

function ViewTab({
  isActive,
  panelCountLabel,
  view,
}: {
  isActive: boolean;
  panelCountLabel: string;
  view: MultiTrackControllerView;
}) {
  return (
    <button
      className={`min-w-fit rounded-xl border px-3 py-2 text-left transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98] ${
        isActive
          ? "border-white/25 bg-white/[0.12] text-white"
          : "border-white/10 bg-white/[0.05] text-white/65"
      }`}
      type="button"
    >
      <span className="block text-xs font-black">
        {getMultiTrackControllerViewLabel(view)}
      </span>
      <span className="mt-1 block text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/45">
        {panelCountLabel}
      </span>
    </button>
  );
}