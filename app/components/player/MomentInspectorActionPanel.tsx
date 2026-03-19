"use client";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function formatScorePercent(value: number): string {
  const pct = Math.round(clamp01(value) * 100);
  return `${pct}%`;
}

function formatActionType(value: string): string {
  return String(value ?? "")
    .replace(/-/g, " ")
    .trim();
}

function formatTime(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function getStatusTone(status: "present" | "near" | "missing"): string {
  if (status === "present") return "text-emerald-700";
  if (status === "near") return "text-amber-700";
  return "text-red-700";
}

function getCardTone(status: "present" | "near" | "missing"): string {
  if (status === "present") {
    return "border-emerald-100 bg-emerald-50";
  }

  if (status === "near") {
    return "border-amber-100 bg-amber-50";
  }

  return "border-red-100 bg-red-50";
}

function getActionTypeWeight(actionType: string): number {
  if (actionType === "fill-missing-occurrence") return 4;
  if (actionType === "tighten-near-occurrence") return 3;
  if (actionType === "reuse-anchor-phrase") return 2;
  return 1;
}

function getStatusWeight(status: "present" | "near" | "missing"): number {
  if (status === "missing") return 5;
  if (status === "near") return 3;
  return 1;
}

function getActionPriority(action: MomentInspectorActionRow): number {
  return Number(
    (
      getStatusWeight(action.status) +
      getActionTypeWeight(action.actionType) +
      clamp01(action.confidence) * 2
    ).toFixed(3)
  );
}

export type MomentInspectorActionRow = {
  familyId: string;
  targetExpectedAt: number;
  actionType: string;
  status: "present" | "near" | "missing";
  confidence: number;
  sourceMomentId?: string | null;
  nearestMomentId?: string | null;
  anchorMomentId?: string | null;
  reason: string;
};

export type MomentInspectorActionPlanRow = {
  familyId: string;
};

export default function MomentInspectorActionPanel(props: {
  row: MomentInspectorActionPlanRow | null;
  actions: MomentInspectorActionRow[];
}) {
  const { row, actions } = props;

  if (!row) return null;

  const orderedActions = actions
    .slice()
    .sort((a, b) => {
      const priorityCompare = getActionPriority(b) - getActionPriority(a);
      if (priorityCompare !== 0) return priorityCompare;

      if (b.confidence !== a.confidence) return b.confidence - a.confidence;

      return a.targetExpectedAt - b.targetExpectedAt;
    })
    .slice(0, 8);

  const missingCount = actions.filter((action) => action.status === "missing").length;
  const nearCount = actions.filter((action) => action.status === "near").length;
  const presentCount = actions.filter((action) => action.status === "present").length;

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Intended Actions
        </div>

        <div className="text-[10px] text-sky-700">
          {actions.length} candidate{actions.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-1 text-[10px] text-zinc-500">
        family {row.familyId} • missing {missingCount} • near {nearCount} • present {presentCount}
      </div>

      <div className="mt-2 space-y-1">
        {orderedActions.map((action, index) => (
          <div
            key={`${action.familyId}:${action.targetExpectedAt}:${action.actionType}:${index}`}
            className={`rounded border px-2 py-1 ${getCardTone(action.status)}`}
          >
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <div className="min-w-0 truncate font-medium uppercase tracking-wide text-zinc-800">
                {formatActionType(action.actionType)}
              </div>

              <div className={getStatusTone(action.status)}>
                {action.status} • conf {formatScorePercent(action.confidence)}
              </div>
            </div>

            <div className="mt-1 text-[10px] text-zinc-600">
              target {formatTime(action.targetExpectedAt)}
              {action.sourceMomentId ? ` • source ${action.sourceMomentId}` : ""}
              {action.nearestMomentId ? ` • nearest ${action.nearestMomentId}` : ""}
              {action.anchorMomentId ? ` • anchor ${action.anchorMomentId}` : ""}
            </div>

            <div className="mt-1 text-[10px] text-zinc-500">
              priority {getActionPriority(action).toFixed(2)}
            </div>

            <div className="mt-1 text-[10px] leading-relaxed text-zinc-500">
              {action.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}