import type {
  MultiTrackExperimentBank,
  MultiTrackExperimentComparePlan,
  MultiTrackExperimentKnob,
  MultiTrackExperimentKnobKind,
  MultiTrackExperimentLane,
  MultiTrackExperimentRenderPlan,
  MultiTrackExperimentStatus,
  MultiTrackExperimentWorkspaceState,
} from "./MultiTrackExperimentTypes";

export function getMultiTrackExperimentStatusLabel(
  status: MultiTrackExperimentStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "testing") return "Testing";
  if (status === "keeper") return "Keeper";
  if (status === "rejected") return "Rejected";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackExperimentKnobKindLabel(
  kind: MultiTrackExperimentKnobKind,
): string {
  if (kind === "pitch") return "Pitch";
  if (kind === "timing") return "Timing";
  if (kind === "gain") return "Gain";
  if (kind === "stretch") return "Stretch";
  if (kind === "pan-future") return "Pan Future";
  if (kind === "filter-future") return "Filter Future";
  if (kind === "texture-future") return "Texture Future";
  if (kind === "reverse-future") return "Reverse Future";
  return "Slice Future";
}

export function getAllMultiTrackExperimentLanes(
  banks: MultiTrackExperimentBank[],
): MultiTrackExperimentLane[] {
  return banks.flatMap((bank) => bank.lanes);
}

export function getKeeperMultiTrackExperimentLanes(
  banks: MultiTrackExperimentBank[],
): MultiTrackExperimentLane[] {
  return getAllMultiTrackExperimentLanes(banks).filter(
    (lane) => lane.status === "keeper",
  );
}

export function getSelectedMultiTrackExperimentLanes(
  banks: MultiTrackExperimentBank[],
): MultiTrackExperimentLane[] {
  return getAllMultiTrackExperimentLanes(banks).filter((lane) => lane.selected);
}

export function getTestingMultiTrackExperimentLanes(
  banks: MultiTrackExperimentBank[],
): MultiTrackExperimentLane[] {
  return getAllMultiTrackExperimentLanes(banks).filter(
    (lane) => lane.status === "testing",
  );
}

export function getMultiTrackExperimentAverageKnobValue(
  lanes: MultiTrackExperimentLane[],
  kind: MultiTrackExperimentKnobKind,
): number {
  const knobs = lanes
    .flatMap((lane) => lane.knobs)
    .filter((knob) => knob.kind === kind);

  if (knobs.length === 0) return 0;

  const total = knobs.reduce((sum, knob) => sum + knob.value, 0);
  return Number((total / knobs.length).toFixed(2));
}

export function getMultiTrackExperimentKnobSpread(
  lanes: MultiTrackExperimentLane[],
  kind: MultiTrackExperimentKnobKind,
): number {
  const values = lanes
    .flatMap((lane) => lane.knobs)
    .filter((knob) => knob.kind === kind)
    .map((knob) => knob.value);

  if (values.length === 0) return 0;

  return Number((Math.max(...values) - Math.min(...values)).toFixed(2));
}

export function getMultiTrackExperimentBankById(
  banks: MultiTrackExperimentBank[],
  bankId: string,
): MultiTrackExperimentBank | null {
  return banks.find((bank) => bank.id === bankId) ?? null;
}

export function getMultiTrackExperimentLaneById(
  banks: MultiTrackExperimentBank[],
  laneId: string,
): MultiTrackExperimentLane | null {
  return getAllMultiTrackExperimentLanes(banks).find((lane) => lane.id === laneId) ?? null;
}

export function getMultiTrackExperimentBankKeeperLane(
  bank: MultiTrackExperimentBank,
): MultiTrackExperimentLane | null {
  if (!bank.keeperLaneId) return null;
  return bank.lanes.find((lane) => lane.id === bank.keeperLaneId) ?? null;
}

export function getMultiTrackExperimentKnobSummary(knob: MultiTrackExperimentKnob): string {
  const label = getMultiTrackExperimentKnobKindLabel(knob.kind);
  const neutralDelta = Number((knob.value - knob.neutralValue).toFixed(2));

  return `${label}: ${knob.value}${knob.unit} (${neutralDelta >= 0 ? "+" : ""}${neutralDelta} from neutral)`;
}

export function getMultiTrackExperimentBankSummary(bank: MultiTrackExperimentBank): string {
  const keeper = getMultiTrackExperimentBankKeeperLane(bank);
  const selectedCount = bank.lanes.filter((lane) => lane.selected).length;
  const testingCount = bank.lanes.filter((lane) => lane.status === "testing").length;

  return `${bank.lanes.length} lanes · ${selectedCount} selected · ${testingCount} testing · keeper ${keeper?.label ?? "not chosen"}`;
}

export function getMultiTrackExperimentComparePlanSummary(
  plan: MultiTrackExperimentComparePlan,
): string {
  return `${plan.laneIds.length} lanes · ${plan.compareTargets
    .map(getMultiTrackExperimentKnobKindLabel)
    .join(", ")}`;
}

export function getMultiTrackExperimentRenderPlanSummary(
  plan: MultiTrackExperimentRenderPlan,
): string {
  return `${plan.keeperLaneIds.length} keepers · ${plan.outputLabel}`;
}

export function getMultiTrackExperimentWorkspaceMetrics(
  state: MultiTrackExperimentWorkspaceState,
): {
  bankCount: number;
  laneCount: number;
  selectedCount: number;
  testingCount: number;
  keeperCount: number;
  renderPlanCount: number;
} {
  const lanes = getAllMultiTrackExperimentLanes(state.banks);

  return {
    bankCount: state.banks.length,
    laneCount: lanes.length,
    selectedCount: lanes.filter((lane) => lane.selected).length,
    testingCount: getTestingMultiTrackExperimentLanes(state.banks).length,
    keeperCount: getKeeperMultiTrackExperimentLanes(state.banks).length,
    renderPlanCount: state.renderPlans.length,
  };
}

export function getMultiTrackExperimentReadinessPercent(
  state: MultiTrackExperimentWorkspaceState,
): number {
  const lanes = getAllMultiTrackExperimentLanes(state.banks);
  if (lanes.length === 0) return 0;

  const active = lanes.filter(
    (lane) =>
      lane.status === "ready" ||
      lane.status === "testing" ||
      lane.status === "keeper",
  ).length;

  return Math.round((active / lanes.length) * 100);
}

export function getMultiTrackExperimentDistanceLabel(
  state: MultiTrackExperimentWorkspaceState,
): string {
  const metrics = getMultiTrackExperimentWorkspaceMetrics(state);

  if (metrics.keeperCount >= 2) return "Keeper experiment engine";
  if (metrics.laneCount >= 10) return "Monster duplicate lab";
  if (metrics.laneCount > 0) return "Experiment lanes seeded";
  return "Planning only";
}