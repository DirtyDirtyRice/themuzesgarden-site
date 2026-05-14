type TargetHeaderStatus =
  | "Waiting"
  | "Safe route ready"
  | "Already here"
  | "Needs route"
  | string;

function getHeaderTitle({
  hasPath,
  targetLabel,
}: {
  hasPath: boolean;
  targetLabel: string | null;
}) {
  if (!hasPath) {
    return "Waiting for your search";
  }

  if (targetLabel) {
    return `Route ready for ${targetLabel}`;
  }

  return "Route ready for destination";
}

function getHeaderMessage({
  hasPath,
  statusLabel,
}: {
  hasPath: boolean;
  statusLabel: TargetHeaderStatus;
}) {
  if (!hasPath) {
    return "Start typing to activate guided navigation.";
  }

  if (statusLabel === "Already here") {
    return "You are already on the target page. The route confirms your current location.";
  }

  if (statusLabel === "Needs route") {
    return "Find It found a target, but it does not have a safe page route yet.";
  }

  if (statusLabel === "Safe route ready") {
    return "Follow the steps below, then use the safe action button when available.";
  }

  return "Use this panel to understand where you are, where the target is, and how to get there.";
}

function getStatusTone(statusLabel: TargetHeaderStatus) {
  if (statusLabel === "Safe route ready") {
    return "border-emerald-100/35 bg-emerald-100/10 text-emerald-50";
  }

  if (statusLabel === "Already here") {
    return "border-sky-100/35 bg-sky-100/10 text-sky-50";
  }

  if (statusLabel === "Needs route") {
    return "border-yellow-100/35 bg-yellow-100/10 text-yellow-50";
  }

  return "border-white/15 bg-black/20 text-white/60";
}

function getStatusHelp(statusLabel: TargetHeaderStatus) {
  if (statusLabel === "Safe route ready") {
    return "Ready";
  }

  if (statusLabel === "Already here") {
    return "No move needed";
  }

  if (statusLabel === "Needs route") {
    return "Refine search";
  }

  return "Idle";
}

export default function FindItTargetHeader({
  hasPath,
  targetLabel,
  statusLabel,
}: {
  hasPath: boolean;
  targetLabel: string | null;
  statusLabel: string;
}) {
  const title = getHeaderTitle({
    hasPath,
    targetLabel,
  });

  const message = getHeaderMessage({
    hasPath,
    statusLabel,
  });

  const statusTone = getStatusTone(statusLabel);
  const statusHelp = getStatusHelp(statusLabel);

  return (
    <div className="rounded-xl border border-emerald-200/25 bg-emerald-200/10 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
            Target path
          </p>

          <p className="mt-1 text-sm font-semibold text-emerald-50">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-emerald-50/70">
            {message}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${statusTone}`}
          >
            {statusLabel}
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-50/45">
            {statusHelp}
          </span>
        </div>
      </div>
    </div>
  );
}