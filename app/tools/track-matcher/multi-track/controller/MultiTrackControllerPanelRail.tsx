import type {
  MultiTrackSessionFoundation,
  MultiTrackSessionNote,
  MultiTrackSessionRouteStatus,
  MultiTrackSessionTrackSelection,
} from "../session/multiTrackSessionTypes";

function statusLabel(status: MultiTrackSessionRouteStatus["status"]) {
  if (status === "ready") return "Ready";
  if (status === "foundation") return "Foundation";
  return "Planned";
}

function MiniStatusPill({
  status,
}: {
  status: MultiTrackSessionRouteStatus["status"];
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-white/60">
      {statusLabel(status)}
    </span>
  );
}

function TrackSelectionCard({
  selection,
}: {
  selection: MultiTrackSessionTrackSelection;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
          {selection.trackSlotId === "track-a" ? "Track A" : "Track B"}
        </p>
        <MiniStatusPill status={selection.status} />
      </div>
      <p className="mt-2 text-sm font-black text-white/80">
        {selection.selectedTitle}
      </p>
      <p className="mt-2 text-xs leading-5 text-white/55">
        {selection.selectedSource}
      </p>
    </article>
  );
}

function RouteStatusCard({
  route,
}: {
  route: MultiTrackSessionRouteStatus;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
          {route.view}
        </p>
        <MiniStatusPill status={route.status} />
      </div>
      <p className="mt-2 text-sm font-black text-white/80">
        {route.routeLabel}
      </p>
      <p className="mt-2 text-xs leading-5 text-white/55">
        {route.detail}
      </p>
    </article>
  );
}

function NoteCard({ note }: { note: MultiTrackSessionNote }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/45">
          {note.kind}
        </p>
        <MiniStatusPill status={note.status} />
      </div>
      <p className="mt-2 text-sm font-black text-white/80">{note.title}</p>
      <p className="mt-2 text-xs leading-5 text-white/55">{note.body}</p>
    </article>
  );
}

export function MultiTrackControllerPanelRail({
  foundation,
}: {
  foundation: MultiTrackSessionFoundation;
}) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        {foundation.trackSelections.map((selection) => (
          <TrackSelectionCard key={selection.trackSlotId} selection={selection} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {foundation.routes.slice(0, 6).map((route) => (
          <RouteStatusCard key={route.panelId} route={route} />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {foundation.notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}