import type {
  MultiTrackControllerSnapshot,
} from "./multiTrackControllerTypes";
import { MultiTrackControllerPanelRail } from "./MultiTrackControllerPanelRail";
import { MultiTrackControllerViewTabs } from "./MultiTrackControllerViewTabs";
import {
  getMultiTrackControllerViewLabel,
} from "./multiTrackControllerViewHelpers";
import {
  createMultiTrackSessionFoundation,
} from "../session/multiTrackSessionHelpers";
import {
  getMultiTrackSessionReadinessLabel,
} from "../session/multiTrackSessionState";

export function MultiTrackControllerSummary({
  snapshot,
}: {
  snapshot: MultiTrackControllerSnapshot;
}) {
  const foundation = createMultiTrackSessionFoundation(snapshot);
  const activeTrackSlot = snapshot.trackSlots.find(
    (slot) => slot.id === snapshot.activeTrackSlot,
  );

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Multi-Track Controller Foundation
          </p>
          <h2 className="mt-2 text-xl font-black text-white">
            {getMultiTrackControllerViewLabel(snapshot.activeView)} Session
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
            Session-only controller shell. This is not audio runtime and does not
            own playback. It maps future Track A, Track B, route, note, and save
            state before the real Multi-Track controller exists.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
          {getMultiTrackSessionReadinessLabel(snapshot)}
        </span>
      </div>

      <div className="mt-4">
        <MultiTrackControllerViewTabs snapshot={snapshot} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Active Track Slot
          </p>
          <p className="mt-2 text-sm font-black text-white/80">
            {activeTrackSlot?.label ?? "Track A"}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/55">
            {activeTrackSlot?.sourceLabel ?? "Waiting for source routing."}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Session Health
          </p>
          <p className="mt-2 text-sm font-black text-white/80">
            {foundation.health.label}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/55">
            {foundation.health.detail}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
            Controller Rule
          </p>
          <p className="mt-2 text-sm font-black text-white/80">
            Page stays thin, controller coordinates, session stores UI state.
          </p>
          <p className="mt-2 text-xs leading-5 text-white/55">
            Future adapters can connect Track Matcher systems without placing
            runtime code inside Multi-Track.
          </p>
        </article>
      </div>

      <div className="mt-4">
        <MultiTrackControllerPanelRail foundation={foundation} />
      </div>
    </section>
  );
}