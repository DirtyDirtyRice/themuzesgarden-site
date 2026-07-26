import type { TimelineDawStage } from "./TimelineDawSystemIntegrationEngine";

export type TimelineDawWorkspaceAreaId =
  | "arrange"
  | "midi"
  | "mix"
  | "automation"
  | "export"
  | "recovery";

export type TimelineDawWorkspaceArea = {
  id: TimelineDawWorkspaceAreaId;
  name: string;
  description: string;
  engineIds: string[];
  ready: boolean;
  completed: number;
  required: number;
};

const areaDefinitions: Array<Omit<TimelineDawWorkspaceArea, "ready" | "completed" | "required">> = [
  {
    id: "arrange",
    name: "Arrange",
    description: "Record, place, trim, and organize audio performances.",
    engineIds: [
      "real-time-audio-graph",
      "multi-track-session",
      "transport-synchronization",
      "recording-take-management",
      "audio-clip-arrangement",
    ],
  },
  {
    id: "midi",
    name: "MIDI & Instruments",
    description: "Perform MIDI and play protected instruments and samples.",
    engineIds: ["midi-performance", "instrument-sampler"],
  },
  {
    id: "mix",
    name: "Mix & Devices",
    description: "Route channels and manage the session's device chains.",
    engineIds: ["mixer-routing", "plugin-device-chain"],
  },
  {
    id: "automation",
    name: "Automation",
    description: "Execute reproducible parameter movement against the transport.",
    engineIds: ["automation-execution"],
  },
  {
    id: "export",
    name: "Render & Export",
    description: "Create verified offline renders and delivery artifacts.",
    engineIds: ["offline-render-export"],
  },
  {
    id: "recovery",
    name: "Recovery",
    description: "Protect session state and recover interrupted work.",
    engineIds: ["session-recovery-performance"],
  },
];

export function createTimelineDawWorkspaceAreas(
  stages: TimelineDawStage[],
): TimelineDawWorkspaceArea[] {
  const stageById = new Map(stages.map((stage) => [stage.engineId, stage]));
  return areaDefinitions.map((definition) => {
    const areaStages = definition.engineIds
      .map((engineId) => stageById.get(engineId))
      .filter((stage): stage is TimelineDawStage => Boolean(stage));
    return {
      ...definition,
      completed: areaStages.filter((stage) => stage.ready).length,
      required: definition.engineIds.length,
      ready:
        areaStages.length === definition.engineIds.length &&
        areaStages.every((stage) => stage.ready),
    };
  });
}
